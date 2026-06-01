from dataclasses import dataclass, field
from typing import Any, Literal


Aggregation = Literal["sum", "avg", "count"]
FilterOperator = Literal["eq", "like", "gte", "lte"]
DataType = Literal["int", "decimal", "string", "bool", "date"]
TableType = Literal["agg", "fato", "dim"]


@dataclass(frozen=True)
class ColumnDef:
    name: str
    data_type: DataType
    description: str
    allowed_operators: tuple[FilterOperator, ...] = ("eq",)
    synonyms: tuple[str, ...] = ()


@dataclass(frozen=True)
class MetricDef:
    name: str
    aggregation: Aggregation
    description: str
    source_column: str | None = None
    synonyms: tuple[str, ...] = ()


@dataclass(frozen=True)
class TableDef:
    name: str
    table_type: TableType
    description: str
    dimensions: dict[str, ColumnDef]
    metrics: dict[str, MetricDef]
    filters: set[str] = field(default_factory=set)
    synonyms: tuple[str, ...] = ()
    examples: tuple[str, ...] = ()

    @property
    def columns(self) -> set[str]:
        return set(self.dimensions) | set(self.metrics)


TEXT_FILTERS: tuple[FilterOperator, ...] = ("eq", "like")
NUMERIC_FILTERS: tuple[FilterOperator, ...] = ("eq", "gte", "lte")
DATE_FILTERS: tuple[FilterOperator, ...] = ("eq", "gte", "lte")


def col(
    name: str,
    data_type: DataType,
    description: str,
    operators: tuple[FilterOperator, ...] = ("eq",),
    synonyms: tuple[str, ...] = (),
) -> ColumnDef:
    return ColumnDef(name, data_type, description, operators, synonyms)


def metric(
    name: str,
    aggregation: Aggregation,
    description: str,
    source_column: str | None = None,
    synonyms: tuple[str, ...] = (),
) -> MetricDef:
    return MetricDef(name, aggregation, description, source_column, synonyms)


COMMON_TIME = {
    "ano": col("ano", "int", "Ano de competencia.", NUMERIC_FILTERS, ("ano", "exercicio")),
    "mes": col("mes", "int", "Mes de competencia.", NUMERIC_FILTERS, ("mes", "meses")),
    "nome_mes": col("nome_mes", "string", "Nome do mes.", TEXT_FILTERS),
}

COMMON_HOSPITAL = {
    "id_hospital": col("id_hospital", "int", "Identificador tecnico do hospital.", NUMERIC_FILTERS),
    "cnes": col("cnes", "string", "Codigo CNES do estabelecimento.", TEXT_FILTERS, ("hospital", "unidade")),
    "municipio_hospital": col("municipio_hospital", "string", "Municipio do hospital.", TEXT_FILTERS),
    "uf_hospital": col("uf_hospital", "string", "UF do hospital.", TEXT_FILTERS),
}

COMMON_CID = {
    "codigo_cid": col("codigo_cid", "string", "Codigo CID.", TEXT_FILTERS, ("cid", "diagnostico")),
    "grupo_cid": col("grupo_cid", "string", "Grupo do CID.", TEXT_FILTERS),
    "capitulo_cid": col("capitulo_cid", "string", "Capitulo do CID.", TEXT_FILTERS),
}

COMMON_INTERNACAO_METRICS = {
    "quantidade_internacoes": metric("quantidade_internacoes", "sum", "Total de internacoes.", synonyms=("internacoes", "ocorrencias", "volume")),
    "valor_total_internacoes": metric("valor_total_internacoes", "sum", "Valor total de internacoes.", synonyms=("custo", "valor", "gasto")),
    "valor_total_uti": metric("valor_total_uti", "sum", "Valor total de UTI.", synonyms=("uti",)),
    "media_dias_permanencia": metric("media_dias_permanencia", "avg", "Media de dias de permanencia.", synonyms=("permanencia",)),
    "quantidade_obitos": metric("quantidade_obitos", "sum", "Total de obitos.", synonyms=("obitos", "mortes")),
    "taxa_obito_percentual": metric("taxa_obito_percentual", "avg", "Taxa media de obito percentual.", synonyms=("mortalidade", "letalidade")),
    "quantidade_longa_permanencia": metric("quantidade_longa_permanencia", "sum", "Total de longas permanencias."),
}

