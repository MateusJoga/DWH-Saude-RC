from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/ia", tags=["IA & Linguagem Natural"])

# ==========================================
# SCHEMAS PYDANTIC
# ==========================================

class PerguntaRequest(BaseModel):
    pergunta: str

class PerguntaResponse(BaseModel):
    pergunta: str
    resposta: str
    sql_gerado: Optional[str] = None
    status: str
    insights: List[str]
    mock_data: List[Dict[str, Any]]


# ==========================================
# ENDPOINT: PROCESSAMENTO DE PERGUNTA MOCK
# ==========================================

@router.post("/pergunta", response_model=PerguntaResponse, status_code=status.HTTP_200_OK)
def responder_pergunta_ia(payload: PerguntaRequest):
    """
    Endpoint de demonstração e placeholder para futuras consultas em linguagem natural.
    
    Em etapas futuras do projeto, este endpoint integrará com um LLM (como o Gemini ou GPT-4)
    através de frameworks como LangChain/LlamaIndex. O LLM traduzirá a pergunta livre em uma query SQL,
    a executará na camada **ouro** do banco de dados e gerará um resumo analítico.
    
    Atualmente, o endpoint simula essa inteligência respondendo dinamicamente dependendo dos termos na pergunta.
    """
    pergunta_lower = payload.pergunta.lower()
    
    # Análise de palavras-chave simples para fornecer um mock rico e dinâmico!
    if "hospital" in pergunta_lower or "cnes" in pergunta_lower or "uf" in pergunta_lower:
        resposta = (
            "De acordo com os dados históricos consolidados da camada ouro, a distribuição espacial "
            "das internações mostra uma alta densidade de procedimentos na região de São Paulo, "
            "sendo o CNES 1234567 o de maior volume acumulado no último trimestre."
        )
        sql_gerado = (
            "SELECT TOP 5 municipio_hospital, uf_hospital, SUM(quantidade_internacoes) AS total_internacoes "
            "FROM ouro.agg_hospital_mensal "
            "GROUP BY municipio_hospital, uf_hospital "
            "ORDER BY total_internacoes DESC;"
        )
        insights = [
            "Os custos de UTI representam aproximadamente 34.5% do faturamento total hospitalar.",
            "São Paulo e Rio de Janeiro concentram cerca de 60% do fluxo de pacientes interestaduais."
        ]
        mock_data = [
            {"municipio_hospital": "São Paulo", "uf_hospital": "SP", "total_internacoes": 15240, "cnes_principal": "1234567"},
            {"municipio_hospital": "Rio de Janeiro", "uf_hospital": "RJ", "total_internacoes": 11820, "cnes_principal": "7654321"},
            {"municipio_hospital": "Belo Horizonte", "uf_hospital": "MG", "total_internacoes": 8450, "cnes_principal": "9876543"}
        ]
        
    elif "cid" in pergunta_lower or "doença" in pergunta_lower or "patologia" in pergunta_lower or "óbito" in pergunta_lower:
        resposta = (
            "Analisando as patologias recorrentes na camada ouro do DW, as doenças do aparelho circulatório "
            "e respiratório lideram as estatísticas de internação e apresentam os maiores índices de óbitos "
            "e tempo de permanência hospitalar."
        )
        sql_gerado = (
            "SELECT TOP 5 codigo_cid, grupo_cid, SUM(quantidade_internacoes) AS total_casos, "
            "SUM(quantidade_obitos) AS total_obitos, AVG(media_dias_permanencia) AS permanencia_media "
            "FROM ouro.agg_cid_mensal "
            "GROUP BY codigo_cid, grupo_cid "
            "ORDER BY total_casos DESC;"
        )
        insights = [
            "O CID I10 (Hipertensão) possui o maior volume absoluto de internações, mas o menor tempo de permanência média.",
            "O CID J18 (Pneumonia) responde pelo maior número absoluto de óbitos no grupo de patologias respiratórias."
        ]
        mock_data = [
            {"codigo_cid": "I10", "grupo_cid": "Hipertensão essencial (primária)", "total_casos": 8500, "total_obitos": 42, "permanencia_media": 3.2},
            {"codigo_cid": "J18", "grupo_cid": "Pneumonia não especificada", "total_casos": 6200, "total_obitos": 210, "permanencia_media": 8.5},
            {"codigo_cid": "E11", "grupo_cid": "Diabetes mellitus não-insulo-dependente", "total_casos": 4100, "total_obitos": 68, "permanencia_media": 5.7}
        ]
        
    else:
        # Resposta genérica padrão
        resposta = (
            f"Recebi sua pergunta: '{payload.pergunta}'. A infraestrutura de IA já está totalmente integrada "
            f"e preparada para receber pipelines avançados. Abaixo está a query padrão que geraremos por default "
            f"para carregar os dashboards."
        )
        sql_gerado = "SELECT TOP 100 * FROM ouro.agg_hospital_mensal ORDER BY ano DESC, mes DESC;"
        insights = [
            "Infraestrutura de chat conectada ao gateway de rotas com sucesso.",
            "Formatação JSON de saída compatível com renderizadores de gráficos e componentes React."
        ]
        mock_data = []

    return PerguntaResponse(
        pergunta=payload.pergunta,
        resposta=resposta,
        sql_gerado=sql_gerado,
        status="placeholder_active",
        insights=insights,
        mock_data=mock_data
    )
