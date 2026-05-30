CREATE OR ALTER VIEW ouro.dim_tempo AS

SELECT DISTINCT
    data_base AS data,

    YEAR(data_base) AS ano,

    MONTH(data_base) AS mes,

    CASE MONTH(data_base)
        WHEN 1 THEN 'Janeiro'
        WHEN 2 THEN 'Fevereiro'
        WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Maio'
        WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro'
        WHEN 11 THEN 'Novembro'
        WHEN 12 THEN 'Dezembro'
    END AS nome_mes,

    DATEPART(QUARTER, data_base) AS trimestre,

    CASE
        WHEN MONTH(data_base) <= 6 THEN 1
        ELSE 2
    END AS semestre,

    FORMAT(data_base, 'yyyyMM') AS ano_mes,

    FORMAT(data_base, 'MM/yyyy') AS mes_ano

FROM (

    SELECT data_referencia AS data_base
    FROM prata.sih_internacoes

    UNION

    SELECT data_internacao
    FROM prata.sih_internacoes

    UNION

    SELECT data_saida
    FROM prata.sih_internacoes

    UNION

    SELECT data_referencia
    FROM prata.sih_procedimentos

    UNION

    SELECT data_internacao
    FROM prata.sih_procedimentos

    UNION

    SELECT data_saida
    FROM prata.sih_procedimentos

    UNION

    SELECT data_referencia_dados
    FROM prata.cnes

) datas

WHERE data_base IS NOT NULL;