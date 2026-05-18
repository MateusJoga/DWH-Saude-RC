from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any
import logging

from app.database import get_ia_db
from app.ia.schemas import PerguntaRequest, PerguntaResponse
from app.ia.question_router import route_question
from app.ia.conceptual_responder import get_conceptual_response
from app.ia.intent_classifier import classify_intent
from app.ia.query_templates import get_query_for_intent
from app.ia.response_generator import generate_ia_response

logger = logging.getLogger("dw_backend")

router = APIRouter(prefix="/ia", tags=["IA & Linguagem Natural"])

# =========================================================================
# ENDPOINT: PROCESSAMENTO SEGURO E ROTEADO DE PERGUNTAS (ANALÍTICO / CONCEITUAL)
# =========================================================================

@router.post("/pergunta", response_model=PerguntaResponse, status_code=status.HTTP_200_OK)
def responder_pergunta_ia(payload: PerguntaRequest, db: Session = Depends(get_ia_db)):
    """
    Processa perguntas do usuário em linguagem natural direcionando-as na ordem correta:
    
    1. Safety Check -> safety.py (dentro de question_router)
    2. Roteamento -> question_router.py (analytical, conceptual, unknown ou blocked_by_safety)
    3. Fluxo correspondente -> Execução no banco (se analítica) ou Resolução teórica (se conceitual).
    """
    pergunta_usuario = payload.pergunta
    logger.info(f"Roteando pergunta recebida: '{pergunta_usuario}'")

    # -------------------------------------------------------------------------
    # PASSO 1 E 2: Execução obrigatória do Safety Gate e Classificação de Rota
    # -------------------------------------------------------------------------
    tipo_pergunta = route_question(pergunta_usuario)
    logger.info(f"Tipo de pergunta classificado pelo roteador: '{tipo_pergunta}'")

    # -------------------------------------------------------------------------
    # FLUXO A: Pergunta Bloqueada por Segurança (Maliciosa)
    # -------------------------------------------------------------------------
    if tipo_pergunta == "blocked_by_safety":
        logger.warning(f"Tentativa de violação interceptada pelo router: '{pergunta_usuario}'")
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="blocked_by_safety",
            intencao_detectada="blocked_by_safety",
            sql_executado=None,
            dados=[],
            resposta=(
                "Sua pergunta contém termos ou caracteres restritos por razões de segurança corporativa. "
                "A tentativa foi registrada e nenhuma instrução foi executada."
            ),
            insights=[],
            status="blocked_by_safety"
        )

    # -------------------------------------------------------------------------
    # FLUXO B: Pergunta Conceitual (SUS / DW / CIDs A-Z) - SEM CONSULTAR O BANCO
    # -------------------------------------------------------------------------
    if tipo_pergunta == "conceptual":
        logger.info(f"Resolvendo conceito teórico para: '{pergunta_usuario}'")
        resposta_conceitual = get_conceptual_response(pergunta_usuario)
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="conceptual",
            intencao_detectada="none",
            sql_executado=None,
            dados=[],
            resposta=resposta_conceitual,
            insights=[],
            status="success"
        )

    # -------------------------------------------------------------------------
    # FLUXO C: Pergunta Desconhecida (Fora de Escopo) - SEM CONSULTAR O BANCO
    # -------------------------------------------------------------------------
    if tipo_pergunta == "unknown":
        logger.info("Pergunta desconhecida. Retornando instruções amigáveis de escopo.")
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="unknown",
            intencao_detectada="none",
            sql_executado=None,
            dados=[],
            resposta=(
                "Não consegui associar sua dúvida a nenhuma das análises ou conceitos cadastrados no sistema. "
                "Eu posso te ajudar fornecendo:\n"
                "1. Estatísticas operacionais do DW (como volume de internações por hospital, diagnósticos/CIDs mais frequentes, custos de internação/UTI e faturamento de procedimentos).\n"
                "2. Conceitos explicativos do SUS e DW (como o que significa CNES, AIH, FAEC, níveis de complexidade, as camadas Bronze, Prata, Ouro e os grupos CID de A a Z)."
            ),
            insights=[],
            status="unknown"
        )

    # -------------------------------------------------------------------------
    # FLUXO D: Pergunta Analítica (Consulta Ouro no SQL Server)
    # -------------------------------------------------------------------------
    # Identifica a intenção analítica real
    intencao = classify_intent(pergunta_usuario)
    sql_executado = get_query_for_intent(intencao)
    
    if not sql_executado:
        logger.error(f"Erro de correspondência da query analítica para a intenção: '{intencao}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao carregar a query para a intenção analítica."
        )

    dados = []
    try:
        logger.info(f"Executando query analítica autorizada: {sql_executado}")
        result = db.execute(text(sql_executado))
        dados = [dict(row._mapping) for row in result]
    except Exception as db_err:
        logger.error(f"Falha de execução do banco para a IA: {db_err}")
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="analytical",
            intencao_detectada=intencao,
            sql_executado=sql_executado,
            dados=[],
            resposta=(
                "Ocorreu uma falha técnica ao carregar as métricas do banco de dados SQL Server. "
                "Por favor, verifique se o servidor de banco está online."
            ),
            insights=[
                f"Erro de banco reportado: {str(db_err)}",
                "Verifique se o schema 'ouro' contém as views analíticas calculadas."
            ],
            status="error"
        )

    # Gera a interpretação descritiva e os insights estatísticos
    ia_output = generate_ia_response(pergunta_usuario, intencao, dados)

    return PerguntaResponse(
        pergunta=pergunta_usuario,
        tipo_pergunta="analytical",
        intencao_detectada=intencao,
        sql_executado=sql_executado,
        dados=dados,
        resposta=ia_output["resposta"],
        insights=ia_output["insights"],
        status="success"
    )
