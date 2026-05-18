CREATE VIEW ouro.agg_cid_mensal AS

SELECT

    -- Tempo
    ano,
    mes,
    nome_mes,

    -- CID
    codigo_cid,
    grupo_cid,
    capitulo_cid,

    -- Métricas
    COUNT(*) AS quantidade_internacoes,

    SUM(valor_total_internacao) AS valor_total_internacoes,

    SUM(valor_uti) AS valor_total_uti,

    AVG(CAST(dias_permanencia AS DECIMAL(10,2)))
        AS media_dias_permanencia,

    SUM(CASE
            WHEN obito = 1 THEN 1
            ELSE 0
        END) AS quantidade_obitos,

    CAST(
        100.0 *
        SUM(CASE
                WHEN obito = 1 THEN 1
                ELSE 0
            END)
        / NULLIF(COUNT(*), 0)
    AS DECIMAL(10,2)) AS taxa_obito_percentual,

    SUM(CASE
            WHEN internacao_longa_permanencia = 1 THEN 1
            ELSE 0
        END) AS quantidade_longa_permanencia

FROM ouro.fato_internacoes

WHERE codigo_cid IS NOT NULL

GROUP BY

    ano,
    mes,
    nome_mes,

    codigo_cid,
    grupo_cid,
    capitulo_cid;