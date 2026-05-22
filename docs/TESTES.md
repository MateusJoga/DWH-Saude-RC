# Guia de Testes - Exemplos cURL

## Requisitos Antes de Testar
1. Docker rodando
2. Containers iniciados: `docker-compose up`
3. API disponível em `http://localhost:8000`
4. Banco de dados com dados populados

---

## 1. Verificar Saúde da API

```bash
curl -X GET "http://localhost:8000/health" -H "accept: application/json"
```

Resposta esperada:
```json
{
  "status": "healthy",
  "api_version": "1.0.0",
  "database": {
    "status": "connected",
    "latency_ms": 15.23,
    "server_version": "Microsoft SQL Server 2025 (RTM-CU1)"
  }
}
```

---

## 2. Testar Endpoint GET `/consultas/internacoes`

### 2.1 Listar primeiras 10 internações
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?limit=10" \
  -H "accept: application/json"
```

### 2.2 Filtrar por ano (2023)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?ano=2023&limit=20" \
  -H "accept: application/json"
```

### 2.3 Filtrar por ano e mês (2023/06 - junho)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?ano=2023&mes=6&limit=20" \
  -H "accept: application/json"
```

### 2.4 Filtrar por estado (São Paulo)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?uf_hospital=SP&limit=20" \
  -H "accept: application/json"
```

### 2.5 Filtrar por CNES (hospital específico)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?cnes=2012345&limit=20" \
  -H "accept: application/json"
```

### 2.6 Filtrar por CID (doença específica)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?codigo_cid=I10&limit=20" \
  -H "accept: application/json"
```

### 2.7 Múltiplos filtros combinados
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?ano=2023&mes=6&uf_hospital=SP&cnes=2012345&codigo_cid=I10&limit=10" \
  -H "accept: application/json"
```

### 2.8 Testar paginação
```bash
# Primeira página (registros 0-99)
curl -X GET "http://localhost:8000/consultas/internacoes?ano=2023&limit=100&offset=0" \
  -H "accept: application/json"

# Segunda página (registros 100-199)
curl -X GET "http://localhost:8000/consultas/internacoes?ano=2023&limit=100&offset=100" \
  -H "accept: application/json"

# Terceira página (registros 200-299)
curl -X GET "http://localhost:8000/consultas/internacoes?ano=2023&limit=100&offset=200" \
  -H "accept: application/json"
```

---

## 3. Testar Endpoint GET `/consultas/procedimentos`

### 3.1 Listar primeiros 10 procedimentos
```bash
curl -X GET "http://localhost:8000/consultas/procedimentos?limit=10" \
  -H "accept: application/json"
```

### 3.2 Filtrar por ano (2023)
```bash
curl -X GET "http://localhost:8000/consultas/procedimentos?ano=2023&limit=20" \
  -H "accept: application/json"
```

### 3.3 Filtrar por ano e mês (2023/06)
```bash
curl -X GET "http://localhost:8000/consultas/procedimentos?ano=2023&mes=6&limit=20" \
  -H "accept: application/json"
```

### 3.4 Filtrar por hospital (CNES)
```bash
curl -X GET "http://localhost:8000/consultas/procedimentos?cnes=2012345&limit=20" \
  -H "accept: application/json"
```

### 3.5 Filtrar por código de procedimento
```bash
curl -X GET "http://localhost:8000/consultas/procedimentos?codigo_procedimento=0301100036&limit=20" \
  -H "accept: application/json"
```

### 3.6 Múltiplos filtros combinados
```bash
curl -X GET "http://localhost:8000/consultas/procedimentos?ano=2023&mes=6&uf_hospital=SP&cnes=2012345&limit=20" \
  -H "accept: application/json"
```

### 3.7 Testar paginação
```bash
# Primeira página
curl -X GET "http://localhost:8000/consultas/procedimentos?ano=2023&limit=100&offset=0" \
  -H "accept: application/json"

# Segunda página
curl -X GET "http://localhost:8000/consultas/procedimentos?ano=2023&limit=100&offset=100" \
  -H "accept: application/json"
```

---

## 4. Testar Endpoints Existentes (Para Verificar Compatibilidade)

### 4.1 Agregações por Hospital
```bash
curl -X GET "http://localhost:8000/consultas/hospitais?ano=2023&mes=6&limit=10" \
  -H "accept: application/json"
