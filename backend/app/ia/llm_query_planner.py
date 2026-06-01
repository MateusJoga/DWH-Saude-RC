import json
import logging
import re
from typing import Any

from app.config import settings
from app.ia.intent_classifier import remover_acentos
from app.ia.llm_client import call_llm
from app.ia.query_plan import OrderBy, QueryPlan, RouterDecision
from app.ia.query_plan_validator import validate_query_plan
from app.ia.semantic_catalog import catalog_for_prompt

logger = logging.getLogger("dw_backend")

LLM_QUERY_PLAN_FIELDS = {
    "tipo",
    "assunto",
    "tabela",
    "metrica",
    "dimensoes",
    "filtros",
    "agrupamento",
    "ordenacao",
    "limite",
    "necessita_sql",
    "dashboard",
}

FORBIDDEN_LLM_FIELDS = {"table", "metrics", "dimensions", "filters", "order_by"}

MONTHS = {
    "JANEIRO": 1,
    "FEVEREIRO": 2,
    "MARCO": 3,
    "MARÇO": 3,
    "ABRIL": 4,
    "MAIO": 5,
    "JUNHO": 6,
    "JULHO": 7,
    "AGOSTO": 8,
    "SETEMBRO": 9,
    "OUTUBRO": 10,
    "NOVEMBRO": 11,
    "DEZEMBRO": 12,
}


def _clean(pergunta: str) -> str:
    return remover_acentos(pergunta.upper())


def _extract_filters(pergunta: str) -> dict[str, Any]:
    text = _clean(pergunta)
    filters: dict[str, Any] = {}

    year = re.search(r"\b(19|20)\d{2}\b", text)
    if year:
        filters["ano"] = int(year.group(0))

    years = [int(match) for match in re.findall(r"\b(?:19|20)\d{2}\b", text)]
    if len(years) >= 2 and any(term in text for term in ("ENTRE", "COMPARE", "COMPARAR", "COMPARACAO")):
        filters["ano"] = {"gte": min(years), "lte": max(years)}

    found_months = [number for name, number in MONTHS.items() if re.search(rf"\b{name}\b", text)]
    if len(found_months) == 1:
        filters["mes"] = found_months[0]
    elif len(found_months) >= 2 and "ENTRE" in text:
        filters["mes"] = {"gte": min(found_months), "lte": max(found_months)}

    if "MULHER" in text or "FEMININ" in text:
        filters["sexo"] = "F"
    elif "HOMEM" in text or "MASCULIN" in text:
        filters["sexo"] = "M"

    if "IDOSO" in text or "IDOSOS" in text or "IDOSA" in text or "IDOSAS" in text:
        filters["faixa_etaria"] = "Idoso"

    if "ALTA COMPLEXIDADE" in text:
        filters["complexidade"] = "Alta Complexidade"

    if "ALTO CUSTO" in text:
        filters["procedimento_alto_custo"] = True

    return filters


