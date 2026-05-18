from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, consultas, ia

# Inicialização da aplicação FastAPI com metadados ricos para o Swagger
app = FastAPI(
    title="Data Warehouse Saúde Pública - API Backend",
    description=(
        "API de Integração desenvolvida com FastAPI para conectar ao banco SQL Server (Docker).\n\n"
        "Esta API atende aos dashboards analíticos, expõe as agregações mensais de hospitais e CIDs "
        "da camada **ouro** e está preparada com endpoints para integração com modelos de Inteligência Artificial (LLMs)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração de CORS (Cross-Origin Resource Sharing)
# Permite futuras conexões fáceis com Frontends em React, Next.js ou servidores locais
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua pelo domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro dos roteadores (Endpoints da API)
app.include_router(health.router)
app.include_router(consultas.router)
app.include_router(ia.router)

# Rota raiz informativa
@app.get("/", tags=["Início"])
def read_root():
    """
    Retorna metadados básicos de navegação e indica caminhos para documentação e status.
    """
    return {
        "mensagem": "Bem-vindo à API do Data Warehouse de Saúde Pública!",
        "status_servico": "Online",
        "documentacao_swagger": "/docs",
        "documentacao_redoc": "/redoc",
        "status_conexao_banco": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    # Executa localmente caso o arquivo seja chamado diretamente pelo Python
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
