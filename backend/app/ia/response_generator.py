from typing import Any

from app.ia.query_plan import QueryPlan


def formatar_moeda(valor: Any) -> str:
    try:
        num = float(valor)
        return f"R$ {num:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        return "R$ 0,00"


def formatar_numero(valor: Any) -> str:
    try:
        num = int(valor)
        return f"{num:,}".replace(",", ".")
    except (ValueError, TypeError):
        try:
            num = float(valor)
            return f"{num:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        except (ValueError, TypeError):
            return "0"


def _format_value(field: str, value: Any) -> str:
    if value is None:
        return "N/D"
    if "valor" in field or "custo" in field:
        return formatar_moeda(value)
    if isinstance(value, (int, float)):
        return formatar_numero(value)
    return str(value)


def _label(field: str) -> str:
    labels = {
        "cnes": "CNES",
        "municipio_hospital": "município",
        "codigo_cid": "CID",
        "grupo_cid": "grupo CID",
        "codigo_procedimento": "procedimento",
        "quantidade_internacoes": "internações",
        "quantidade_obitos": "óbitos",
        "valor_total_internacoes": "valor total de internações",
        "valor_total_procedimentos": "valor total de procedimentos",
        "custo_medio_internacao": "custo médio por internação",
        "total_procedimentos": "procedimentos",
        "quantidade_procedimentos": "procedimentos",
    }
    return labels.get(field, field.replace("_", " "))


def generate_ia_response(
    pergunta: str,
    intent_or_plan: str | QueryPlan,
    rows: list[dict[str, Any]],
    sql_aprovado: str | None = None,
) -> dict[str, Any]:
    if isinstance(intent_or_plan, QueryPlan):
        plan = intent_or_plan
        metric = plan.metrica or "resultado"
        dimensions = plan.dimensoes
        subject = plan.assunto or "dados"
    else:
        plan = None
        metric = "resultado"
        dimensions = []
        subject = intent_or_plan

    if not rows:
        return {
            "resposta": (
                "Consultei a camada Ouro do Data Warehouse, mas não encontrei registros para os filtros "
                "e critérios informados."
            ),
            "insights": [
                "Confira se há carga de dados para o período solicitado.",
                "Tente remover filtros muito específicos ou consultar outro período.",
            ],
        }

    first = rows[0]
    dimension_parts = []
    for dimension in dimensions:
        if dimension in first:
            dimension_parts.append(f"{_label(dimension)} {first[dimension]}")

    metric_value = first.get(metric)
    metric_text = _format_value(metric, metric_value)
    subject_text = subject.replace("_", " ")

    if dimension_parts:
        main_result = ", ".join(dimension_parts)
        resposta = (
            f"Com base na camada Ouro, o principal resultado para {subject_text} foi {main_result}, "
            f"com {_label(metric)} igual a {metric_text}."
        )
    else:
        resposta = (
            f"Com base na camada Ouro, encontrei {len(rows)} registro(s) para a pergunta. "
            f"O principal valor de {_label(metric)} foi {metric_text}."
        )

    insights = [
        f"A consulta retornou {len(rows)} linha(s) após aplicação dos filtros validados.",
        "O SQL foi gerado pelo backend a partir de um QueryPlan validado, sem executar SQL livre de LLM.",
    ]

    if plan and plan.filtros:
        filtros = ", ".join(f"{key}={value}" for key, value in plan.filtros.items())
        insights.append(f"Filtros aplicados: {filtros}.")

    if sql_aprovado:
        insights.append("A consulta foi limitada e executada somente em objetos permitidos do schema ouro.")

    return {"resposta": resposta, "insights": insights}
