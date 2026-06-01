from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from app.database import get_ia_db
from app.ia.schemas import PerguntaRequest, PerguntaResponse
from app.ia.question_router import route_question_detail
from app.ia.conceptual_responder import get_conceptual_response
from app.ia.dashboard_router import route_dashboard
from app.ia.llm_query_planner import gerar_query_plan
from app.ia.query_plan_validator import QueryPlanValidationError
from app.ia.response_generator import generate_ia_response
from app.ia.semantic_catalog import list_available_indicators
from app.ia.sql_builder import build_sql_from_query_plan

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
    logger.info("IA audit | pergunta=%r | etapa=recebida", pergunta_usuario)

    # -------------------------------------------------------------------------
    # PASSO 1 E 2: Execução obrigatória do Safety Gate e Classificação de Rota
    # -------------------------------------------------------------------------
    router_decision = route_question_detail(pergunta_usuario)
    tipo_pergunta = router_decision.tipo
    logger.info(
        "IA audit | pergunta=%r | router=%s | etapa=roteada",
        pergunta_usuario,
        router_decision.public_dict(),
    )

    # -------------------------------------------------------------------------
    # FLUXO A: Pergunta Bloqueada por Segurança (Maliciosa)
    # -------------------------------------------------------------------------
    if tipo_pergunta == "blocked":
        logger.warning(f"Tentativa de violação interceptada pelo router: '{pergunta_usuario}'")
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="blocked",
            intencao_detectada=router_decision.intencao or "blocked",
            sql_executado=None,
            sql_gerado=None,
            query_plan=None,
            dashboard_recomendado=None,
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
            intencao_detectada=router_decision.intencao or "conceptual",
            sql_executado=None,
            sql_gerado=None,
            query_plan=None,
            dashboard_recomendado=None,
            dados=[],
            resposta=resposta_conceitual,
            insights=[],
            status="success"
        )

    # -------------------------------------------------------------------------
    # FLUXO C: Pedido de Dashboard - SEM CONSULTAR O BANCO
    # -------------------------------------------------------------------------
    if tipo_pergunta == "dashboard":
        dashboard = route_dashboard(pergunta_usuario)
        logger.info("IA audit | pergunta=%r | dashboard=%s | status=success", pergunta_usuario, dashboard)
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="dashboard",
            intencao_detectada=router_decision.intencao or "dashboard",
            sql_executado=None,
            sql_gerado=None,
            query_plan=None,
            dashboard_recomendado=dashboard,
            dados=[],
            resposta=(
                f"Recomendo abrir o {dashboard['titulo']}. "
                f"Ele está disponível na rota {dashboard['rota']} e reúne {dashboard['descricao'].lower()}"
            ),
            insights=[],
            status="success"
        )

    if tipo_pergunta == "metadata":
        metadata = list_available_indicators()
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="metadata",
            intencao_detectada=router_decision.intencao or "metadata",
            sql_executado=None,
            sql_gerado=None,
            query_plan={
                "tipo": "metadata",
                "assunto": "catalogo",
                "necessita_sql": False,
            },
            dashboard_recomendado=None,
            dados=[metadata],
            resposta=(
                "Você pode consultar indicadores de internações, CIDs, hospitais, procedimentos, custos, óbitos, "
                "permanência, dimensões de tempo, hospitais, CIDs, procedimentos, profissionais e perfil de paciente."
            ),
            insights=[
                "As consultas analíticas são restritas a objetos permitidos da camada Ouro.",
                "Para perguntas detalhadas, use filtros como ano, mês, CNES, CID, procedimento, sexo ou complexidade.",
            ],
            status="success",
        )

    # -------------------------------------------------------------------------
    # FLUXO D: Pergunta Desconhecida (Fora de Escopo) - SEM CONSULTAR O BANCO
    # -------------------------------------------------------------------------
    if tipo_pergunta == "unknown":
        logger.info("Pergunta desconhecida. Retornando instruções amigáveis de escopo.")
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="unknown",
            intencao_detectada="none",
            sql_executado=None,
            sql_gerado=None,
            query_plan=None,
            dashboard_recomendado=None,
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
    # FLUXO E: Pergunta Analítica (QueryPlan validado -> SQL seguro)
    # -------------------------------------------------------------------------
    try:
        query_plan = gerar_query_plan(pergunta_usuario, router_decision)
        sql_executado, params = build_sql_from_query_plan(query_plan)
        intencao = query_plan.intencao or "analytical"
        logger.info(
            "IA audit | pergunta=%r | plano=%s | sql=%s | params=%s | etapa=sql_gerado",
            pergunta_usuario,
            query_plan.public_dict(),
            sql_executado,
            params,
        )
    except QueryPlanValidationError as validation_err:
        logger.warning(
            "IA audit | pergunta=%r | status=blocked_by_query_plan | erro=%s",
            pergunta_usuario,
            validation_err,
        )
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="analytical",
            intencao_detectada="invalid_query_plan",
            sql_executado=None,
            sql_gerado=None,
            query_plan=None,
            dashboard_recomendado=None,
            dados=[],
            resposta=(
                "Não consegui transformar sua pergunta em um plano analítico seguro. "
                "A consulta não foi executada porque violou as regras do catálogo semântico."
            ),
            insights=[str(validation_err)],
            status="blocked_by_query_plan"
        )

    dados = []
    try:
        logger.info("IA audit | pergunta=%r | etapa=executando_sql", pergunta_usuario)
        result = db.execute(text(sql_executado), params)
        dados = [dict(row._mapping) for row in result]
    except Exception as db_err:
        logger.error("IA audit | pergunta=%r | status=error | erro=%s", pergunta_usuario, db_err)
        return PerguntaResponse(
            pergunta=pergunta_usuario,
            tipo_pergunta="analytical",
            intencao_detectada=intencao,
            sql_executado=sql_executado,
            sql_gerado=sql_executado,
            query_plan=query_plan.public_dict(),
            dashboard_recomendado=None,
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
    ia_output = generate_ia_response(pergunta_usuario, query_plan, dados, sql_executado)
    logger.info(
        "IA audit | pergunta=%r | plano=%s | sql=%s | status=success | linhas=%s",
        pergunta_usuario,
        query_plan.public_dict(),
        sql_executado,
        len(dados),
    )

    return PerguntaResponse(
        pergunta=pergunta_usuario,
        tipo_pergunta="analytical",
        intencao_detectada=intencao,
        sql_executado=sql_executado,
        sql_gerado=sql_executado,
        query_plan=query_plan.public_dict(),
        dashboard_recomendado=None,
        dados=dados,
        resposta=ia_output["resposta"],
        insights=ia_output["insights"],
        status="success"
    )
