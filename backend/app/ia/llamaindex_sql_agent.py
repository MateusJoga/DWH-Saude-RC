import logging
from dataclasses import dataclass
from typing import Any

from llama_index.core import SQLDatabase, Settings
from llama_index.core.query_engine import NLSQLTableQueryEngine
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq
from sqlalchemy.orm import Session

from app.config import settings
from app.ia.prompts import build_question
from app.ia.safety import is_query_safe
from app.ia.schema_registry import llama_context_query_kwargs
from app.ia.sql_validator import SQLValidationError, validate_sql

logger = logging.getLogger("dw_backend")

ALLOWED_FULL_TABLES = [
    "ouro.fato_internacoes",
    "ouro.fato_procedimentos",
    "ouro.agg_hospital_mensal",
    "ouro.agg_cid_mensal",
    "ouro.agg_procedimentos_mensais",
    "ouro.agg_internacoes_mensais",
]

ALLOWED_TABLES = [
    name.split(".", 1)[1]
    for name in ALLOWED_FULL_TABLES
]


@dataclass
class LlamaAgentResult:
    pergunta: str
    sql: str | None
    dados: list[dict[str, Any]]
    resposta: str
    status: str
    tabelas: list[str]


def responder_com_llamaindex(pergunta: str, db: Session) -> LlamaAgentResult:
    logger.info("Agente DW | pergunta=%r | etapa=recebida", pergunta)

    if not is_query_safe(pergunta):
        return _fail(pergunta, "Pergunta bloqueada por seguranca.", "blocked")

    try:
        query_engine = _build_query_engine(db)
        response = query_engine.query(build_question(pergunta))

        metadata = getattr(response, "metadata", {}) or {}
        sql = metadata.get("sql_query")

        if not sql:
            logger.warning("Agente DW | LlamaIndex nao retornou sql_query | metadata=%s", metadata)
            return _fail(pergunta, "Nao foi possivel gerar SQL.", "invalid_sql")

        logger.info("Agente DW | sql_gerado=%s", sql)

        try:
            validated = validate_sql(sql)
        except SQLValidationError as exc:
            logger.warning("Agente DW | SQL bloqueado | erro=%s | sql=%s", exc, sql)
            return _fail(pergunta, str(exc), "invalid_sql")

        rows = _extract_rows(metadata)

        return LlamaAgentResult(
            pergunta=pergunta,
            sql=validated.sql,
            dados=rows,
            resposta=str(response),
            status="success",
            tabelas=validated.tables,
        )

    except Exception as exc:
        logger.exception("Agente DW | erro inesperado")
        return _fail(pergunta, f"Erro tecnico: {exc}", "error")


def _build_query_engine(db: Session) -> NLSQLTableQueryEngine:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY nao configurada.")

    Settings.embed_model = HuggingFaceEmbedding(
        model_name="BAAI/bge-small-en-v1.5"
    )

    llm = Groq(
        model=settings.llm_model or "llama-3.1-8b-instant",
        api_key=settings.groq_api_key,
        temperature=0,
    )

    sql_database = SQLDatabase(
        db.get_bind(),
        schema="ouro",
        include_tables=ALLOWED_TABLES,
        view_support=True,
    )
    context_query_kwargs = llama_context_query_kwargs(ALLOWED_FULL_TABLES)

    return NLSQLTableQueryEngine(
        sql_database=sql_database,
        tables=ALLOWED_TABLES,
        llm=llm,
        context_query_kwargs=context_query_kwargs,
    )


def _extract_rows(metadata: dict[str, Any]) -> list[dict[str, Any]]:
    result = metadata.get("result") or []
    col_keys = metadata.get("col_keys") or []

    rows = []

    for item in result:
        if isinstance(item, dict):
            rows.append(item)
        elif col_keys:
            rows.append(dict(zip(col_keys, item)))
        else:
            rows.append({"valor": item})

    return rows


def _fail(pergunta: str, motivo: str, status: str) -> LlamaAgentResult:
    return LlamaAgentResult(
        pergunta=pergunta,
        sql=None,
        dados=[],
        resposta=f"Nao consegui responder com seguranca. Motivo: {motivo}",
        status=status,
        tabelas=[],
    )
