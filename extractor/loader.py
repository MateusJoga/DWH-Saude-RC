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
def carga_ja_processada(conexao, base, ano, mes):
    query = text("""
        SELECT 1
        FROM controle.cargas_dados
        WHERE base = :base
          AND ano = :ano
          AND mes = :mes
          AND status = 'SUCESSO'
    """)
    return conexao.execute(query, {
        "base": base,
        "ano": ano,
        "mes": mes
    }).fetchone() is not None

def registrar_inicio_carga(conexao, base, ano, mes, arquivo):
    query = text("""
        INSERT INTO controle.cargas_dados (
            base, ano, mes, status, arquivo_origem, data_inicio
        )
        VALUES (
            :base, :ano, :mes, 'EM_PROCESSAMENTO', :arquivo, GETDATE()
        )
    """)
    conexao.execute(query, {
        "base": base,
        "ano": ano,
        "mes": mes,
        "arquivo": str(arquivo)
    })

def registrar_sucesso_carga(conexao, base, ano, mes, linhas):
    query = text("""
        UPDATE controle.cargas_dados
        SET status = 'SUCESSO',
            linhas_carregadas = :linhas,
            data_fim = GETDATE()
        WHERE base = :base
          AND ano = :ano
          AND mes = :mes
    """)
    conexao.execute(query, {
        "base": base,
        "ano": ano,
        "mes": mes,
        "linhas": linhas
    })

def registrar_erro_carga(conexao, base, ano, mes, erro):
    query = text("""
        UPDATE controle.cargas_dados
        SET status = 'ERRO',
            mensagem_erro = :erro,
            data_fim = GETDATE()
        WHERE base = :base
          AND ano = :ano
          AND mes = :mes
    """)
    conexao.execute(query, {
        "base": base,
        "ano": ano,
        "mes": mes,
        "erro": str(erro)
    })


def apagar_dados_bronze(conexao, base: str, ano: int, mes: int):
    """
    Exclui fisicamente os dados correspondentes a base, ano e mês na camada Bronze.
    """
    tag = base.upper()
    logger.info(f"[{tag}] Removendo registros antigos da Bronze para {ano}-{mes:02d}...")
    
    if base == "cnes":
        # Formato YYYYMM, ex: '202603'
        competencia = f"{ano}{mes:02d}"
        query = text("DELETE FROM bronze.cnes WHERE COMPETEN = :competencia")
        resultado = conexao.execute(query, {"competencia": competencia})
        logger.info(f"[{tag}] {resultado.rowcount} registros deletados da Bronze.")
    elif base == "sih_rd":
        query = text("DELETE FROM bronze.sih_rd WHERE ANO_CMPT = :ano AND MES_CMPT = :mes")
        resultado = conexao.execute(query, {"ano": ano, "mes": mes})
        logger.info(f"[{tag}] {resultado.rowcount} registros deletados da Bronze.")
    elif base == "sih_sp":
        # Flexibilização: aceitar SP_AA de 4 dígitos ou 2 dígitos, int ou string
        ano_str = str(ano)
        ano_2d = ano % 100
        ano_2d_str = f"{ano_2d:02d}"
        
        mes_str = f"{mes:02d}"
        
        query = text("""
            DELETE FROM bronze.sih_sp 
            WHERE (SP_AA = :ano OR SP_AA = :ano_str OR SP_AA = :ano_2d OR SP_AA = :ano_2d_str)
              AND (SP_MM = :mes OR SP_MM = :mes_str)
        """)
        resultado = conexao.execute(query, {
            "ano": ano,
            "ano_str": ano_str,
            "ano_2d": ano_2d,
            "ano_2d_str": ano_2d_str,
            "mes": mes,
            "mes_str": mes_str
        })
        logger.info(f"[{tag}] {resultado.rowcount} registros deletados da Bronze.")