def _plan_for_analytical(pergunta: str, decision: RouterDecision | None = None) -> QueryPlan:
    text = _clean(pergunta)
    filters = _extract_filters(pergunta)
    subject = decision.assunto if decision else None

    if any(term in text for term in ("DIFERENCA", "COMPARA", "COMPARACAO")) and (
        ("MASCULIN" in text or "HOMEM" in text or "HOMENS" in text)
        and ("FEMININ" in text or "MULHER" in text or "MULHERES" in text)
    ):
        filters.pop("sexo", None)
        return QueryPlan(
            tipo="analytical",
            assunto="internacoes",
            tabela="ouro.fato_internacoes",
            metrica="quantidade_internacoes",
            dimensoes=["sexo"],
            agrupamento=["sexo"],
            filtros=filters,
            ordenacao=OrderBy(campo="quantidade_internacoes", direcao="DESC"),
            limite=10,
            intencao=(decision.intencao if decision else "analytical_dynamic"),
        )

    if any(term in text for term in ("COMPARE", "COMPARAR", "COMPARACAO")) and isinstance(filters.get("ano"), dict):
        return QueryPlan(
            tipo="analytical",
            assunto="internacoes",
            tabela="ouro.agg_internacoes_mensais",
            metrica="quantidade_internacoes",
            dimensoes=["ano"],
            agrupamento=["ano"],
            filtros=filters,
            ordenacao=OrderBy(campo="ano", direcao="ASC"),
            limite=10,
            intencao=(decision.intencao if decision else "analytical_dynamic"),
        )

    if "PROCED" in text:
        table = "ouro.agg_procedimentos_mensais"
        if "CUSTO MEDIO" in text or "CUSTO MÃ‰DIO" in text or ("CUSTO" in text and "MEDI" in text):
            metric = "valor_medio_procedimento"
        elif any(term in text for term in ("VALOR", "CUSTO", "FINANCEIR")):
            metric = "valor_total_procedimentos"
        else:
            metric = "total_procedimentos"
        if "complexidade" in filters or "procedimento_alto_custo" in filters:
            table = "ouro.agg_procedimentos_mensais"
        return QueryPlan(
            tipo="analytical",
            assunto="procedimentos",
            tabela=table,
            metrica=metric,
            dimensoes=["codigo_procedimento"],
            agrupamento=["codigo_procedimento"],
            filtros=filters,
            ordenacao=OrderBy(campo=metric, direcao="DESC"),
            limite=10,
            intencao=(decision.intencao if decision else "analytical_dynamic"),
        )

    if "DOENC" in text and "FREQUENT" in text:
        subject = "cid"

    if "MOTIVO" in text and "INTERNAC" in text:
        subject = "cid"

    if "CID" in text or "DIAGNOST" in text or "DOENC" in text or subject == "cid":
        needs_fact = "sexo" in filters or "faixa_etaria" in filters
        metric = "quantidade_obitos" if "OBITO" in text or "MORTE" in text else "quantidade_internacoes"
        table = "ouro.fato_internacoes" if needs_fact else "ouro.agg_cid_mensal"
        return QueryPlan(
            tipo="analytical",
            assunto="cid",
            tabela=table,
            metrica=metric,
            dimensoes=["codigo_cid", "grupo_cid"],
            agrupamento=["codigo_cid", "grupo_cid"],
            filtros=filters,
            ordenacao=OrderBy(campo=metric, direcao="DESC"),
            limite=10,
            intencao=(decision.intencao if decision else "analytical_dynamic"),
        )

    if "TIPO" in text and "INTERNAC" in text:
        return QueryPlan(
            tipo="analytical",
            assunto="internacoes",
            tabela="ouro.fato_internacoes",
            metrica="quantidade_internacoes",
            dimensoes=["tipo_identificacao"],
            agrupamento=["tipo_identificacao"],
            filtros=filters,
            ordenacao=OrderBy(campo="quantidade_internacoes", direcao="DESC"),
            limite=10,
            intencao=(decision.intencao if decision else "analytical_dynamic"),
        )

    if "ESPECIALIDADE" in text and "INTERNAC" in text:
        return QueryPlan(
            tipo="analytical",
            assunto="internacoes",
            tabela="ouro.fato_internacoes",
            metrica="quantidade_internacoes",
            dimensoes=["especialidade"],
            agrupamento=["especialidade"],
            filtros=filters,
            ordenacao=OrderBy(campo="quantidade_internacoes", direcao="DESC"),
            limite=10,
            intencao=(decision.intencao if decision else "analytical_dynamic"),
        )

    if "CUSTO MEDIO" in text or "CUSTO MÉDIO" in text:
        return QueryPlan(
            tipo="analytical",
            assunto="hospitais",
            tabela="ouro.fato_internacoes",
            metrica="custo_medio_internacao",
            dimensoes=["cnes", "municipio_hospital"],
            agrupamento=["cnes", "municipio_hospital"],
            filtros=filters,
            ordenacao=OrderBy(campo="custo_medio_internacao", direcao="DESC"),
            limite=10,
            intencao=(decision.intencao if decision else "analytical_dynamic"),
        )

    metric = "valor_total_internacoes" if any(term in text for term in ("CUSTO", "VALOR", "GASTO")) else "quantidade_internacoes"
    if "OBITO" in text or "MORTALIDADE" in text:
        metric = "quantidade_obitos"

    return QueryPlan(
        tipo="analytical",
        assunto="hospitais",
        tabela="ouro.agg_hospital_mensal",
        metrica=metric,
        dimensoes=["cnes", "municipio_hospital"],
        agrupamento=["cnes", "municipio_hospital"],
        filtros=filters,
        ordenacao=OrderBy(campo=metric, direcao="DESC"),
        limite=10,
        intencao=(decision.intencao if decision else "analytical_dynamic"),
    )


