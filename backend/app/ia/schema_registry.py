import logging
from dataclasses import dataclass

logger = logging.getLogger("dw_backend")


@dataclass(frozen=True)
class MetricSpec:
    name: str
    expression: str
    description: str
    synonyms: tuple[str, ...] = ()


@dataclass(frozen=True)
class TableSpec:
    name: str
    description: str
    columns: tuple[str, ...]
    metrics: tuple[MetricSpec, ...]
    dimensions: tuple[str, ...]
    when_to_use: str
    avoid_when: str
    synonyms: tuple[str, ...] = ()

    @property
    def short_name(self) -> str:
        return self.name.split(".", 1)[1]

    @property
    def allowed_identifiers(self) -> set[str]:
        return set(self.columns) | {metric.name for metric in self.metrics}

    def compact_dict(self) -> dict[str, object]:
        return {
            "tabela": self.name,
            "descricao": self.description,
            "colunas": list(self.columns),
            "dimensoes": list(self.dimensions),
            "metricas_calculaveis": [
                {
                    "nome": metric.name,
                    "expressao": metric.expression,
                    "descricao": metric.description,
                }
                for metric in self.metrics
            ],
            "quando_usar": self.when_to_use,
            "evitar_quando": self.avoid_when,
        }


COMMON_TIME = ("ano", "mes", "nome_mes")
COMMON_HOSPITAL = ("id_hospital", "cnes", "municipio_hospital", "uf_hospital")
COMMON_CID = ("codigo_cid", "grupo_cid", "capitulo_cid")

INTERNACAO_AGG_METRICS = (
    MetricSpec("quantidade_internacoes", "SUM(quantidade_internacoes)", "Total de internacoes.", ("internacoes", "volume", "casos")),
    MetricSpec("valor_total_internacoes", "SUM(valor_total_internacoes)", "Valor total de internacoes.", ("valor", "custo", "gasto")),
    MetricSpec("valor_total_uti", "SUM(valor_total_uti)", "Valor total de UTI.", ("uti",)),
    MetricSpec("media_dias_permanencia", "AVG(media_dias_permanencia)", "Media de dias de permanencia.", ("permanencia", "dias")),
    MetricSpec("quantidade_obitos", "SUM(quantidade_obitos)", "Total de obitos.", ("obitos", "mortes", "mortalidade")),
    MetricSpec("taxa_obito_percentual", "AVG(taxa_obito_percentual)", "Taxa media de obito percentual.", ("taxa de obito", "letalidade")),
    MetricSpec("quantidade_longa_permanencia", "SUM(quantidade_longa_permanencia)", "Total de internacoes de longa permanencia.", ("longa permanencia",)),
)
INTERNACAO_AGG_METRIC_COLUMNS = tuple(metric.name for metric in INTERNACAO_AGG_METRICS)


