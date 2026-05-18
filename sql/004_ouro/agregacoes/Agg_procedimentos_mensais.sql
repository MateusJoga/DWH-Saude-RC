CREATE VIEW ouro.agg_procedimentos_mensais AS

SELECT
    -- Tempo
    ano,
    mes,
    nome_mes,

    -- Hospital
    id_hospital,
    cnes,
    municipio_hospital,
    uf_hospital,

    -- Procedimento
    codigo_procedimento,
    procedimento_cirurgico,
    procedimento_alto_custo,

    -- Profissional
    categoria_profissional,

    -- Complexidade / financiamento
    complexidade,
    tipo_financiamento,
    possui_faec,

    -- Métricas
    COUNT(*) AS quantidade_registros,

    SUM(quantidade_atos) AS total_atos,

    SUM(quantidade_procedimentos) AS total_procedimentos,

    SUM(valor_procedimento) AS valor_total_procedimentos,

    AVG(CAST(valor_procedimento AS DECIMAL(14,2))) AS valor_medio_procedimento,

    SUM(pontos_sus) AS total_pontos_sus,

    SUM(CASE
            WHEN procedimento_cirurgico = 1 THEN 1
            ELSE 0
        END) AS quantidade_procedimentos_cirurgicos,

    SUM(CASE
            WHEN procedimento_alto_custo = 1 THEN 1
            ELSE 0
        END) AS quantidade_procedimentos_alto_custo

FROM ouro.fato_procedimentos

GROUP BY
    ano,
    mes,
    nome_mes,

    id_hospital,
    cnes,
    municipio_hospital,
    uf_hospital,

    codigo_procedimento,
    procedimento_cirurgico,
    procedimento_alto_custo,

    categoria_profissional,

    complexidade,
    tipo_financiamento,
    possui_faec;