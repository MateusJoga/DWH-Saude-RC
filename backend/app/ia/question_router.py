import logging
import re

from app.config import settings
from app.ia.conceptual_responder import CONCEPTUAL_TERMS
from app.ia.dashboard_router import route_dashboard
from app.ia.intent_classifier import classify_intent, remover_acentos
from app.ia.query_plan import RouterDecision
from app.ia.safety import is_query_safe

logger = logging.getLogger("dw_backend")

CONCEPTUAL_TRIGGERS = [
    "O QUE E",
    "O QUE SIGNIFICA",
    "SIGNIFICADO DE",
    "EXPLIQUE",
    "EXPLICA",
    "DEFINA",
    "DEFINICAO",
    "O QUE REPRESENTA",
    "DIFERENCA ENTRE",
]

ANALYTICAL_TERMS = [
    "MAIOR",
    "MENOR",
    "MAIS",
    "MENOS",
    "QUANTIDADE",
    "RANKING",
    "TOP",
    "OCORRENCIA",
    "OCORRENCIAS",
    "INTERNACAO",
    "INTERNACOES",
    "OBITO",
    "OBITOS",
    "CUSTO",
    "VALOR",
    "MEDIA",
    "COMPARACAO",
    "CRESCIMENTO",
    "ANO",
    "MES",
    "PERIODO",
    "ENTRE",
    "TOTAL",
    "FREQUENTES",
]

METADATA_TERMS = [
    "QUAIS INDICADORES",
    "INDICADORES DISPONIVEIS",
    "QUAIS DADOS",
    "DADOS POSSO CONSULTAR",
    "TABELAS DISPONIVEIS",
    "O QUE POSSO CONSULTAR",
]

METADATA_PATTERNS = [
    r"\bTABELAS?\b",
    r"\bVIEWS?\b",
    r"\bBASES?\b",
    r"\bFONTES?\b",
    r"\bCAMADA\s+OURO\b",
    r"\bCAMPOS?\s+(?:ESTAO\s+)?DISPONIVEIS\b",
    r"\bCOLUNAS?\s+(?:ESTAO\s+)?DISPONIVEIS\b",
    r"\bESTRUTURA\s+DOS\s+DADOS\b",
    r"\bESQUEMA\b",
    r"\bCATALOGO\b",
]


def _clean(pergunta: str) -> str:
    return remover_acentos(pergunta.upper())


def _subject_for(text: str) -> str | None:
    if "PROCED" in text:
        return "procedimentos"
    if "HOSPITAL" in text or "HOSPITAIS" in text or "CNES" in text:
        return "hospitais"
    if "CID" in text or "DIAGNOST" in text or "DOENC" in text or "PATOLOG" in text:
        return "cid"
    if "DASHBOARD" in text or "PAINEL" in text:
        return "dashboard"
    if "AIH" in text:
        return "aih"
    return None


def _is_gender_comparison(text: str) -> bool:
    has_comparison = any(term in text for term in ("DIFERENCA", "COMPARA", "COMPARACAO"))
    has_male = "MASCULIN" in text or "HOMEM" in text or "HOMENS" in text
    has_female = "FEMININ" in text or "MULHER" in text or "MULHERES" in text
    return has_comparison and has_male and has_female


def _is_metadata_question(text: str) -> bool:
    return any(term in text for term in METADATA_TERMS) or any(
        re.search(pattern, text) for pattern in METADATA_PATTERNS
    )


def route_question_detail(pergunta: str) -> RouterDecision:
    if not is_query_safe(pergunta):
        logger.warning("Question Router: pergunta bloqueada pelo Safety Gate: %r", pergunta)
        return RouterDecision(
            tipo="blocked",
            assunto="seguranca",
            confianca=1.0,
            justificativa="Pergunta contem termo, schema ou comando bloqueado.",
            intencao="blocked_by_safety",
        )

    text = _clean(pergunta)
    subject = _subject_for(text)

    if settings.llm_provider.lower().strip() != "none":
        # Fase 2: aqui entrara o router por LLM. Na Fase 1, mantemos fallback local.
        logger.info("LLM_PROVIDER habilitado, mas router LLM permanece em fallback local nesta fase.")

    if _is_metadata_question(text):
        return RouterDecision(
            tipo="metadata",
            assunto="catalogo",
            confianca=0.95,
            justificativa="Pergunta solicita catalogo, estrutura ou dados disponiveis.",
            intencao="metadata",
        )

    dashboard = route_dashboard(pergunta)
    if dashboard:
        return RouterDecision(
            tipo="dashboard",
            assunto=dashboard["id"],
            confianca=0.95,
            justificativa="Pergunta solicita visualizacao em painel.",
            intencao="dashboard",
            dashboard=dashboard["id"],
        )

    has_conceptual_trigger = any(trigger in text for trigger in CONCEPTUAL_TRIGGERS)
    has_analytical_signal = any(term in text for term in ANALYTICAL_TERMS) or bool(re.search(r"\b(19|20)\d{2}\b", text))

    if has_conceptual_trigger and not _is_gender_comparison(text):
        return RouterDecision(
            tipo="conceptual",
            assunto=subject,
            confianca=0.95,
            justificativa="Pergunta pede explicacao conceitual por gatilho explicito.",
            intencao="conceptual",
        )

    if has_analytical_signal:
        intent = classify_intent(pergunta)
        return RouterDecision(
            tipo="analytical",
            assunto=subject,
            confianca=0.86 if intent != "desconhecido" else 0.72,
            justificativa="Pergunta contem termos quantitativos, temporais ou de ranking.",
            intencao=intent if intent != "desconhecido" else "analytical_dynamic",
        )

    for termo in CONCEPTUAL_TERMS.keys():
        if termo in text:
            return RouterDecision(
                tipo="conceptual",
                assunto=subject or termo.lower(),
                confianca=0.7,
                justificativa=f"Pergunta menciona termo conceitual mapeado: {termo}.",
                intencao="conceptual",
            )

    if re.search(r"\bCID\s+([A-Z])\b", text) or re.search(r"\bGRUPO\s+([A-Z])\b", text):
        return RouterDecision(
            tipo="conceptual",
            assunto="cid",
            confianca=0.75,
            justificativa="Pergunta menciona grupo CID sem sinal analitico.",
            intencao="conceptual",
        )

    return RouterDecision(
        tipo="unknown",
        assunto=subject,
        confianca=0.3,
        justificativa="Pergunta nao se encaixa nos fluxos suportados.",
        intencao="unknown",
    )


def route_question(pergunta: str) -> str:
    decision = route_question_detail(pergunta)
    return "blocked_by_safety" if decision.tipo == "blocked" else decision.tipo
