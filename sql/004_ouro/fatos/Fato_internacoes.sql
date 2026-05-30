CREATE OR ALTER VIEW ouro.fato_internacoes AS

WITH dim_hospital_unica AS (
    SELECT *
    FROM (
        SELECT
            h.*,
            ROW_NUMBER() OVER (
                PARTITION BY h.cnes, h.competencia
                ORDER BY h.id_hospital
            ) AS rn
        FROM ouro.dim_hospital h
    ) x
    WHERE rn = 1
),

dim_cid_unica AS (
    SELECT
        codigo_cid,
        MAX(grupo_cid) AS grupo_cid,
        MAX(capitulo_cid) AS capitulo_cid
    FROM ouro.dim_cid
    GROUP BY codigo_cid
)

SELECT
    i.id_internacao,
    i.numero_aih,

    i.data_referencia,
    YEAR(i.data_referencia) AS ano,
    MONTH(i.data_referencia) AS mes,
    DATENAME(MONTH, i.data_referencia) AS nome_mes,
    DATEPART(QUARTER, i.data_referencia) AS trimestre,
    CASE WHEN MONTH(i.data_referencia) <= 6 THEN 1 ELSE 2 END AS semestre,

    h.id_hospital,
    i.cnes,
    h.nome_municipio AS municipio_hospital,
    h.uf AS uf_hospital,

    i.codigo_municipio_residencia,
    i.codigo_municipio_internacao,

    i.sexo,
    i.faixa_etaria,
    i.raca_cor,
    i.escolaridade,

    i.tipo_identificacao,
    i.especialidade,
    i.carater_internacao,
    i.complexidade,
    i.tipo_gestao,

    i.cid_principal AS codigo_cid,
    c.grupo_cid,
    c.capitulo_cid,

    i.valor_servicos_hospitalares,
    i.valor_servicos_profissionais,
    i.valor_total_internacao,
    i.valor_uti,

    i.dias_permanencia,
    i.quantidade_diarias,

    i.obito,
    i.internacao_longa_permanencia,

    1 AS quantidade_internacoes

FROM prata.sih_internacoes i

LEFT JOIN dim_hospital_unica h
    ON i.cnes = h.cnes
   AND i.competencia = h.competencia

LEFT JOIN dim_cid_unica c
    ON i.cid_principal = c.codigo_cid;