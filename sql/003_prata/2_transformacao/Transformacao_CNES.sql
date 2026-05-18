INSERT INTO prata.cnes (

    cnes,

    codigo_municipio,
    nome_municipio,
    uf,
    cep,

    tipo_gestao,
    descricao_tipo_gestao,

    esfera_administrativa,

    natureza_juridica,

    tipo_unidade,
    nivel_dependencia,

    qtd_leitos_tipo_1,
    qtd_leitos_tipo_2,
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
    data_referencia_dados,

    registro_ativo,
    data_inicio_vigencia,
    data_fim_vigencia,

    data_ingestao

)

SELECT

    -- Identificador
    CNES AS cnes,

    -- Localização
    CODUFMUN AS codigo_municipio,

    'Rio Claro' AS nome_municipio,

    'SP' AS uf,

    COD_CEP AS cep,

    -- Gestão
    TPGESTAO AS tipo_gestao,

    CASE TPGESTAO
        WHEN 'E' THEN 'Estadual'
        WHEN 'M' THEN 'Municipal'
        ELSE 'Não identificado'
    END AS descricao_tipo_gestao,

    ESFERA_A AS esfera_administrativa,

    -- Natureza Jurídica
    CASE NAT_JUR
        WHEN '1023' THEN 'Órgão Público Estadual'
        WHEN '1155' THEN 'Fundação Pública Municipal'
        WHEN '2046' THEN 'Sociedade Anônima Aberta'
        WHEN '2054' THEN 'Sociedade Anônima Fechada'
        WHEN '2062' THEN 'Sociedade Empresária Limitada'
        WHEN '2135' THEN 'Empresário Individual'
        WHEN '2143' THEN 'Cooperativa'
        WHEN '2232' THEN 'Associação Privada'
        WHEN '2240' THEN 'Fundação Privada'
        WHEN '2305' THEN 'Empresa Individual de Responsabilidade Limitada'
        WHEN '3077' THEN 'Serviço Social Autônomo'
        WHEN '3999' THEN 'Outras Organizações Privadas'
        WHEN '4000' THEN 'Empresa Individual Imobiliária'
        ELSE 'Não identificado'
    END AS natureza_juridica,

    -- Tipo Unidade
    CASE TP_UNID
        WHEN '1' THEN 'Posto de Saúde'
        WHEN '2' THEN 'Centro de Saúde / UBS'
        WHEN '4' THEN 'Policlínica'
        WHEN '5' THEN 'Hospital Geral'
        WHEN '7' THEN 'Hospital Especializado'
        WHEN '15' THEN 'Unidade Mista'
        WHEN '20' THEN 'Pronto Socorro Geral'
        WHEN '21' THEN 'Pronto Socorro Especializado'
        WHEN '22' THEN 'Consultório Isolado'
        WHEN '36' THEN 'Clínica Especializada'
        WHEN '39' THEN 'SADT'
        WHEN '42' THEN 'Unidade Móvel Pré-Hospitalar'
        WHEN '70' THEN 'CAPS'
        WHEN '73' THEN 'Pronto Atendimento'
        ELSE 'Outros'
    END AS tipo_unidade,

    -- Dependência
    CASE NIV_DEP
        WHEN '1' THEN 'Individual'
        WHEN '3' THEN 'Mantida'
        ELSE 'Não identificado'
    END AS nivel_dependencia,

    -- Leitos
    ISNULL(QTLEITP1, 0) AS qtd_leitos_tipo_1,

    ISNULL(QTLEITP2, 0) AS qtd_leitos_tipo_2,

    ISNULL(QTLEITP1, 0)
    +
    ISNULL(QTLEITP2, 0)
    AS total_leitos,

    -- Serviços
    CAST(LEITHOSP AS BIT)
    AS possui_leito_hospitalar,

    CAST(URGEMERG AS BIT)
    AS possui_urgencia_emergencia,

    CAST(ATENDAMB AS BIT)
    AS possui_atendimento_ambulatorial,

    CAST(CENTRCIR AS BIT)
    AS possui_centro_cirurgico,

    CAST(CENTROBS AS BIT)
    AS possui_centro_obstetrico,

    CAST(CENTRNEO AS BIT)
    AS possui_centro_neonatal,

    CAST(ATENDHOS AS BIT)
    AS possui_atendimento_hospitalar,

    -- Flags Analíticas
    CASE
        WHEN TP_UNID IN ('5','7','15','62')
            THEN 1
        ELSE 0
    END AS eh_hospital,

    CASE
        WHEN TP_UNID IN ('1','2','22','36','39','70','73')
            THEN 1
        ELSE 0
    END AS eh_ambulatorio,

    -- Temporalidade
    COMPETEN AS competencia,

    DATEFROMPARTS(
        CAST(LEFT(COMPETEN, 4) AS INT),
        CAST(RIGHT(COMPETEN, 2) AS INT),
        1
    ) AS data_referencia_dados,

    -- Vigência
    1 AS registro_ativo,

    DATEFROMPARTS(
        CAST(LEFT(COMPETEN, 4) AS INT),
        CAST(RIGHT(COMPETEN, 2) AS INT),
        1
    ) AS data_inicio_vigencia,

    NULL AS data_fim_vigencia,

    -- Auditoria
    GETDATE() AS data_ingestao

FROM bronze.cnes;