import logging
import re
from typing import Any

from app.ia.query_plan import QueryPlan
from app.ia.semantic_catalog import get_table

logger = logging.getLogger("dw_backend")

MAX_QUERY_LIMIT = 100
BLOCKED_SQL_PATTERNS = re.compile(
    r"(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b|\bALTER\b|\bTRUNCATE\b|\bEXEC\b|\bMERGE\b|;|--|/\*|\*/|\bBRONZE\b|\bPRATA\b|\bSYS\b|\bDBO\b)",
    re.IGNORECASE,
)


class QueryPlanValidationError(ValueError):
    pass


def _contains_sql(value: Any) -> bool:
    if isinstance(value, str):
        return bool(BLOCKED_SQL_PATTERNS.search(value))
    if isinstance(value, dict):
        return any(_contains_sql(item) for item in value.values())
    if isinstance(value, list):
        return any(_contains_sql(item) for item in value)
    return False


def _validate_filter_value(field: str, value: Any) -> None:
    if value in (None, ""):
        raise QueryPlanValidationError(f"Filtro sem valor: {field}")
    if isinstance(value, dict):
        invalid_ops = set(value) - {"eq", "like", "gte", "lte"}
        if invalid_ops:
            raise QueryPlanValidationError(f"Operadores invalidos no filtro {field}: {', '.join(invalid_ops)}")
        for op_value in value.values():
            if op_value in (None, ""):
                raise QueryPlanValidationError(f"Filtro sem valor: {field}")


def validate_query_plan(plan: QueryPlan) -> QueryPlan:
    if _contains_sql(plan.public_dict()):
        raise QueryPlanValidationError("QueryPlan contem SQL bruto, schemas proibidos ou comandos bloqueados.")

    if plan.tipo != "analytical":
        return plan

    if not plan.tabela:
        raise QueryPlanValidationError("QueryPlan analitico sem tabela.")

    if not plan.tabela.startswith("ouro."):
        raise QueryPlanValidationError("Somente tabelas do schema ouro sao permitidas.")

    table = get_table(plan.tabela)
    if not table:
        raise QueryPlanValidationError(f"Tabela nao permitida para IA: {plan.tabela}")

    if not plan.metrica:
        raise QueryPlanValidationError("QueryPlan analitico sem metrica.")

    if plan.metrica not in table.metrics:
        raise QueryPlanValidationError(f"Metrica nao permitida para {plan.tabela}: {plan.metrica}")

    invalid_dimensions = [dimension for dimension in plan.dimensoes if dimension not in table.dimensions]
    if invalid_dimensions:
        raise QueryPlanValidationError(f"Dimensoes nao permitidas: {', '.join(invalid_dimensions)}")

    grouping = plan.agrupamento or plan.dimensoes
    invalid_grouping = [field for field in grouping if field not in table.dimensions]
    if invalid_grouping:
        raise QueryPlanValidationError(f"Agrupamentos nao permitidos: {', '.join(invalid_grouping)}")
    plan.agrupamento = grouping

    for filter_name, filter_value in plan.filtros.items():
        if filter_name not in table.filters or filter_name not in table.dimensions:
            raise QueryPlanValidationError(f"Filtro nao permitido para {plan.tabela}: {filter_name}")
        _validate_filter_value(filter_name, filter_value)

    if plan.ordenacao:
        if plan.ordenacao.campo not in table.columns:
            raise QueryPlanValidationError(f"Campo de ordenacao nao permitido: {plan.ordenacao.campo}")

    if plan.limite > MAX_QUERY_LIMIT:
        logger.info("Limite do QueryPlan ajustado de %s para %s.", plan.limite, MAX_QUERY_LIMIT)
        plan.limite = MAX_QUERY_LIMIT

    return plan
