FROM python:3.11-slim

# Impede o Python de escrever arquivos compilados (.pyc) no disco
ENV PYTHONDONTWRITEBYTECODE=1
# Impede o Python de reter dados em buffer no stdout e stderr
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências do sistema e o driver ODBC oficial do SQL Server
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg2 \
    apt-transport-https \
    unixodbc \
    unixodbc-dev \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de requisitos e instala as dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante da aplicação
COPY . .

# Expõe a porta 8000 que será usada pelo FastAPI
EXPOSE 8000

# Executa o servidor de desenvolvimento Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