```

### 4.2 Agregações por CID
```bash
curl -X GET "http://localhost:8000/consultas/cids?ano=2023&mes=6&limit=10" \
  -H "accept: application/json"
```

---

## 5. Acessar Documentação Interativa

### 5.1 Swagger UI
```bash
# Abrir no navegador
http://localhost:8000/docs
```

### 5.2 ReDoc (Documentação alternativa)
```bash
# Abrir no navegador
http://localhost:8000/redoc
```

---

## 6. Testar Limites e Validações

### 6.1 Testar limite máximo (1000)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?limit=1000" \
  -H "accept: application/json"
```

### 6.2 Testar limite acima do máximo (deve rejeitar ou limitar)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?limit=2000" \
  -H "accept: application/json"
```

### 6.3 Testar mes inválido (1-12)
```bash
curl -X GET "http://localhost:8000/consultas/internacoes?mes=13" \
  -H "accept: application/json"
```

---

## 7. Monitorar Resposta (com timing)

```bash
# Medir tempo de resposta
curl -w "\nTempo total: %{time_total}s\n" \
  -X GET "http://localhost:8000/consultas/internacoes?ano=2023&limit=100" \
  -H "accept: application/json"
```

---

## 8. Salvar Resposta em Arquivo

```bash
# Salvar em arquivo JSON
curl -X GET "http://localhost:8000/consultas/internacoes?ano=2023&limit=50" \
  -H "accept: application/json" \
  -o internacoes_2023.json

# Salvar procedimentos
curl -X GET "http://localhost:8000/consultas/procedimentos?ano=2023&limit=50" \
  -H "accept: application/json" \
  -o procedimentos_2023.json
```

---

## 9. Testar com jq (para formatação bonita)

Instale jq: `chocolatey install jq` (Windows) ou `apt-get install jq` (Linux)

```bash
# Formatado e colorido
curl -s "http://localhost:8000/consultas/internacoes?ano=2023&limit=5" \
  -H "accept: application/json" | jq '.'

# Listar apenas campos específicos
curl -s "http://localhost:8000/consultas/internacoes?ano=2023&limit=5" \
  -H "accept: application/json" | jq '.[].id_internacao'

# Contar registros
curl -s "http://localhost:8000/consultas/internacoes?ano=2023&limit=100" \
  -H "accept: application/json" | jq 'length'
```

---

## 10. Testes de Performance (Cargas)

```bash
# Simular 10 requisições sequenciais
for i in {1..10}; do
  echo "Requisição $i:"
  curl -w "Tempo: %{time_total}s\n" -s \
    "http://localhost:8000/consultas/internacoes?ano=2023&limit=100&offset=$((i*100))" \
    -H "accept: application/json" | jq 'length'
done
```

---

## 11. Validar Respostas Esperadas

### Para `/consultas/internacoes`, esperado:
```json
[
  {
    "id_internacao": <int>,
    "numero_aih": <string>,
    "data_referencia": <date>,
    "ano": <int>,
    "mes": <int>,
    "nome_mes": <string>,
    "id_hospital": <int>,
    "cnes": <string>,
    "municipio_hospital": <string>,
    "uf_hospital": <string>,
    "codigo_cid": <string>,
    "valor_total_internacao": <float>,
    "dias_permanencia": <int>,
    "obito": <int>,
    ...
  }
]
```

### Para `/consultas/procedimentos`, esperado:
```json
[
  {
    "id_procedimento": <int>,
    "numero_aih": <string>,
    "data_referencia": <date>,
    "ano": <int>,
    "mes": <int>,
    "id_hospital": <int>,
    "cnes": <string>,
    "codigo_procedimento": <string>,
    "valor_procedimento": <float>,
    "quantidade_atos": <int>,
    ...
  }
]
```

---

## Dicas de Troubleshooting

### Se receber erro 500
```bash
# Verifique se há dados no banco
docker logs dw_backend

# Verifique conectividade SQL Server
docker logs dw_sqlserver
```

### Se não encontrar nenhum registro
- Verifique se o `ano` e `mes` existem nos dados
- Verifique `limit` e `offset`
- Tente com filtros mais amplos

### Se a resposta for lenta
- Reduza `limit` para 50
- Adicione filtros específicos para reduzir volume
- Considere paginação com `offset`
