CREATE OR ALTER VIEW ouro.dim_paciente_perfil AS

SELECT DISTINCT
    CONCAT(
        sexo, '|',
        codigo_tipo_idade, '|',
        faixa_etaria, '|',
        raca_cor, '|',
        escolaridade
    ) AS id_perfil_paciente,

    sexo,
    codigo_tipo_idade,
    idade,
    faixa_etaria,
    raca_cor,
    escolaridade

FROM prata.sih_internacoes

WHERE sexo IS NOT NULL;