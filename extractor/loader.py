import os  # Adicionado para evitar NameError
import logging
import time
from sqlalchemy import create_engine, text
import pandas as pd
from pathlib import Path

# Configuração de Logging herdada do orquestrador
logger = logging.getLogger("DATASUS_PIPELINE")

# Configurando variáveis com fallbacks seguros (buscando o host correto do Docker)
SQL_HOST = os.getenv("SQLSERVER_HOST", "sqlserver")  # Padrão aponta para o serviço do compose
SQL_PORT = os.getenv("SQLSERVER_PORT", "1433")
SQL_DB = os.getenv("SQLSERVER_DB", "DataWareHouse_RC")
SQL_USER = os.getenv("SQLSERVER_USER", "sa")
SQL_PASS = os.getenv("SQLSERVER_PASSWORD", "T3ste123!")

# String de conexão corrigida e compatível com SQL Server 2025 no Docker
DATABASE_URL = (
    f"mssql+pyodbc://{SQL_USER}:{SQL_PASS}@{SQL_HOST}:{SQL_PORT}/{SQL_DB}"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    "&TrustServerCertificate=yes"
    "&Encrypt=yes"                 # 👈 OBRIGATÓRIO para SQL Server 2025 no Linux
    "&Connection+Timeout=30"       # 👈 Margem de segurança para o handshake
)

# Adicionado o fast_executemany=True para a carga não demorar horas
engine = create_engine(DATABASE_URL, pool_pre_ping=True, fast_executemany=True)

# ... restante da função carregar_parquet_no_banco() permanece igual ...

def carregar_parquet_no_banco(base: str, ano: int, mes: int, caminho_parquet: Path) -> bool:
    """
    Carrega o arquivo Parquet ajustado diretamente na tabela correspondente da camada Bronze.
    Evita duplicações limpando o período antes da inserção.
    """
    tag = base.upper()
    tabela = base # cnes, sih_rd ou sih_sp
    
    if not caminho_parquet.exists():
        logger.warning(f"[{tag}] Arquivo para carga não encontrado: {caminho_parquet}")
        return True # Retorna True se não houver dados (ex: meses vazios legítimos)

    inicio_cronometro = time.time()
    logger.info(f"[{tag}] Iniciando carga no banco SQL Server para o período {ano}-{mes:02d}...")

    try:
        df = pd.read_parquet(caminho_parquet)
        if df.empty:
            logger.info(f"[{tag}] DataFrame vazio para {ano}-{mes:02d}. Pulando carga.")
            return True

        # Mapeamento de colunas de controle de período para deletar duplicados
        # CNES usa COMPETEN (AAAAMM), SIH_RD usa ANO_CMPT/MES_CMPT, SIH_SP usa SP_AA/SP_MM
        with engine.begin() as conexao:
            if base == "cnes":
                competencia = f"{ano}{mes:02d}"
                query_delete = text("DELETE FROM bronze.cnes WHERE COMPETEN = :comp")
                conexao.execute(query_delete, {"comp": competencia})
            elif base == "sih_rd":
                # Garantindo o tipo correto conforme o que o PySUS extrai (str ou int)
                query_delete = text("DELETE FROM bronze.sih_rd WHERE (ANO_CMPT = :ano OR ANO_CMPT = :ano_str) AND (MES_CMPT = :mes OR MES_CMPT = :mes_str)")
                conexao.execute(query_delete, {"ano": ano, "ano_str": str(ano), "mes": mes, "mes_str": f"{mes:02d}"})
            elif base == "sih_sp":
                # SIH_SP costuma usar os dois últimos dígitos do ano (ex: 25 para 2025)
                ano_dois_digitos = int(str(ano)[2:])
                query_delete = text("DELETE FROM bronze.sih_sp WHERE (SP_AA = :ano OR SP_AA = :ano_str) AND (SP_MM = :mes OR SP_MM = :mes_str)")
                conexao.execute(query_delete, {"ano": ano_dois_digitos, "ano_str": str(ano_dois_digitos), "mes": mes, "mes_str": f"{mes:02d}"})

        # Inserção incremental otimizada (fast_executemany implícito no mssql + pyodbc se configurado, ou via to_sql padrão)
        df.to_sql(
            name=tabela,
            schema="bronze",
            con=engine,
            if_exists="append",
            index=False,
            chunksize=10000 # Otimiza uso de memória em tabelas grandes como a SIH_SP
        )

        duracao = time.time() - inicio_cronometro
        logger.info(f"[{tag}] Carga finalizada com sucesso! {len(df)} linhas inseridas em {duracao:.2f} segundos.")
        return True

    except Exception as e:
        logger.error(f"[{tag}] Erro catastrófico ao inserir dados no SQL Server para {ano}-{mes:02d}: {e}")
        return False