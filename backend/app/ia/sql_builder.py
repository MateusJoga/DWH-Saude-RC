import re
from typing import Any

from app.ia.query_plan import QueryPlan
from app.ia.query_plan_validator import QueryPlanValidationError, validate_query_plan
from app.ia.semantic_catalog import MetricDef, get_table

IDENTIFIER_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")
TABLE_RE = re.compile(r"^ouro\.[a-zA-Z_][a-zA-Z0-9_]*$")


def _safe_identifier(identifier: str) -> str:
    if not IDENTIFIER_RE.match(identifier):
        raise QueryPlanValidationError(f"Identificador invalido: {identifier}")
    return identifier


def _safe_table(table_name: str) -> str:
    if not TABLE_RE.match(table_name):
        raise QueryPlanValidationError(f"Tabela invalida: {table_name}")
    return table_name


def _metric_expression(metric_def: MetricDef) -> str:
    alias = _safe_identifier(metric_def.name)
    source = metric_def.source_column
    if metric_def.name == "quantidade_obitos" and source == "obito":
        return f"SUM(CASE WHEN obito = 1 THEN 1 ELSE 0 END) AS {alias}"

    if metric_def.aggregation == "count" and source is None:
        return f"COUNT(*) AS {alias}"

    source_column = _safe_identifier(source or metric_def.name)
    if metric_def.aggregation == "avg":
        return f"AVG({source_column}) AS {alias}"
    if metric_def.aggregation == "count":
        return f"COUNT({source_column}) AS {alias}"
    return f"SUM({source_column}) AS {alias}"


def _add_filter(
    where_parts: list[str],
    params: dict[str, Any],
    field: str,
    value: Any,
    index: int,
    data_type: str,
) -> int:
    column = _safe_identifier(field)

    if isinstance(value, dict):
        for op, op_value in value.items():
            param_name = f"p{index}_{column}_{op}"
            if op == "gte":
                where_parts.append(f"{column} >= :{param_name}")
            elif op == "lte":
                where_parts.append(f"{column} <= :{param_name}")
            elif op == "like":
                where_parts.append(f"{column} LIKE :{param_name}")
                op_value = f"%{op_value}%"
            else:
                where_parts.append(f"{column} = :{param_name}")
            params[param_name] = op_value
            index += 1
        return index

    param_name = f"p{index}_{column}"
    if data_type == "string" and isinstance(value, str) and "%" in value:
        where_parts.append(f"{column} LIKE :{param_name}")
    else:
        where_parts.append(f"{column} = :{param_name}")
    params[param_name] = value
    return index + 1


def build_sql_from_query_plan(plan: QueryPlan) -> tuple[str, dict[str, Any]]:
    validated_plan = validate_query_plan(plan)
    if validated_plan.tipo != "analytical":
        raise QueryPlanValidationError("Somente QueryPlan analitico pode gerar SQL.")

    table = get_table(validated_plan.tabela or "")
    if not table or not validated_plan.metrica:
        raise QueryPlanValidationError("QueryPlan analitico incompleto.")

    table_name = _safe_table(table.name)
    metric = table.metrics[validated_plan.metrica]
    dimensions = [_safe_identifier(dimension) for dimension in validated_plan.dimensoes]
    grouping = [_safe_identifier(field) for field in (validated_plan.agrupamento or validated_plan.dimensoes)]
    metric_sql = _metric_expression(metric)

    select_columns = [*dimensions, metric_sql]
    sql_parts = [
        f"SELECT TOP {validated_plan.limite}",
        "    " + ",\n    ".join(select_columns),
        f"FROM {table_name}",
    ]

    params: dict[str, Any] = {}
    where_parts: list[str] = []
    param_index = 1
    for field, value in validated_plan.filtros.items():
        column_def = table.dimensions[field]
        param_index = _add_filter(where_parts, params, field, value, param_index, column_def.data_type)

    if where_parts:
        sql_parts.append("WHERE " + " AND ".join(where_parts))

    if grouping:
        sql_parts.append("GROUP BY " + ", ".join(grouping))

    if validated_plan.ordenacao:
        order_field = _safe_identifier(validated_plan.ordenacao.campo)
        direction = validated_plan.ordenacao.direcao
        sql_parts.append(f"ORDER BY {order_field} {direction}")
    else:
        sql_parts.append(f"ORDER BY {metric.name} DESC")

    return "\n".join(sql_parts) + ";", params
