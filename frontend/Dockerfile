FROM node:18-alpine

WORKDIR /app

# Copia arquivos de definição de dependências
COPY package*.json ./

# Instala todas as dependências do projeto
RUN npm install

# Copia o código fonte do frontend
COPY . .

# Expõe a porta 3000 utilizada pelo Next.js
EXPOSE 3000

# Variáveis globais para rodar Next.js no Docker
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Executa o servidor de desenvolvimento
CMD ["npm", "run", "dev"]