FATO_INTERNACAO_DIMS = {
    "id_internacao": col("id_internacao", "int", "Identificador da internacao.", NUMERIC_FILTERS),
    "numero_aih": col("numero_aih", "string", "Numero da AIH.", TEXT_FILTERS),
    "data_referencia": col("data_referencia", "date", "Data de referencia.", DATE_FILTERS),
    "trimestre": col("trimestre", "int", "Trimestre.", NUMERIC_FILTERS),
    "semestre": col("semestre", "int", "Semestre.", NUMERIC_FILTERS),
    **COMMON_TIME,
    **COMMON_HOSPITAL,
    "codigo_municipio_residencia": col("codigo_municipio_residencia", "string", "Municipio de residencia.", TEXT_FILTERS),
    "codigo_municipio_internacao": col("codigo_municipio_internacao", "string", "Municipio de internacao.", TEXT_FILTERS),
    "sexo": col("sexo", "string", "Sexo do paciente.", TEXT_FILTERS, ("mulheres", "homens", "feminino", "masculino")),
    "faixa_etaria": col("faixa_etaria", "string", "Faixa etaria do paciente.", TEXT_FILTERS),
    "raca_cor": col("raca_cor", "string", "Raca/cor.", TEXT_FILTERS),
    "escolaridade": col("escolaridade", "string", "Escolaridade.", TEXT_FILTERS),
    "tipo_identificacao": col("tipo_identificacao", "string", "Tipo de AIH.", TEXT_FILTERS),
    "especialidade": col("especialidade", "string", "Especialidade.", TEXT_FILTERS),
    "carater_internacao": col("carater_internacao", "string", "Carater da internacao.", TEXT_FILTERS),
    "complexidade": col("complexidade", "string", "Complexidade.", TEXT_FILTERS),
    "tipo_gestao": col("tipo_gestao", "string", "Tipo de gestao.", TEXT_FILTERS),
    **COMMON_CID,
    "obito": col("obito", "bool", "Indicador de obito."),
    "internacao_longa_permanencia": col("internacao_longa_permanencia", "bool", "Indicador de longa permanencia."),
}

FATO_INTERNACAO_METRICS = {
    "quantidade_internacoes": metric("quantidade_internacoes", "count", "Contagem de internacoes.", source_column=None),
    "quantidade_obitos": metric("quantidade_obitos", "sum", "Contagem de obitos.", source_column="obito"),
    "valor_total_internacao": metric("valor_total_internacao", "sum", "Valor total de internacao."),
    "custo_medio_internacao": metric("custo_medio_internacao", "avg", "Custo medio por internacao.", source_column="valor_total_internacao"),
    "valor_uti": metric("valor_uti", "sum", "Valor de UTI."),
    "dias_permanencia": metric("dias_permanencia", "avg", "Media de dias de permanencia."),
    "quantidade_diarias": metric("quantidade_diarias", "sum", "Total de diarias."),
}

