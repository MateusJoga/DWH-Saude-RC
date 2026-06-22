import logging
from sqlalchemy import text
from loader import engine

logger = logging.getLogger("DATASUS_PIPELINE")

def executar_processamento_dw() -> bool:
    """
    Executa a stored procedure dbo.sp_processar_dw no SQL Server.
    Utiliza engine.connect() + commit() manual para evitar conflitos com transações internas da procedure.
    """
    logger.info("[DW] Executando procedure dbo.sp_processar_dw...")
    try:
        with engine.connect() as conexao:
            # Executa a stored procedure de processamento das camadas Prata e Ouro
            conexao.execute(text("EXEC dbo.sp_processar_dw"))
            conexao.commit()
        logger.info("[DW] Procedure executada com sucesso.")
        return True
    except Exception as e:
        logger.error(f"[DW] Erro crítico ao executar dbo.sp_processar_dw: {e}")
        return False
