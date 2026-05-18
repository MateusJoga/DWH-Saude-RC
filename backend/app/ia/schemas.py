from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class PerguntaRequest(BaseModel):
    """
    Representa a pergunta em linguagem natural enviada pelo cliente.
    """
    pergunta: str

class PerguntaResponse(BaseModel):
    """
    Contém a estrutura de retorno da API de IA, contendo tipo da pergunta,
    intenção, query executada, dados, resposta formatada e insights.
    """
    pergunta: str
    tipo_pergunta: str
    intencao_detectada: str
    sql_executado: Optional[str] = None
    dados: List[Dict[str, Any]]
    resposta: str
    insights: List[str]
    status: str
