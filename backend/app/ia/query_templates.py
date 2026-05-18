from typing import Dict

# Dicionário estático de templates SQL seguros e pré-aprovados pela equipe de engenharia.
# Nenhuma concatenação direta ou injeção de parâmetros dinâmicos externos é permitida.
QUERY_TEMPLATES: Dict[str, str] = {
    "top_hospitais_internacoes": (
        "SELECT TOP 10 cnes AS [CNES], municipio_hospital AS [Municipio], "
        "SUM(quantidade_internacoes) AS [Total Internacoes], "
        "SUM(valor_total_internacoes) AS [Custo Total (R$)] "
        "FROM ouro.agg_hospital_mensal "
        "GROUP BY cnes, municipio_hospital "
        "ORDER BY [Total Internacoes] DESC;"
    ),
    "top_cids_internacoes": (
        "SELECT TOP 10 codigo_cid AS [Código CID], grupo_cid AS [Grupo CID], "
        "SUM(quantidade_internacoes) AS [Total Internacoes] "
        "FROM ouro.agg_cid_mensal "
        "GROUP BY codigo_cid, grupo_cid "
        "ORDER BY [Total Internacoes] DESC;"
    ),
    "hospital_maior_custo": (
        "SELECT TOP 10 cnes AS [CNES], municipio_hospital AS [Municipio], "
        "SUM(valor_total_internacoes) AS [Custo Total (R$)], "
        "SUM(valor_total_uti) AS [Custo UTI (R$)] "
        "FROM ouro.agg_hospital_mensal "
        "GROUP BY cnes, municipio_hospital "
        "ORDER BY [Custo Total (R$)] DESC;"
    ),
    "cid_maior_taxa_obito": (
        "SELECT TOP 10 codigo_cid AS [Código CID], grupo_cid AS [Grupo CID], "
        "SUM(quantidade_obitos) AS [Total Óbitos], "
        "CAST(AVG(taxa_obito_percentual) AS DECIMAL(10,2)) AS [Taxa Média Óbito (%)] "
        "FROM ouro.agg_cid_mensal "
        "GROUP BY codigo_cid, grupo_cid "
        "HAVING SUM(quantidade_internacoes) >= 10 "  # Filtra ruídos estatísticos
        "ORDER BY [Taxa Média Óbito (%)] DESC;"
    ),
    "procedimentos_maior_valor": (
        "SELECT TOP 10 codigo_procedimento AS [Código Procedimento], "
        "SUM(total_procedimentos) AS [Total Executado], "
        "SUM(valor_total_procedimentos) AS [Custo Total (R$)] "
        "FROM ouro.agg_procedimentos_mensais "
        "GROUP BY codigo_procedimento "
        "ORDER BY [Custo Total (R$)] DESC;"
    ),
    "procedimentos_alto_custo": (
        "SELECT TOP 10 codigo_procedimento AS [Código Procedimento], "
        "SUM(total_procedimentos) AS [Total Executado], "
        "SUM(valor_total_procedimentos) AS [Custo Total (R$)] "
        "FROM ouro.agg_procedimentos_mensais "
        "WHERE procedimento_alto_custo = 1 "
        "GROUP BY codigo_procedimento "
        "ORDER BY [Total Executado] DESC;"
    )
}

def get_query_for_intent(intent: str) -> str:
    """
    Retorna a string SQL segura cadastrada para a intenção fornecida.
    Caso a intenção não exista, retorna uma query vazia de segurança.
    """
    return QUERY_TEMPLATES.get(intent, "")
