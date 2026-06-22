CREATE OR ALTER VIEW ouro.dim_municipio AS

SELECT DISTINCT
    codigo_municipio,
    nome_municipio,
    uf
FROM (

    -- Município do CNES
    SELECT
        codigo_municipio,
        nome_municipio,
        uf
    FROM prata.cnes

    UNION

    -- Município de residência do paciente
    SELECT
        codigo_municipio_residencia AS codigo_municipio,
        CASE codigo_municipio_residencia
            WHEN '354390' THEN 'Rio Claro'
            WHEN '355030' THEN 'São Paulo'
            WHEN '350330' THEN 'Araras'
            WHEN '353870' THEN 'Piracicaba'
            WHEN '354400' THEN 'Rio das Pedras'
            ELSE 'Outro município'
        END AS nome_municipio,
        'SP' AS uf
    FROM prata.sih_internacoes

    UNION

    -- Município onde ocorreu a internação
    SELECT
        codigo_municipio_internacao AS codigo_municipio,
        CASE codigo_municipio_internacao
            WHEN '354390' THEN 'Rio Claro'
            ELSE 'Outro município'
        END AS nome_municipio,
        'SP' AS uf
    FROM prata.sih_internacoes

) municipios

WHERE codigo_municipio IS NOT NULL;