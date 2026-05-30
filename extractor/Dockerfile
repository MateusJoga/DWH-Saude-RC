# Usa uma imagem oficial do Python slim (mais leve para produção)
FROM python:3.11-slim

# Instala dependências do sistema e o Driver ODBC do SQL Server
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    gnupg \
    unixodbc \
    unixodbc-dev \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && echo "deb [signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de dependências e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia os scripts necessários (com os novos nomes padronizados) para dentro do container
COPY transformer.py .
COPY loader.py .
COPY orchestrator.py .

# Garante que as pastas de dados existam como volumes ou diretórios locais se necessário
RUN mkdir -p data/raw data/raw_ajusted

# O ponto de entrada agora é o orquestrador do pipeline
ENTRYPOINT ["python", "-u", "orchestrator.py"]