CREATE VIEW ouro.dim_hospital AS

SELECT
    id_cnes AS id_hospital,

    cnes,

    codigo_municipio,
    nome_municipio,
    uf,
    cep,

    tipo_gestao,
    descricao_tipo_gestao,

    tipo_unidade,

    natureza_juridica,

    total_leitos,

    possui_leito_hospitalar,
    possui_urgencia_emergencia,
    possui_atendimento_ambulatorial,
    possui_centro_cirurgico,
    possui_centro_obstetrico,
    possui_centro_neonatal,
    possui_atendimento_hospitalar,

    eh_hospital,
    eh_ambulatorio,

    competencia,
    data_referencia_dados

FROM prata.cnes;