SCHEMA_REGISTRY: dict[str, TableSpec] = {
    "ouro.fato_internacoes": TableSpec(
        name="ouro.fato_internacoes",
        description="Fato detalhado de internacoes hospitalares, uma linha por internacao/AIH.",
        columns=(
            "id_internacao",
            "numero_aih",
            "data_referencia",
            "ano",
            "mes",
            "nome_mes",
            "trimestre",
            "semestre",
            "id_hospital",
            "cnes",
            "municipio_hospital",
            "uf_hospital",
            "codigo_municipio_residencia",
            "codigo_municipio_internacao",
            "sexo",
            "faixa_etaria",
            "raca_cor",
            "escolaridade",
            "tipo_identificacao",
            "especialidade",
            "carater_internacao",
            "complexidade",
            "tipo_gestao",
            "codigo_cid",
            "grupo_cid",
            "capitulo_cid",
            "valor_servicos_hospitalares",
            "valor_servicos_profissionais",
            "valor_total_internacao",
            "valor_uti",
            "dias_permanencia",
            "quantidade_diarias",
            "obito",
            "internacao_longa_permanencia",
            "quantidade_internacoes",
        ),
        dimensions=(
            "id_internacao",
            "numero_aih",
            "data_referencia",
            "ano",
            "mes",
            "nome_mes",
            "trimestre",
            "semestre",
            "id_hospital",
            "cnes",
            "municipio_hospital",
            "uf_hospital",
            "codigo_municipio_residencia",
            "codigo_municipio_internacao",
            "sexo",
            "faixa_etaria",
            "raca_cor",
            "escolaridade",
            "tipo_identificacao",
            "especialidade",
            "carater_internacao",
            "complexidade",
            "tipo_gestao",
            "codigo_cid",
            "grupo_cid",
            "capitulo_cid",
            "obito",
            "internacao_longa_permanencia",
        ),
        metrics=(
            MetricSpec("quantidade_internacoes", "SUM(quantidade_internacoes)", "Total de internacoes.", ("internacoes", "casos")),
            MetricSpec(
                "quantidade_obitos",
                "SUM(CASE WHEN obito = 1 THEN 1 ELSE 0 END)",
                "Contagem de obitos. Na fato_internacoes nao existe coluna quantidade_obitos nem coluna obitos; use a coluna obito, que e BIT.",
                ("obitos", "mortes"),
            ),
            MetricSpec("valor_total_internacoes", "SUM(valor_total_internacao)", "Valor total de internacoes.", ("valor", "custo")),
            MetricSpec("valor_servicos_hospitalares", "SUM(valor_servicos_hospitalares)", "Valor de servicos hospitalares.", ("servicos hospitalares",)),
            MetricSpec("valor_servicos_profissionais", "SUM(valor_servicos_profissionais)", "Valor de servicos profissionais.", ("servicos profissionais",)),
            MetricSpec("valor_total_uti", "SUM(valor_uti)", "Valor total de UTI.", ("uti",)),
            MetricSpec("custo_medio_internacao", "AVG(valor_total_internacao)", "Custo medio por internacao.", ("custo medio", "valor medio")),
            MetricSpec("media_dias_permanencia", "AVG(dias_permanencia)", "Media de dias de permanencia.", ("permanencia", "dias")),
            MetricSpec("quantidade_diarias", "SUM(quantidade_diarias)", "Total de diarias.", ("diarias",)),
        ),
        when_to_use=(
            "Use para analises detalhadas que exigem atributos de paciente, AIH, sexo, faixa etaria, obito, CID, especialidade, permanencia ou valores de internacao. "
            "Use fato_internacoes quando a pergunta mencionar idosos, faixa etaria, sexo, homens, mulheres, raca/cor, escolaridade ou perfil do paciente. "
            "Para idosos, usar faixa_etaria = 'Idoso'. Para obitos, usar obito = 1 ou SUM(CASE WHEN obito = 1 THEN 1 ELSE 0 END)."
        ),
        avoid_when="Evite para rankings ou evolucoes simples por hospital, CID ou mes que ja estejam cobertos por views agregadas.",
        synonyms=("internacao", "internacoes", "paciente", "sexo", "mulheres", "homens", "idosos", "obito", "permanencia", "especialidade", "aih"),
    ),
    "ouro.fato_procedimentos": TableSpec(
        name="ouro.fato_procedimentos",
        description="Fato detalhado de procedimentos hospitalares, uma linha por procedimento/ato profissional associado a AIH.",
        columns=(
            "id_procedimento",
            "numero_aih",
            "data_referencia",
            "ano",
            "mes",
            "nome_mes",
            "trimestre",
            "semestre",
            "id_hospital",
            "cnes",
            "municipio_hospital",
            "uf_hospital",
            "codigo_procedimento",
            "procedimento_cirurgico",
            "procedimento_alto_custo",
            "codigo_cbo",
            "descricao_profissional",
            "categoria_profissional",
            "codigo_cid",
            "grupo_cid",
            "capitulo_cid",
            "valor_procedimento",
            "pontos_sus",
            "tipo_financiamento",
            "possui_faec",
            "quantidade_atos",
            "quantidade_procedimentos",
            "complexidade",
            "quantidade_registros",
        ),
        dimensions=(
            "id_procedimento",
            "numero_aih",
            "data_referencia",
            "ano",
            "mes",
            "nome_mes",
            "trimestre",
            "semestre",
            "id_hospital",
            "cnes",
            "municipio_hospital",
            "uf_hospital",
            "codigo_procedimento",
            "procedimento_cirurgico",
            "procedimento_alto_custo",
            "codigo_cbo",
            "descricao_profissional",
            "categoria_profissional",
            "codigo_cid",
            "grupo_cid",
            "capitulo_cid",
            "tipo_financiamento",
            "possui_faec",
            "complexidade",
        ),
        metrics=(
            MetricSpec("quantidade_registros", "SUM(quantidade_registros)", "Total de registros.", ("registros",)),
            MetricSpec("quantidade_atos", "SUM(quantidade_atos)", "Total de atos.", ("atos",)),
            MetricSpec("quantidade_procedimentos", "SUM(quantidade_procedimentos)", "Total de procedimentos.", ("procedimentos",)),
            MetricSpec("valor_total_procedimentos", "SUM(valor_procedimento)", "Valor total dos procedimentos.", ("valor", "custo")),
            MetricSpec("valor_medio_procedimento", "AVG(valor_procedimento)", "Valor medio do procedimento.", ("custo medio", "valor medio")),
            MetricSpec("pontos_sus_total", "SUM(pontos_sus)", "Total de pontos SUS.", ("pontos sus", "pontuacao")),
        ),
        when_to_use="Use para analises detalhadas de procedimentos com profissional, CBO, CID, FAEC, financiamento, procedimento cirurgico ou alto custo.",
        avoid_when="Evite para rankings mensais simples de procedimentos quando ouro.agg_procedimentos_mensais atender.",
        synonyms=("procedimento", "procedimentos", "ato profissional", "cbo", "profissional", "faec", "financiamento", "cirurgico", "alto custo", "pontos sus"),
    ),
    "ouro.agg_hospital_mensal": TableSpec(
        name="ouro.agg_hospital_mensal",
        description="Agregacao mensal de internacoes por hospital.",
        columns=(*COMMON_TIME, *COMMON_HOSPITAL, *INTERNACAO_AGG_METRIC_COLUMNS),
        dimensions=(*COMMON_TIME, *COMMON_HOSPITAL),
        metrics=INTERNACAO_AGG_METRICS,
        when_to_use="Use para rankings, totais e evolucao mensal/anual de internacoes, custos, UTI, obitos ou permanencia por hospital/CNES.",
        avoid_when="Evite quando a pergunta exigir CID, perfil do paciente, especialidade ou detalhes no nivel da internacao.",
        synonyms=("hospital", "hospitais", "cnes", "internacoes", "obitos", "uti", "mortalidade hospitalar"),
    ),
    "ouro.agg_cid_mensal": TableSpec(
        name="ouro.agg_cid_mensal",
        description="Agregacao mensal de internacoes por CID.",
        columns=(*COMMON_TIME, *COMMON_CID, *INTERNACAO_AGG_METRIC_COLUMNS),
        dimensions=(*COMMON_TIME, *COMMON_CID),
        metrics=INTERNACAO_AGG_METRICS,
        when_to_use="Use para rankings e evolucao mensal/anual por CID, diagnostico, grupo CID ou capitulo CID.",
        avoid_when=(
            "Evite quando a pergunta exigir hospital, sexo, faixa etaria, especialidade ou outro detalhe ausente nesta agregacao. "
            "Nao usar agg_cid_mensal quando a pergunta mencionar idosos, faixa etaria, sexo, homens, mulheres, raca/cor, escolaridade ou perfil do paciente. "
            "Essa view nao possui faixa_etaria nem sexo."
        ),
        synonyms=("cid", "diagnostico", "doenca", "doencas", "motivos", "patologia", "obitos por cid"),
    ),
    "ouro.agg_procedimentos_mensais": TableSpec(
        name="ouro.agg_procedimentos_mensais",
        description="Agregacao mensal de procedimentos por hospital, procedimento, categoria profissional, complexidade e financiamento.",
        columns=(
            *COMMON_TIME,
            *COMMON_HOSPITAL,
            "codigo_procedimento",
            "procedimento_cirurgico",
            "procedimento_alto_custo",
            "categoria_profissional",
            "complexidade",
            "tipo_financiamento",
            "possui_faec",
            "quantidade_registros",
            "total_atos",
            "total_procedimentos",
            "valor_total_procedimentos",
            "valor_medio_procedimento",
            "total_pontos_sus",
            "quantidade_procedimentos_cirurgicos",
            "quantidade_procedimentos_alto_custo",
        ),
        dimensions=(
            *COMMON_TIME,
            *COMMON_HOSPITAL,
            "codigo_procedimento",
            "procedimento_cirurgico",
            "procedimento_alto_custo",
            "categoria_profissional",
            "complexidade",
            "tipo_financiamento",
            "possui_faec",
        ),
        metrics=(
            MetricSpec("quantidade_registros", "SUM(quantidade_registros)", "Total de registros.", ("registros",)),
            MetricSpec("total_atos", "SUM(total_atos)", "Total de atos profissionais.", ("atos",)),
            MetricSpec("total_procedimentos", "SUM(total_procedimentos)", "Total de procedimentos.", ("procedimentos",)),
            MetricSpec("valor_total_procedimentos", "SUM(valor_total_procedimentos)", "Valor total dos procedimentos.", ("valor", "custo", "gasto")),
            MetricSpec("valor_medio_procedimento", "AVG(valor_medio_procedimento)", "Valor medio dos procedimentos.", ("custo medio", "valor medio")),
            MetricSpec("total_pontos_sus", "SUM(total_pontos_sus)", "Total de pontos SUS.", ("pontos sus", "pontuacao")),
            MetricSpec("quantidade_procedimentos_cirurgicos", "SUM(quantidade_procedimentos_cirurgicos)", "Total de procedimentos cirurgicos.", ("cirurgicos", "cirurgia")),
            MetricSpec("quantidade_procedimentos_alto_custo", "SUM(quantidade_procedimentos_alto_custo)", "Total de procedimentos de alto custo.", ("alto custo",)),
        ),
        when_to_use="Use para rankings e totais mensais/anuais de procedimentos, atos, valores, pontos SUS, FAEC, financiamento, cirurgicos ou alto custo.",
        avoid_when="Evite quando a pergunta exigir CBO, descricao profissional, CID ou detalhes nao presentes nesta agregacao.",
        synonyms=("procedimento", "procedimentos", "ato", "atos", "profissional", "faec", "financiamento", "cirurgico", "cirurgia", "alto custo", "pontos sus"),
    ),
    "ouro.agg_internacoes_mensais": TableSpec(
        name="ouro.agg_internacoes_mensais",
        description="Agregacao mensal ampla de internacoes por hospital, especialidade, complexidade, grupo CID e capitulo CID.",
        columns=(
            *COMMON_TIME,
            *COMMON_HOSPITAL,
            "especialidade",
            "complexidade",
            "grupo_cid",
            "capitulo_cid",
            *INTERNACAO_AGG_METRIC_COLUMNS,
        ),
        dimensions=(
            *COMMON_TIME,
            *COMMON_HOSPITAL,
            "especialidade",
            "complexidade",
            "grupo_cid",
            "capitulo_cid",
        ),
        metrics=INTERNACAO_AGG_METRICS,
        when_to_use="Use para evolucao mensal/anual e comparacoes de internacoes por hospital, especialidade, complexidade, grupo CID ou capitulo CID.",
        avoid_when="Evite quando a pergunta exigir codigo CID individual, sexo, faixa etaria ou dados no nivel da AIH.",
        synonyms=("internacoes", "evolucao", "comparacao", "compare", "ano", "mes", "especialidade", "complexidade", "grupo cid"),
    ),
    "ouro.agg_mortalidade_hospital": TableSpec(
        name="ouro.agg_mortalidade_hospital",
        description="Agregacao mensal de mortalidade por hospital.",
        columns=(
            "ano",
            "mes",
            "id_hospital",
            "cnes",
            "municipio_hospital",
            "total_internacoes",
            "total_obitos",
            "taxa_mortalidade",
        ),
        dimensions=("ano", "mes", "id_hospital", "cnes", "municipio_hospital"),
        metrics=(
            MetricSpec("total_internacoes", "SUM(total_internacoes)", "Total de internacoes.", ("internacoes",)),
            MetricSpec("total_obitos", "SUM(total_obitos)", "Total de obitos.", ("obitos", "mortes")),
            MetricSpec("taxa_mortalidade", "AVG(taxa_mortalidade)", "Taxa media de mortalidade.", ("mortalidade", "taxa de mortalidade")),
        ),
        when_to_use="Use para perguntas especificas de mortalidade, taxa de mortalidade ou obitos por hospital.",
        avoid_when="Evite para analises de CID, perfil de paciente, procedimentos ou internacoes que nao sejam focadas em mortalidade hospitalar.",
        synonyms=("mortalidade", "taxa de mortalidade", "obitos por hospital", "mortes por hospital"),
    ),
}


