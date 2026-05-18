import urllib
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
import logging

# Configuração de Logs
logger = logging.getLogger("dw_backend")
logging.basicConfig(level=logging.INFO)

# Trata caracteres especiais na senha (ex: @, !, #) para evitar quebra na URL de conexão
encoded_password = urllib.parse.quote_plus(settings.sqlserver_password)

# Configura a URL de conexão com SQL Server utilizando pyodbc
# ATENÇÃO: driver deve ter espaços trocados por '+' na string final de conexão
driver_escaped = settings.sqlserver_driver.replace(" ", "+")
DATABASE_URL = (
    f"mssql+pyodbc://{settings.sqlserver_user}:{encoded_password}@"
    f"{settings.sqlserver_host}:{settings.sqlserver_port}/{settings.sqlserver_db}"
    f"?driver={driver_escaped}&TrustServerCertificate=yes"
)

logger.info(f"Conectando ao SQL Server em: {settings.sqlserver_host}:{settings.sqlserver_port}")

# Criação do Motor SQLAlchemy
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # Valida a conexão antes de usar (evita conexões mortas no pool)
        pool_recycle=1800        # Recicla conexões a cada 30 minutos
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.critical(f"Falha ao inicializar o motor do SQLAlchemy: {e}")
    raise e

# Dependência do FastAPI para obter a sessão do banco de dados em cada request
def get_db():
    """
    Dependency Generator: Abre uma conexão com o banco de dados e garante
    seu fechamento seguro após a conclusão da requisição HTTP.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------------------
# POOL DE CONEXÕES EXCLUSIVO E RESTRITO PARA O ASSISTENTE DE IA
# -------------------------------------------------------------------------
ia_engine = None
IaSessionLocal = None

if settings.sqlserver_ia_user and settings.sqlserver_ia_password:
    try:
        encoded_ia_password = urllib.parse.quote_plus(settings.sqlserver_ia_password)
        IA_DATABASE_URL = (
            f"mssql+pyodbc://{settings.sqlserver_ia_user}:{encoded_ia_password}@"
            f"{settings.sqlserver_host}:{settings.sqlserver_port}/{settings.sqlserver_db}"
            f"?driver={driver_escaped}&TrustServerCertificate=yes"
        )
        logger.info(f"Inicializando pool de IA restrito com usuário: {settings.sqlserver_ia_user}")
        ia_engine = create_engine(
            IA_DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=1800
        )
        IaSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=ia_engine)
    except Exception as e:
        logger.error(f"Falha ao carregar pool restrito de IA ({e}). Usando pool master como fallback.")
        IaSessionLocal = SessionLocal
else:
    logger.info("Nenhuma credencial restrita de IA cadastrada no .env. Usando pool master.")
    IaSessionLocal = SessionLocal

def get_ia_db():
    """
    Dependency Generator para a Rota de IA. Fornece conexões restritas
    com o usuário 'dw_ia_user' para garantir segurança de sandbox em nível SQL.
    """
    db = IaSessionLocal()
    try:
        yield db
    finally:
        db.close()

