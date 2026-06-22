from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class PerguntaRequest(BaseModel):
    """Representa a pergunta em linguagem natural enviada pelo cliente."""
    pergunta: str


class PerguntaResponse(BaseModel):
    """Resposta do fluxo de IA v1."""
    pergunta: str
    tipo_pergunta: str
    intencao_detectada: str
    sql_executado: Optional[str] = None
    sql_gerado: Optional[str] = None
    query_plan: Optional[Dict[str, Any]] = None
    dashboard_recomendado: Optional[Dict[str, Any]] = None
    dados: List[Dict[str, Any]]
    resposta: str
    insights: List[str]
    status: str

class PerguntaLlamaResponse(BaseModel):
    pergunta: str
    sql: Optional[str] = None
    dados: list[dict[str, Any]]
    resposta: str
    status: str
    tabelas: list[str]
    engine: str = "llamaindex"