FATO_PROCEDIMENTO_DIMS = {
    "id_procedimento": col("id_procedimento", "int", "Identificador do procedimento.", NUMERIC_FILTERS),
    "numero_aih": col("numero_aih", "string", "Numero da AIH.", TEXT_FILTERS),
    "data_referencia": col("data_referencia", "date", "Data de referencia.", DATE_FILTERS),
    "trimestre": col("trimestre", "int", "Trimestre.", NUMERIC_FILTERS),
    "semestre": col("semestre", "int", "Semestre.", NUMERIC_FILTERS),
    **COMMON_TIME,
    **COMMON_HOSPITAL,
    "codigo_procedimento": col("codigo_procedimento", "string", "Codigo do procedimento.", TEXT_FILTERS, ("procedimento", "procedimentos")),
    "procedimento_cirurgico": col("procedimento_cirurgico", "bool", "Indicador cirurgico."),
    "procedimento_alto_custo": col("procedimento_alto_custo", "bool", "Indicador de alto custo.", synonyms=("alto custo",)),
    "codigo_cbo": col("codigo_cbo", "string", "Codigo CBO.", TEXT_FILTERS),
    "descricao_profissional": col("descricao_profissional", "string", "Descricao profissional.", TEXT_FILTERS),
    "categoria_profissional": col("categoria_profissional", "string", "Categoria profissional.", TEXT_FILTERS),
    **COMMON_CID,
    "tipo_financiamento": col("tipo_financiamento", "string", "Tipo de financiamento.", TEXT_FILTERS),
    "possui_faec": col("possui_faec", "bool", "Indicador FAEC."),
    "complexidade": col("complexidade", "string", "Complexidade.", TEXT_FILTERS),
}

FATO_PROCEDIMENTO_METRICS = {
    "quantidade_registros": metric("quantidade_registros", "count", "Contagem de registros.", source_column=None),
    "quantidade_atos": metric("quantidade_atos", "sum", "Total de atos."),
    "quantidade_procedimentos": metric("quantidade_procedimentos", "sum", "Total de procedimentos."),
    "valor_procedimento": metric("valor_procedimento", "sum", "Valor total de procedimentos."),
    "valor_medio_procedimento": metric("valor_medio_procedimento", "avg", "Valor medio do procedimento.", source_column="valor_procedimento"),
    "pontos_sus": metric("pontos_sus", "sum", "Total de pontos SUS."),
}

