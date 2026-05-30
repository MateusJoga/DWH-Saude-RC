CREATE OR ALTER VIEW ouro.fato_procedimentos AS

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
),

dim_profissional_unica AS (
    SELECT
        codigo_cbo,
        MAX(descricao_profissional) AS descricao_profissional,
        MAX(categoria_profissional) AS categoria_profissional
    FROM ouro.dim_profissional
    GROUP BY codigo_cbo
)

SELECT
    p.id_procedimento,
    p.numero_aih,

    p.data_referencia,
    YEAR(p.data_referencia) AS ano,
    MONTH(p.data_referencia) AS mes,
    DATENAME(MONTH, p.data_referencia) AS nome_mes,
    DATEPART(QUARTER, p.data_referencia) AS trimestre,
    CASE WHEN MONTH(p.data_referencia) <= 6 THEN 1 ELSE 2 END AS semestre,

    h.id_hospital,
    p.cnes,
    h.nome_municipio AS municipio_hospital,
    h.uf AS uf_hospital,

    p.codigo_procedimento,
    p.procedimento_cirurgico,
    p.procedimento_alto_custo,

    p.cbo_profissional AS codigo_cbo,
    prof.descricao_profissional,
    prof.categoria_profissional,

    p.cid_principal AS codigo_cid,
    cid.grupo_cid,
    cid.capitulo_cid,

    p.valor_procedimento,
    p.pontos_sus,
    p.tipo_financiamento,
    p.possui_faec,

    p.quantidade_atos,
    p.quantidade_procedimentos,

    p.complexidade,

    1 AS quantidade_registros

FROM prata.sih_procedimentos p

LEFT JOIN dim_hospital_unica h
    ON p.cnes = h.cnes
   AND p.competencia = h.competencia

LEFT JOIN dim_profissional_unica prof
    ON p.cbo_profissional = prof.codigo_cbo

LEFT JOIN dim_cid_unica cid
    ON p.cid_principal = cid.codigo_cid;