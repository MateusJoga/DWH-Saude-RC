# Documentação dos Novos Endpoints - DW Saúde API

## Resumo
Foram adicionados 2 novos endpoints para acessar dados de fatos granulares do Data Warehouse, complementando os endpoints de agregações já existentes.

---

## 1. GET `/consultas/internacoes`

### Descrição
Retorna fatos granulares de internações na camada Ouro do DW. Cada linha representa uma internação individual com todas as dimensões e métricas.

### Query Parameters
| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `ano` | integer | Não | Filtrar por ano específico | `2023` |
| `mes` | integer | Não | Filtrar por mês (1-12) | `6` |
| `uf_hospital` | string | Não | Filtrar por sigla do estado | `SP` |
| `cnes` | string | Não | Filtrar por código CNES | `2012345` |
| `codigo_cid` | string | Não | Filtrar por código CID | `I10` |
| `limit` | integer | Não | Máximo de registros (1-1000) | `100` (padrão) |
| `offset` | integer | Não | Quantidade de registros a pular | `0` (padrão) |

### Response
```json
[
  {
    "id_internacao": 12345,
    "numero_aih": "AIH123456",
    "data_referencia": "2023-06-15",
    "ano": 2023,
    "mes": 6,
    "nome_mes": "junho",
    "trimestre": 2,
    "semestre": 1,
    "id_hospital": 1,
    "cnes": "2012345",
    "municipio_hospital": "São Paulo",
    "uf_hospital": "SP",
    "municipio_residencia": "São Paulo",
    "municipio_internacao": "São Paulo",
    "sexo": "M",
    "faixa_etaria": "60-69",
    "raca_cor": "Branca",
    "escolaridade": "Ensino Superior",
    "tipo_identificacao": "CIRÚRGICO",
    "especialidade": "CLÍNICA CIRÚRGICA",
    "carater_internacao": "Eletivo",
    "complexidade": "Alta",
    "tipo_gestao": "Estadual",
    "codigo_cid": "I10",
    "grupo_cid": "Doenças do aparelho circulatório",
    "capitulo_cid": "IX",
    "valor_servicos_hospitalares": 5000.00,
    "valor_servicos_profissionais": 1200.00,
    "valor_total_internacao": 6200.00,
    "valor_uti": 0.00,
    "dias_permanencia": 5,
    "quantidade_diarias": 5,
    "obito": 0,
    "internacao_longa_permanencia": 0,
    "quantidade_internacoes": 1
  }
]
```

### Exemplo de Uso

#### Get todas as internações de São Paulo em 2023
```
GET /consultas/internacoes?uf_hospital=SP&ano=2023&limit=50
```

#### Get internações de um hospital específico por CID
```
GET /consultas/internacoes?cnes=2012345&codigo_cid=I10&mes=6
```

#### Get com paginação
```
GET /consultas/internacoes?ano=2023&limit=100&offset=100
```

---

## 2. GET `/consultas/procedimentos`

### Descrição
Retorna fatos granulares de procedimentos na camada Ouro do DW. Cada linha representa um procedimento individual com todas as dimensões e métricas.

### Query Parameters
| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `ano` | integer | Não | Filtrar por ano específico | `2023` |
| `mes` | integer | Não | Filtrar por mês (1-12) | `6` |
| `uf_hospital` | string | Não | Filtrar por sigla do estado | `SP` |
| `cnes` | string | Não | Filtrar por código CNES | `2012345` |
| `codigo_procedimento` | string | Não | Filtrar por código de procedimento | `0301100036` |
| `limit` | integer | Não | Máximo de registros (1-1000) | `100` (padrão) |
| `offset` | integer | Não | Quantidade de registros a pular | `0` (padrão) |