def carregar_parquet_no_banco(base: str, ano: int, mes: int, caminho_parquet: Path, force: bool = False) -> bool:
    """
    Carrega o arquivo Parquet ajustado diretamente na tabela correspondente da camada Bronze.

    Controle de carga:
    - Se base/ano/mês já estiver com status SUCESSO e force=False, pula a carga.
    - Se houver registro anterior em ERRO ou EM_PROCESSAMENTO (ou se force=True), remove o registro da tabela de controle.
    - Se force=True, apaga os dados correspondentes na camada Bronze.
    - Registra EM_PROCESSAMENTO.
    - Insere os dados usando df.to_sql.
    - Após inserir, registra SUCESSO.
    - Se der erro, registra ERRO.
    """
    tag = base.upper()
    tabela = base

    if not caminho_parquet.exists():
        logger.warning(f"[{tag}] Arquivo para carga não encontrado: {caminho_parquet}")
        return True

    inicio_cronometro = time.time()
    logger.info(f"[{tag}] Iniciando carga no banco SQL Server para o período {ano}-{mes:02d} (force={force})...")

    try:
        df = pd.read_parquet(caminho_parquet)

        if df.empty:
            logger.info(f"[{tag}] DataFrame vazio para {ano}-{mes:02d}. Pulando carga.")
            return True

        with engine.begin() as conexao:
            # 1. Verificar se já existe SUCESSO (se force for False)
            if not force:
                if carga_ja_processada(conexao, base, ano, mes):
                    logger.info(f"[{tag}] Carga {ano}-{mes:02d} já processada com SUCESSO. Pulando.")
                    return True
            
            # 2. Remover qualquer registro anterior de controle para esta carga (seja ERRO, EM_PROCESSAMENTO ou se force=True)
            # Isso evita violação de Unique/Primary Key na tabela de controle.
            query_limpar_controle = text("""
                DELETE FROM controle.cargas_dados
                WHERE base = :base AND ano = :ano AND mes = :mes
            """)
            conexao.execute(query_limpar_controle, {"base": base, "ano": ano, "mes": mes})
            
            # 3. Se force for True, deletar dados da bronze para evitar duplicidade
            if force:
                apagar_dados_bronze(conexao, base, ano, mes)

            # 4. Registrar EM_PROCESSAMENTO
            registrar_inicio_carga(
                conexao=conexao,
                base=base,
                ano=ano,
                mes=mes,
                arquivo=str(caminho_parquet)
            )

        # 5. Inserir dados no banco
        df.to_sql(
            name=tabela,
            schema="bronze",
            con=engine,
            if_exists="append",
            index=False,
            chunksize=10000
        )

        # 6. Registrar SUCESSO
        with engine.begin() as conexao:
            registrar_sucesso_carga(
                conexao=conexao,
                base=base,
                ano=ano,
                mes=mes,
                linhas=len(df)
            )

        duracao = time.time() - inicio_cronometro
        logger.info(
            f"[{tag}] Carga finalizada com sucesso! "
            f"{len(df)} linhas inseridas em {duracao:.2f} segundos."
        )

        return True

    except Exception as e:
        logger.error(f"[{tag}] Erro ao inserir dados no SQL Server para {ano}-{mes:02d}: {e}")

        try:
            with engine.begin() as conexao:
                # Se der erro, limpamos qualquer registro de EM_PROCESSAMENTO para poder inserir/atualizar como ERRO
                query_limpar_controle = text("""
                    DELETE FROM controle.cargas_dados
                    WHERE base = :base AND ano = :ano AND mes = :mes
                """)
                conexao.execute(query_limpar_controle, {"base": base, "ano": ano, "mes": mes})
                
                # Inserimos o erro
                registrar_inicio_carga(
                    conexao=conexao,
                    base=base,
                    ano=ano,
                    mes=mes,
                    arquivo=str(caminho_parquet)
                )
                registrar_erro_carga(
                    conexao=conexao,
                    base=base,
                    ano=ano,
                    mes=mes,
                    erro=str(e)
                )
        except Exception as erro_controle:
            logger.error(f"[{tag}] Também falhou ao registrar erro na tabela de controle: {erro_controle}")

        return False