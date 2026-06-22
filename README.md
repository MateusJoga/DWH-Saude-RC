# DW Saúde Pública — Rio Claro

Data warehouse para análise de dados públicos de saúde, com foco em internações, procedimentos, hospitais e diagnósticos do município de Rio Claro (SP). O projeto organiza dados do SIH/SUS e do CNES em uma arquitetura medalhão, disponibiliza indicadores por API e apresenta os resultados em um painel web com assistente de consultas em linguagem natural.

## Visão geral

O fluxo de dados está dividido em três camadas:

```text
SIH/SUS + CNES (Parquet)
          │
          ▼
   Bronze — dados brutos
          │
          ▼
   Prata — limpeza e padronização
          │
          ▼
   Ouro — dimensões, fatos e agregações
          │
          ├── FastAPI / Swagger
          ├── Dashboard Next.js
          └── Assistente analítico
```

Na camada Ouro, o modelo dimensional contempla hospitais, municípios, CIDs, procedimentos, profissionais, perfis de pacientes, tipos de internação e tempo. As tabelas fato registram internações e procedimentos; views de agregação fornecem métricas mensais por hospital, CID e procedimento.

## Funcionalidades

- pipeline SQL em camadas Bronze, Prata e Ouro;
- indicadores de internações, óbitos, permanência, UTI e custos;
- consultas agregadas por hospital e por CID, com filtros e paginação;
- dashboard web para acompanhamento dos principais indicadores;
- assistente que separa perguntas analíticas, conceituais, desconhecidas e inseguras;
- consultas do assistente baseadas em templates SQL previamente autorizados;
- usuário SQL opcional de somente leitura para isolar o acesso da IA;
- documentação interativa da API via Swagger e ReDoc.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Banco e DW | SQL Server 2025, T-SQL, modelagem dimensional |
| Backend | Python 3.11, FastAPI, SQLAlchemy, pyodbc |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Infraestrutura | Docker e Docker Compose |
| Dados | SIH/SUS, CNES e arquivos Parquet |

## Estrutura do projeto

```text
DW_RC_Saude/
├── backend/                 # API FastAPI e módulo do assistente
│   └── app/
│       ├── ia/              # roteamento, segurança e respostas
│       └── routes/          # health, consultas e IA
├── frontend/                # dashboard e chat em Next.js
├── sql/
│   ├── 002_bronze/          # tabelas de entrada
│   ├── 003_prata/           # tabelas e transformações
│   ├── 004_ouro/            # dimensões, fatos e agregações
│   ├── 001_database_and_schemas.sql
│   └── 005_ia_security_setup.sql
├── data/
│   ├── raw/                 # arquivos de origem
│   └── raw_ajusted/         # Parquet ajustado para carga
├── docker-compose.yml
└── .env.example
```

## Como executar com Docker

### Pré-requisitos

- Docker Desktop com Docker Compose;
- pelo menos 4 GB de memória disponíveis para os contêineres;
- SQL Server Management Studio, Azure Data Studio, DBeaver ou `sqlcmd` para executar os scripts de criação e carga.

### 1. Configure o ambiente

Na raiz do projeto, copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env
```

Defina uma senha forte aceita pelo SQL Server no `.env`:

```dotenv
SQLSERVER_HOST=sqlserver
SQLSERVER_PORT=1433
SQLSERVER_DB=DataWareHouse_RC
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=troque_por_uma_senha_forte
SQLSERVER_DRIVER=ODBC Driver 18 for SQL Server

NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Não versione o `.env`. Ele já está listado no `.gitignore`.

### 2. Suba os serviços

```powershell
docker compose up --build -d
```

Confira o estado dos contêineres:

```powershell
docker compose ps
```

### 3. Crie e carregue o Data Warehouse

Conecte-se ao SQL Server usando `localhost,11433`, o usuário `sa` e a senha definida no `.env`. Execute os scripts na ordem abaixo:

1. `sql/001_database_and_schemas.sql`;
2. scripts de criação em `sql/002_bronze/`;
3. carga dos arquivos Parquet de `data/raw_ajusted/` nas tabelas Bronze;
4. scripts de criação em `sql/003_prata/1_criar_tabela/`;
5. scripts de transformação em `sql/003_prata/2_transformacao/`;
6. dimensões em `sql/004_ouro/dimensoes/`;
7. fatos em `sql/004_ouro/fatos/`;
8. agregações em `sql/004_ouro/agregacoes/`;
9. opcionalmente, `sql/005_ia_security_setup.sql`.

