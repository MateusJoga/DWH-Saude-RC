from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
import os

# Resolve o caminho do arquivo .env a partir da estrutura de diretórios
# Estrutura: /backend/app/config.py -> Pai: /backend/app -> Avô: /backend -> Bisavô: raiz (.env)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    """
    Classe para carregar e validar as variáveis de ambiente necessárias.
    Prioriza variáveis injetadas pelo sistema/Docker Compose e lê do arquivo .env como fallback.
    """
    sqlserver_host: str = "sqlserver"
    sqlserver_port: int = 1433
    sqlserver_db: str = "DataWareHouse_RC"
    sqlserver_user: str = "sa"
    sqlserver_password: str = "SenhaForte123!"
    sqlserver_driver: str = "ODBC Driver 18 for SQL Server"
    
    # Credenciais restritas para conexão do Assistente de IA
    sqlserver_ia_user: str | None = None
    sqlserver_ia_password: str | None = None
    
    # Variáveis de IA e Modelos LLM
    llm_provider: str = "none"
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    groq_api_key: str | None = None
    llm_model: str | None = None
    llm_timeout_seconds: int = 30
    llm_retry_delay_seconds: float = 2.0

    model_config = SettingsConfigDict(
        # Aponta para o arquivo .env se ele existir na raiz, senão busca no diretório de execução
        env_file=ENV_PATH if ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