SEMANTIC_CATALOG: dict[str, TableDef] = {
    "ouro.agg_hospital_mensal": TableDef(
        name="ouro.agg_hospital_mensal",
        table_type="agg",
        description="Agregacao mensal de internacoes por hospital.",
        dimensions={**COMMON_TIME, **COMMON_HOSPITAL},
        metrics=COMMON_INTERNACAO_METRICS,
        filters={"ano", "mes", "cnes", "id_hospital"},
        synonyms=("hospital", "hospitais", "cnes"),
        examples=("Quais hospitais tiveram mais internacoes?",),
    ),
    "ouro.agg_cid_mensal": TableDef(
        name="ouro.agg_cid_mensal",
        table_type="agg",
        description="Agregacao mensal de internacoes por CID.",
        dimensions={**COMMON_TIME, **COMMON_CID},
        metrics=COMMON_INTERNACAO_METRICS,
        filters={"ano", "mes", "codigo_cid", "grupo_cid"},
        synonyms=("cid", "diagnostico", "doenca"),
    ),
    "ouro.agg_internacoes_mensais": TableDef(
        name="ouro.agg_internacoes_mensais",
        table_type="agg",
        description="Agregacao mensal ampla de internacoes por hospital, especialidade, complexidade e CID.",
        dimensions={
            **COMMON_TIME,
            **COMMON_HOSPITAL,
            "especialidade": FATO_INTERNACAO_DIMS["especialidade"],
            "complexidade": FATO_INTERNACAO_DIMS["complexidade"],
            "grupo_cid": COMMON_CID["grupo_cid"],
            "capitulo_cid": COMMON_CID["capitulo_cid"],
        },
        metrics=COMMON_INTERNACAO_METRICS,
        filters={"ano", "mes", "cnes", "id_hospital", "grupo_cid", "complexidade"},
        synonyms=("internacoes", "especialidade", "complexidade"),
    ),
    "ouro.agg_procedimentos_mensais": TableDef(
        name="ouro.agg_procedimentos_mensais",
        table_type="agg",
        description="Agregacao mensal de procedimentos por hospital, procedimento, profissional e financiamento.",
        dimensions={
            **COMMON_TIME,
            **COMMON_HOSPITAL,
            "codigo_procedimento": FATO_PROCEDIMENTO_DIMS["codigo_procedimento"],
            "procedimento_cirurgico": FATO_PROCEDIMENTO_DIMS["procedimento_cirurgico"],
            "procedimento_alto_custo": FATO_PROCEDIMENTO_DIMS["procedimento_alto_custo"],
            "categoria_profissional": FATO_PROCEDIMENTO_DIMS["categoria_profissional"],
            "complexidade": FATO_PROCEDIMENTO_DIMS["complexidade"],
            "tipo_financiamento": FATO_PROCEDIMENTO_DIMS["tipo_financiamento"],
            "possui_faec": FATO_PROCEDIMENTO_DIMS["possui_faec"],
        },
        metrics={
            "quantidade_registros": metric("quantidade_registros", "sum", "Total de registros."),
            "total_atos": metric("total_atos", "sum", "Total de atos realizados."),
            "total_procedimentos": metric("total_procedimentos", "sum", "Total de procedimentos."),
            "valor_total_procedimentos": metric("valor_total_procedimentos", "sum", "Valor total dos procedimentos."),
            "valor_medio_procedimento": metric("valor_medio_procedimento", "avg", "Valor medio dos procedimentos."),
            "total_pontos_sus": metric("total_pontos_sus", "sum", "Total de pontos SUS."),
            "quantidade_procedimentos_cirurgicos": metric("quantidade_procedimentos_cirurgicos", "sum", "Total cirurgico."),
            "quantidade_procedimentos_alto_custo": metric("quantidade_procedimentos_alto_custo", "sum", "Total alto custo."),
        },
        filters={"ano", "mes", "cnes", "id_hospital", "codigo_procedimento", "procedimento_alto_custo", "complexidade"},
        synonyms=("procedimentos", "sigtap", "apac", "alto custo"),
    ),
    "ouro.fato_internacoes": TableDef(
        name="ouro.fato_internacoes",
        table_type="fato",
        description="Fato detalhado de internacoes.",
        dimensions=FATO_INTERNACAO_DIMS,
        metrics=FATO_INTERNACAO_METRICS,
        filters={"ano", "mes", "cnes", "id_hospital", "codigo_cid", "sexo", "faixa_etaria", "complexidade", "obito"},
        synonyms=("internacoes detalhadas", "pacientes", "sexo", "mulheres"),
    ),
    "ouro.fato_procedimentos": TableDef(
        name="ouro.fato_procedimentos",
        table_type="fato",
        description="Fato detalhado de procedimentos.",
        dimensions=FATO_PROCEDIMENTO_DIMS,
        metrics=FATO_PROCEDIMENTO_METRICS,
        filters={"ano", "mes", "cnes", "id_hospital", "codigo_cid", "codigo_procedimento", "complexidade", "procedimento_alto_custo"},
        synonyms=("procedimentos detalhados", "profissional", "cbo"),
    ),
    "ouro.dim_hospital": TableDef(
        name="ouro.dim_hospital",
        table_type="dim",
        description="Dimensao de hospitais e estabelecimentos CNES.",
        dimensions={**COMMON_HOSPITAL, "competencia": col("competencia", "string", "Competencia CNES.", TEXT_FILTERS)},
        metrics={},
        filters={"cnes", "id_hospital", "competencia"},
    ),
    "ouro.dim_cid": TableDef(
        name="ouro.dim_cid",
        table_type="dim",
        description="Dimensao CID.",
        dimensions=COMMON_CID,
        metrics={},
        filters={"codigo_cid", "grupo_cid"},
    ),
    "ouro.dim_procedimento": TableDef(
        name="ouro.dim_procedimento",
        table_type="dim",
        description="Dimensao de procedimentos.",
        dimensions={
            "codigo_procedimento": FATO_PROCEDIMENTO_DIMS["codigo_procedimento"],
            "procedimento_cirurgico": FATO_PROCEDIMENTO_DIMS["procedimento_cirurgico"],
            "procedimento_alto_custo": FATO_PROCEDIMENTO_DIMS["procedimento_alto_custo"],
        },
        metrics={},
        filters={"codigo_procedimento", "procedimento_alto_custo"},
    ),
    "ouro.dim_profissional": TableDef(
        name="ouro.dim_profissional",
        table_type="dim",
        description="Dimensao profissional CBO.",
        dimensions={
            "codigo_cbo": FATO_PROCEDIMENTO_DIMS["codigo_cbo"],
            "descricao_profissional": FATO_PROCEDIMENTO_DIMS["descricao_profissional"],
            "categoria_profissional": FATO_PROCEDIMENTO_DIMS["categoria_profissional"],
        },
        metrics={},
        filters={"codigo_cbo", "categoria_profissional"},
    ),
    "ouro.dim_tempo": TableDef(
        name="ouro.dim_tempo",
        table_type="dim",
        description="Dimensao calendario.",
        dimensions={
            "data": col("data", "date", "Data calendario.", DATE_FILTERS),
            **COMMON_TIME,
            "trimestre": col("trimestre", "int", "Trimestre.", NUMERIC_FILTERS),
            "semestre": col("semestre", "int", "Semestre.", NUMERIC_FILTERS),
            "ano_mes": col("ano_mes", "string", "Ano e mes no formato yyyyMM.", TEXT_FILTERS),
            "mes_ano": col("mes_ano", "string", "Mes e ano.", TEXT_FILTERS),
        },
        metrics={},
        filters={"ano", "mes", "data"},
    ),
    "ouro.dim_internacao_tipo": TableDef(
        name="ouro.dim_internacao_tipo",
        table_type="dim",
        description="Dimensao de classificacoes da internacao.",
        dimensions={
            "tipo_identificacao": FATO_INTERNACAO_DIMS["tipo_identificacao"],
            "especialidade": FATO_INTERNACAO_DIMS["especialidade"],
            "carater_internacao": FATO_INTERNACAO_DIMS["carater_internacao"],
            "complexidade": FATO_INTERNACAO_DIMS["complexidade"],
            "tipo_gestao": FATO_INTERNACAO_DIMS["tipo_gestao"],
        },
        metrics={},
        filters={"tipo_identificacao", "especialidade", "carater_internacao", "complexidade"},
    ),
    "ouro.dim_paciente_perfil": TableDef(
        name="ouro.dim_paciente_perfil",
        table_type="dim",
        description="Dimensao de perfil demografico do paciente.",
        dimensions={
            "id_perfil_paciente": col("id_perfil_paciente", "string", "Chave composta do perfil.", TEXT_FILTERS),
            "sexo": FATO_INTERNACAO_DIMS["sexo"],
            "codigo_tipo_idade": col("codigo_tipo_idade", "string", "Codigo do tipo de idade.", TEXT_FILTERS),
            "idade": col("idade", "int", "Idade.", NUMERIC_FILTERS),
            "faixa_etaria": FATO_INTERNACAO_DIMS["faixa_etaria"],
            "raca_cor": FATO_INTERNACAO_DIMS["raca_cor"],
            "escolaridade": FATO_INTERNACAO_DIMS["escolaridade"],
        },
        metrics={},
        filters={"sexo", "faixa_etaria", "raca_cor", "escolaridade"},
    ),
}


def get_table(table_name: str) -> TableDef | None:
    return SEMANTIC_CATALOG.get(table_name)


def list_available_indicators() -> dict[str, Any]:
    return {
        name: {
            "tipo": table.table_type,
            "descricao": table.description,
            "metricas": list(table.metrics),
            "dimensoes": list(table.dimensions),
            "filtros": sorted(table.filters),
        }
        for name, table in SEMANTIC_CATALOG.items()
    }


def catalog_for_prompt() -> dict[str, Any]:
    return list_available_indicators()
