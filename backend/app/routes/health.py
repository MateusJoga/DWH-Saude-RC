from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
import time

router = APIRouter(tags=["Health Check"])

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """
    Verifica a saúde da API backend e a conectividade com o banco de dados SQL Server.
    
    Executa uma consulta simples (SELECT 1) e extrai a versão atual do SQL Server
    para garantir que os drivers e conexões físicas estão funcionando perfeitamente.
    """
    start_time = time.time()
    try:
        # Testa a conexão física rodando uma consulta leve
        result = db.execute(text("SELECT 1 AS ok")).fetchone()
        
        # Recupera a versão do SQL Server para fins de diagnóstico
        version_result = db.execute(text("SELECT @@VERSION")).fetchone()
        sql_version = version_result[0] if version_result else "Desconhecido"
        
        latency = round((time.time() - start_time) * 1000, 2)
        
        if result and result[0] == 1:
            return {
                "status": "healthy",
                "api_version": "1.0.0",
                "database": {
                    "status": "connected",
                    "latency_ms": latency,
                    "server_version": sql_version.strip().split("\n")[0] # Retorna a primeira linha do version string
                }
            }
        else:
            return {
                "status": "unhealthy",
                "api_version": "1.0.0",
                "database": {
                    "status": "error",
                    "latency_ms": latency,
                    "error": "Resposta inesperada da query de teste."
                }
            }
            
    except Exception as e:
        latency = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "unhealthy",
            "api_version": "1.0.0",
            "database": {
                "status": "disconnected",
                "latency_ms": latency,
                "error": str(e)
            }
        }