> Atenção: o script `001_database_and_schemas.sql` remove e recria o banco `DataWareHouse_RC` caso ele já exista. Qualquer dado anterior será perdido.

Os scripts SQL criam as estruturas e transformações, mas a importação dos Parquet para a camada Bronze precisa ser realizada pela ferramenta de carga escolhida pelo usuário.

### 4. Acesse a aplicação

| Serviço | Endereço |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| SQL Server | `localhost:11433` |

Para acompanhar os logs:

```powershell
docker compose logs -f
```

Para encerrar os serviços sem apagar o volume do banco:

```powershell
docker compose down
```

## Execução local para desenvolvimento

O SQL Server ainda pode ser executado pelo Docker, enquanto backend e frontend rodam diretamente na máquina.

### Backend

É necessário ter Python 3.11 e o **ODBC Driver 18 for SQL Server** instalados. Ao executar o backend fora do Docker, altere no `.env` o host para `localhost` e a porta para `11433`.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

Em outro terminal, com Node.js 18 ou superior:

```powershell
cd frontend
npm install
npm run dev
```

## Variáveis de ambiente

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `SQLSERVER_HOST` | Host do SQL Server | `sqlserver` |
| `SQLSERVER_PORT` | Porta interna do SQL Server | `1433` |
| `SQLSERVER_DB` | Nome do banco | `DataWareHouse_RC` |
| `SQLSERVER_USER` | Usuário principal | `sa` |
| `SQLSERVER_PASSWORD` | Senha do usuário principal | — |
| `SQLSERVER_DRIVER` | Driver usado pelo pyodbc | `ODBC Driver 18 for SQL Server` |
| `SQLSERVER_IA_USER` | Usuário restrito do assistente | opcional |
| `SQLSERVER_IA_PASSWORD` | Senha do usuário restrito | opcional |
| `NEXT_PUBLIC_API_URL` | URL pública do backend | `http://localhost:8000` |
| `LLM_PROVIDER` | Provedor externo: `none`, `gemini` ou `openai` | `none` |
| `GEMINI_API_KEY` | Chave da API Gemini | opcional |
| `OPENAI_API_KEY` | Chave da API OpenAI | opcional |
| `LLM_MODEL` | Modelo externo escolhido | opcional |

O assistente funciona com respostas e regras locais quando `LLM_PROVIDER=none`. Para usar Gemini ou OpenAI, também é necessário instalar o SDK correspondente no backend e disponibilizar as variáveis ao contêiner.

## API

### Endpoints principais

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | Informações básicas da API |
| `GET` | `/health` | Estado da API e conexão com o banco |
| `GET` | `/consultas/hospitais` | Agregações mensais por hospital |
| `GET` | `/consultas/cids` | Agregações mensais por CID |
| `POST` | `/ia/pergunta` | Pergunta em linguagem natural |

Exemplo de consulta:

```powershell
Invoke-RestMethod "http://localhost:8000/consultas/hospitais?ano=2021&uf_hospital=SP&limit=10"
```

Exemplo de pergunta ao assistente:

```powershell
$body = @{ pergunta = "Quais hospitais tiveram mais internações?" } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8000/ia/pergunta" `
  -ContentType "application/json" `
  -Body $body
```

## Segurança do assistente

O fluxo de perguntas aplica uma validação de segurança antes de classificar e executar a solicitação. Perguntas analíticas são vinculadas a consultas SQL predefinidas; texto arbitrário do usuário não é executado como SQL.

Para aplicar o princípio do menor privilégio:

1. troque a senha demonstrativa dentro de `sql/005_ia_security_setup.sql`;
2. execute o script com uma conta administrativa;
3. configure `SQLSERVER_IA_USER=dw_ia_login` e a senha correspondente;
4. disponibilize essas variáveis ao serviço `backend` no Compose.

O usuário criado recebe somente `SELECT` no schema Ouro e tem acesso negado às camadas Bronze e Prata.

## Dados

Os diretórios `data/raw/` e `data/raw_ajusted/` podem conter arquivos volumosos. Antes de publicar ou redistribuir os dados, verifique os termos das fontes oficiais e confirme que não há informações sensíveis ou identificáveis no conjunto utilizado.

## Observações

- o projeto não possui, no momento, migrações ou um orquestrador automático para executar toda a carga SQL;
- o volume Docker preserva o banco entre reinicializações;
- `docker compose down -v` remove esse volume e apaga os dados do SQL Server;
- o endpoint `/health` é a verificação mais rápida da conexão entre API e banco.