def _fallback_plan(pergunta: str, decision: RouterDecision | None = None) -> QueryPlan:
    if decision and decision.tipo == "dashboard":
        return QueryPlan(
            tipo="dashboard",
            assunto=decision.assunto,
            necessita_sql=False,
            dashboard=decision.dashboard or decision.assunto,
            intencao=decision.intencao,
        )
    if decision and decision.tipo == "metadata":
        return QueryPlan(tipo="metadata", assunto="catalogo", necessita_sql=False, intencao=decision.intencao)
    if decision and decision.tipo == "conceptual":
        return QueryPlan(tipo="conceptual", assunto=decision.assunto, necessita_sql=False, intencao=decision.intencao)
    if decision and decision.tipo == "blocked":
        return QueryPlan(tipo="blocked", assunto=decision.assunto, necessita_sql=False, intencao=decision.intencao)
    if decision and decision.tipo == "unknown":
        return QueryPlan(tipo="unknown", assunto=decision.assunto, necessita_sql=False, intencao=decision.intencao)
    return _plan_for_analytical(pergunta, decision)


def _build_planner_prompt(pergunta: str, decision: RouterDecision | None = None) -> str:
    catalog = json.dumps(catalog_for_prompt(), ensure_ascii=False, indent=2)
    router_context = decision.public_dict() if decision else {}
    return (
        "Voce e um planejador NL2SQL seguro para um Data Warehouse de saude publica.\n"
        "Sua unica saida deve ser um JSON valido, sem Markdown, sem comentarios e sem SQL.\n"
        "Nunca gere SQL, nunca explique, nunca inclua texto fora do JSON.\n"
        "O backend vai validar o plano e gerar o SQL final.\n\n"
        "O JSON deve conter exatamente estes campos, todos presentes e sem nenhum campo extra:\n"
        "- tipo\n"
        "- assunto\n"
        "- tabela\n"
        "- metrica\n"
        "- dimensoes\n"
        "- filtros\n"
        "- agrupamento\n"
        "- ordenacao\n"
        "- limite\n"
        "- necessita_sql\n"
        "- dashboard\n\n"
        "Nao use campos em ingles ou aliases. Campos proibidos: table, metrics, dimensions, filters, order_by.\n"
        "Para perguntas analiticas, use tipo='analytical', necessita_sql=true e apenas tabelas do catalogo permitido.\n"
        "Para filtros de intervalo, use {'gte': valor, 'lte': valor}. Para ordenacao, use {'campo': nome, 'direcao': 'ASC' ou 'DESC'}.\n"
        "O campo dashboard deve ser sempre string ou null. Nunca retorne boolean em dashboard.\n"
        "O campo agrupamento deve ser sempre array de strings, por exemplo ['cnes', 'municipio_hospital'].\n"
        "Nunca use objetos dentro de agrupamento. Nunca use {'campo': ..., 'func': ...} em agrupamento.\n"
        "O campo ordenacao deve ser um objeto unico {'campo': 'nome_do_campo', 'direcao': 'DESC'}, nunca uma lista.\n"
        "Nao crie funcoes como SUM, COUNT, AVG ou func dentro do QueryPlan; agregacoes sao decididas pelo backend/sql_builder.\n"
        "Prefira views agg_* quando elas responderem diretamente a pergunta. Exemplo: hospitais com mais internacoes por ano deve usar ouro.agg_hospital_mensal.\n"
        "Para campos nao aplicaveis, use null, [] ou {} conforme o tipo do campo.\n"
        "Use limite maximo 100.\n\n"
        "Exemplo valido para 'Quais hospitais tiveram mais internações em 2020?':\n"
        "{\n"
        '  "tipo": "analytical",\n'
        '  "assunto": "hospitais",\n'
        '  "tabela": "ouro.agg_hospital_mensal",\n'
        '  "metrica": "quantidade_internacoes",\n'
        '  "dimensoes": ["cnes", "municipio_hospital"],\n'
        '  "filtros": {"ano": 2020},\n'
        '  "agrupamento": ["cnes", "municipio_hospital"],\n'
        '  "ordenacao": {"campo": "quantidade_internacoes", "direcao": "DESC"},\n'
        '  "limite": 10,\n'
        '  "necessita_sql": true,\n'
        '  "dashboard": null\n'
        "}\n\n"
        f"Contexto do router:\n{json.dumps(router_context, ensure_ascii=False)}\n\n"
        f"Catalogo permitido:\n{catalog}\n\n"
        f"Pergunta: {pergunta}"
    )