def get_table(table_name: str) -> TableSpec | None:
    return SCHEMA_REGISTRY.get(table_name.lower())


def list_tables() -> list[TableSpec]:
    return list(SCHEMA_REGISTRY.values())


def compact_schema_for_prompt(tables: list[TableSpec]) -> list[dict[str, object]]:
    compact_schema = [table.compact_dict() for table in tables]
    logger.info("Schema compacto enviado para LLM: %s", compact_schema)
    return compact_schema


def llama_table_description(table: TableSpec) -> str:
    descriptions = {
        "ouro.fato_internacoes": (
            "Fato detalhado de procedimentos. Use para CBO, profissional, FAEC, financiamento, cirurgia, alto custo, complexidade e custo por procedimento. "
            "Para custo medio global por procedimento, agrupe por codigo_procedimento e use AVG(valor_procedimento). "
            "Nao invente colunas."
        ),
        "ouro.fato_procedimentos": (
            "Fato detalhado de procedimentos. Use para CBO, profissional, FAEC, financiamento, cirurgia, alto custo, complexidade e custo por procedimento. "
            "Custo medio pode usar AVG(valor_procedimento). Nao invente colunas."
        ),
        "ouro.agg_hospital_mensal": (
            "Agregacao mensal por hospital. Use para ranking ou evolucao de hospitais, CNES, internacoes, custos, UTI, permanencia e obitos por hospital. "
            "Evite quando precisar de CID individual, sexo, faixa_etaria ou perfil do paciente."
        ),
        "ouro.agg_cid_mensal": (
            "Agregacao por CID. Use para doencas, CID, diagnosticos e obitos por CID. Pode usar SUM(quantidade_obitos). "
            "Nao possui sexo, faixa_etaria nem perfil do paciente; para idosos use fato_internacoes."
        ),
        "ouro.agg_procedimentos_mensais": (
            "Agregacao mensal de procedimentos. Use para ranking de procedimentos, custo medio, valor total, pontos SUS, FAEC, financiamento, cirurgia, alto custo e alta complexidade. "
            "Para alta complexidade use complexidade = 'Alta Complexidade'."
            "Para ranking global por codigo_procedimento, agrupe por codigo_procedimento e use AVG(valor_medio_procedimento); não ordene linhas mensais diretamente."
            "Nunca selecione valor_medio_procedimento diretamente para ranking global. Para ranking por codigo_procedimento, sempre use GROUP BY codigo_procedimento e AVG(valor_medio_procedimento)."
        ),
        "ouro.agg_internacoes_mensais": (
            "Agregacao mensal ampla de internacoes. Use para evolucao por ano ou mes, hospital, especialidade, complexidade, grupo CID e capitulo CID. "
            "Evite quando precisar de sexo, faixa_etaria, idosos ou perfil do paciente."
            "Nunca selecione taxa_obito_percentual diretamente para ranking global por especialidade. "
            "Para ranking por especialidade, sempre use GROUP BY especialidade. "
        ),
    }
    description = descriptions.get(
        table.name,
        f"{table.description} Use quando: {table.when_to_use}. Evite quando: {table.avoid_when}. Nao invente colunas.",
    )

    if len(description) > 500:
        return description[:497].rstrip() + "..."
    return description


def llama_context_query_kwargs(allowed_tables: list[str]) -> dict[str, str]:
    context: dict[str, str] = {}

    for table_name in allowed_tables:
        table = get_table(table_name)
        if not table:
            logger.warning("Tabela nao encontrada no schema_registry para contexto LlamaIndex: %s", table_name)
            continue

        context[table.short_name] = llama_table_description(table)

    logger.info(
        "Contexto LLM | tabelas=%s | chars=%s",
        list(context.keys()),
        sum(len(value) for value in context.values()),
    )
    return context
