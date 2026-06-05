import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_ia_db
from app.ia.llamaindex_sql_agent import responder_com_llamaindex
from app.ia.schemas import PerguntaRequest, PerguntaResponse, PerguntaLlamaResponse

logger = logging.getLogger("dw_backend")

router = APIRouter(prefix="/ia", tags=["IA & Linguagem Natural"])

'''
@router.post("/pergunta", response_model=PerguntaResponse, status_code=status.HTTP_200_OK)
def responder_pergunta_ia(payload: PerguntaRequest, db: Session = Depends(get_ia_db)):
    """
    Mantém o fluxo antigo intacto.
    """
    pergunta_usuario = payload.pergunta
    logger.info("IA audit | pergunta=%r | etapa=recebida", pergunta_usuario)

    result = answer_question_with_sql(pergunta_usuario, db)
    tipo_pergunta = "blocked" if result.status == "blocked_by_safety" else "analytical"
    intencao = "blocked_by_safety" if result.status == "blocked_by_safety" else "nl2sql"

    logger.info(
        "IA audit | pergunta=%r | status=%s | tabelas=%s | sql=%s | linhas=%s",
        pergunta_usuario,
        result.status,
        result.candidate_tables,
        result.sql,
        len(result.rows),
    )

    return PerguntaResponse(
        pergunta=pergunta_usuario,
        tipo_pergunta=tipo_pergunta,
        intencao_detectada=intencao,
        sql_executado=result.sql,
        sql_gerado=result.sql,
        query_plan=None,
        dashboard_recomendado=None,
        dados=result.rows,
        resposta=result.resposta,
        insights=result.insights,
        status=result.status,
    )
'''

@router.post("/pergunta-llama", response_model=PerguntaLlamaResponse)
def responder_pergunta_llama(
    payload: PerguntaRequest,
    db: Session = Depends(get_ia_db),
):
    result = responder_com_llamaindex(payload.pergunta, db)

    return PerguntaLlamaResponse(
        pergunta=result.pergunta,
        sql=result.sql,
        dados=result.dados,
        resposta=result.resposta,
        status=result.status,
        tabelas=result.tabelas,
        engine="llamaindex",
    )