### Response
```json
[
  {
    "id_procedimento": 54321,
    "numero_aih": "AIH123456",
    "data_referencia": "2023-06-15",
    "ano": 2023,
    "mes": 6,
    "nome_mes": "junho",
    "trimestre": 2,
    "semestre": 1,
    "id_hospital": 1,
    "cnes": "2012345",
    "municipio_hospital": "São Paulo",
    "uf_hospital": "SP",
    "codigo_procedimento": "0301100036",
    "procedimento_cirurgico": 1,
    "procedimento_alto_custo": 0,
    "codigo_cbo": "2251-10",
    "descricao_profissional": "Médico cirurgião",
    "categoria_profissional": "Médico",
    "codigo_cid": "I10",
    "grupo_cid": "Doenças do aparelho circulatório",
    "capitulo_cid": "IX",
    "valor_procedimento": 800.00,
    "pontos_sus": 250,
    "tipo_financiamento": "SUS",
    "codigo_faec": null,
    "possui_faec": 0,
    "quantidade_atos": 1,
    "quantidade_procedimentos": 1,
    "complexidade": "Alta",
    "quantidade_registros": 1
  }
]
```

### Exemplo de Uso

#### Get todos os procedimentos de São Paulo em 2023
```
GET /consultas/procedimentos?uf_hospital=SP&ano=2023&limit=50
```

#### Get procedimentos cirúrgicos de um hospital
```
GET /consultas/procedimentos?cnes=2012345&limit=100
```

#### Get com paginação
```
GET /consultas/procedimentos?ano=2023&mes=6&limit=100&offset=200
```

---

## Filtros por Período

Todos os endpoints suportam filtros por período:

### Filtrar por Ano
```
GET /consultas/internacoes?ano=2023
GET /consultas/procedimentos?ano=2023
```

### Filtrar por Ano e Mês
```
GET /consultas/internacoes?ano=2023&mes=6
GET /consultas/procedimentos?ano=2023&mes=6
```

### Combinações de Filtros
Os filtros podem ser combinados livremente:
```
GET /consultas/internacoes?ano=2023&mes=6&uf_hospital=SP&cnes=2012345&codigo_cid=I10&limit=50&offset=0
GET /consultas/procedimentos?ano=2023&mes=6&uf_hospital=SP&cnes=2012345&limit=100
```

---

## Paginação

Ambos os endpoints suportam paginação com `limit` e `offset`:

- **limit**: Número máximo de registros a retornar (1-1000, padrão: 100)
- **offset**: Número de registros a pular a partir do início (padrão: 0)

### Exemplo de Paginação
```
# Primeira página (primeiros 100 registros)
GET /consultas/internacoes?limit=100&offset=0

# Segunda página (próximos 100 registros)
GET /consultas/internacoes?limit=100&offset=100

# Terceira página (próximos 100 registros)
GET /consultas/internacoes?limit=100&offset=200
```

---

## Documentação Swagger

Todos os endpoints estão documentados automaticamente via Swagger/FastAPI. Acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Os endpoints aparecem sob a tag "Consultas Ouro" na documentação interativa.

---

## Tratamento de Erros

### 500 - Internal Server Error
Se ocorrer erro na consulta ao banco de dados:

```json
{
  "detail": "Erro ao consultar a view ouro.fato_internacoes: [error message]"
}
```

---

## Endpoints Existentes (para referência)

### GET `/consultas/hospitais`
Retorna agregações mensais por hospital. Mantido como estava.

### GET `/consultas/cids`
Retorna agregações mensais por CID. Mantido como estava.

### GET `/health`
Verifica saúde da API e conectividade com banco.

---

## Notas Técnicas

- **Paginação**: Implementada com OFFSET/LIMIT compatível com SQL Server 2012+
- **Ordenação**: Padrão: `ano DESC, mes DESC, id_internacao/id_procedimento ASC`
- **Segurança**: Todas as queries usam parameterização SQL para evitar SQL Injection
- **Performance**: Sem índices criados ainda; recomenda-se otimizar conforme necessário
- **Limitações**: Máximo de 1000 registros por página para evitar sobrecarga
