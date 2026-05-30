CREATE OR ALTER VIEW ouro.dim_procedimento AS

SELECT DISTINCT
    codigo_procedimento,

    CASE
        WHEN LEFT(codigo_procedimento, 2) = '04'
            THEN 1
        ELSE 0
    END AS procedimento_cirurgico,

    CASE
        WHEN procedimento_alto_custo = 1
            THEN 1
        ELSE 0
    END AS procedimento_alto_custo

FROM prata.sih_procedimentos

WHERE codigo_procedimento IS NOT NULL;