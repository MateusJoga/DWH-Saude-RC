CREATE OR ALTER VIEW ouro.agg_mortalidade_hospital AS

SELECT
    ano,
    mes,

    id_hospital,
    cnes,
    municipio_hospital,

    COUNT(*) AS total_internacoes,

    SUM(
        CASE
            WHEN obito = 1 THEN 1
            ELSE 0
        END
    ) AS total_obitos,

    CAST(
        100.0 *
        SUM(
            CASE
                WHEN obito = 1 THEN 1
                ELSE 0
            END
        )
        /
        NULLIF(COUNT(*),0)
    AS DECIMAL(10,2))
    AS taxa_mortalidade

FROM ouro.fato_internacoes

GROUP BY
    ano,
    mes,
    id_hospital,
    cnes,
    municipio_hospital;