def _strip_json_fence(response: str) -> str:
    raw_json = response.strip()
    if raw_json.startswith("```"):
        raw_json = raw_json.strip("`")
        raw_json = raw_json.removeprefix("json").strip()
    return raw_json


def _parse_llm_query_plan(response: str) -> QueryPlan:
    raw_json = _strip_json_fence(response)
    logger.info("Payload bruto retornado pela LLM antes da validacao do QueryPlan: %s", raw_json)
    payload = json.loads(raw_json)
    if not isinstance(payload, dict):
        raise ValueError("Resposta da LLM nao e um objeto JSON.")

    fields = set(payload)
    forbidden = fields & FORBIDDEN_LLM_FIELDS
    if forbidden:
        raise ValueError(f"Resposta da LLM contem campos proibidos: {', '.join(sorted(forbidden))}")

    if fields != LLM_QUERY_PLAN_FIELDS:
        missing = LLM_QUERY_PLAN_FIELDS - fields
        extra = fields - LLM_QUERY_PLAN_FIELDS
        details = []
        if missing:
            details.append(f"faltando: {', '.join(sorted(missing))}")
        if extra:
            details.append(f"extras: {', '.join(sorted(extra))}")
        raise ValueError("Resposta da LLM fora do contrato QueryPlan (" + "; ".join(details) + ").")

    if payload.get("dashboard") is False:
        payload["dashboard"] = None
    elif payload.get("dashboard") is True:
        payload["dashboard"] = "geral"

    payload = _normalize_llm_payload(payload)
    return QueryPlan.model_validate(payload)


def _normalize_llm_payload(payload: dict[str, Any]) -> dict[str, Any]:
    grouping = payload.get("agrupamento")
    if isinstance(grouping, list):
        normalized_grouping = []
        for item in grouping:
            if isinstance(item, str):
                normalized_grouping.append(item)
            elif isinstance(item, dict) and isinstance(item.get("campo"), str):
                normalized_grouping.append(item["campo"])
        payload["agrupamento"] = normalized_grouping

    ordering = payload.get("ordenacao")
    if isinstance(ordering, list):
        payload["ordenacao"] = ordering[0] if ordering else None

    return payload


def gerar_query_plan(pergunta: str, decision: RouterDecision | None = None) -> QueryPlan:
    provider = settings.llm_provider.lower().strip()
    if provider == "none":
        logger.info("QueryPlan via fallback local | provider=none")
        return validate_query_plan(_fallback_plan(pergunta, decision))

    if decision and decision.tipo in {"metadata", "conceptual", "dashboard", "blocked", "unknown"}:
        logger.info(
            "QueryPlan sem LLM para tipo local | provider=%s | tipo=%s | fallback=local",
            provider,
            decision.tipo,
        )
        return validate_query_plan(_fallback_plan(pergunta, decision))

    prompt = _build_planner_prompt(pergunta, decision)
    try:
        response = call_llm(prompt)
        if not response:
            logger.warning("LLM nao retornou QueryPlan. Usando fallback local | provider=%s", provider)
            return validate_query_plan(_fallback_plan(pergunta, decision))

        plan = _parse_llm_query_plan(response)
        logger.info("QueryPlan gerado por LLM e validado | provider=%s | tabela=%s | metrica=%s", provider, plan.tabela, plan.metrica)
        return validate_query_plan(plan)
    except Exception as exc:
        logger.error("Falha ao gerar QueryPlan via LLM. Usando fallback local | provider=%s | erro=%s", provider, exc)
        return validate_query_plan(_fallback_plan(pergunta, decision))
