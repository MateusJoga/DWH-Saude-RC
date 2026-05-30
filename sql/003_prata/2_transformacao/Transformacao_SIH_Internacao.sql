INSERT INTO prata.sih_internacoes (
    numero_aih,
    codigo_uf_zona,
    codigo_municipio_residencia,
    codigo_municipio_internacao,
    cep_paciente,
    ano_competencia,
    mes_competencia,
    competencia,
    data_internacao,
    data_saida,
    cnes,
    tipo_identificacao,
    especialidade,
    carater_internacao,
    complexidade,
    sexo,
    codigo_tipo_idade,
    idade,
    faixa_etaria,
    raca_cor,
    escolaridade,
    quantidade_filhos,
    cid_principal,
    valor_servicos_hospitalares,
    valor_servicos_profissionais,
    valor_total_internacao,
    valor_uti,
    dias_permanencia,
    quantidade_diarias,
    internacao_longa_permanencia,
    obito,
    tipo_gestao,
    codigo_gestor,
    data_referencia,
    data_ingestao
)
SELECT
    N_AIH AS numero_aih,
    UF_ZI AS codigo_uf_zona,
    MUNIC_RES AS codigo_municipio_residencia,
    MUNIC_MOV AS codigo_municipio_internacao,
    CEP AS cep_paciente,

    ANO_CMPT AS ano_competencia,
    MES_CMPT AS mes_competencia,

    CONCAT(
        ANO_CMPT,
        RIGHT('00' + CAST(MES_CMPT AS VARCHAR), 2)
    ) AS competencia,

    CONVERT(DATE, DT_INTER, 112) AS data_internacao,
    CONVERT(DATE, DT_SAIDA, 112) AS data_saida,

    CNES AS cnes,

    CASE IDENT
        WHEN '1' THEN 'AIH Normal'
        WHEN '5' THEN 'AIH Longa Permanência'
        ELSE 'Não identificado'
    END AS tipo_identificacao,

    CASE ESPEC
        WHEN '01' THEN 'Cirúrgica'
        WHEN '02' THEN 'Obstétrica'
        WHEN '03' THEN 'Clínica Médica'
        WHEN '05' THEN 'Psiquiátrica'
        WHEN '07' THEN 'Pediátrica'
        ELSE 'Não identificada'
    END AS especialidade,

    CASE CAR_INT
        WHEN '01' THEN 'Eletiva'
        WHEN '02' THEN 'Urgência'
        WHEN '06' THEN 'Acidente de Trabalho'
        ELSE 'Não identificado'
    END AS carater_internacao,

    CASE COMPLEX
        WHEN '02' THEN 'Média Complexidade'
        WHEN '03' THEN 'Alta Complexidade'
        ELSE 'Não identificado'
    END AS complexidade,

    CASE SEXO
        WHEN '1' THEN 'Masculino'
        WHEN '3' THEN 'Feminino'
        ELSE 'Não identificado'
    END AS sexo,

    COD_IDADE AS codigo_tipo_idade,
    IDADE AS idade,

    CASE
        WHEN
            CASE
                WHEN COD_IDADE = '4' THEN CAST(IDADE AS DECIMAL(10,2))
                WHEN COD_IDADE = '3' THEN CAST(IDADE / 12.0 AS DECIMAL(10,2))
                WHEN COD_IDADE = '2' THEN CAST(IDADE / 365.0 AS DECIMAL(10,2))
                ELSE NULL
            END < 1 THEN 'Bebê'
        WHEN
            CASE
                WHEN COD_IDADE = '4' THEN CAST(IDADE AS DECIMAL(10,2))
                WHEN COD_IDADE = '3' THEN CAST(IDADE / 12.0 AS DECIMAL(10,2))
                WHEN COD_IDADE = '2' THEN CAST(IDADE / 365.0 AS DECIMAL(10,2))
                ELSE NULL
            END < 12 THEN 'Criança'
        WHEN
            CASE
                WHEN COD_IDADE = '4' THEN CAST(IDADE AS DECIMAL(10,2))
                WHEN COD_IDADE = '3' THEN CAST(IDADE / 12.0 AS DECIMAL(10,2))
                WHEN COD_IDADE = '2' THEN CAST(IDADE / 365.0 AS DECIMAL(10,2))
                ELSE NULL
            END < 18 THEN 'Adolescente'
        WHEN
            CASE
                WHEN COD_IDADE = '4' THEN CAST(IDADE AS DECIMAL(10,2))
                WHEN COD_IDADE = '3' THEN CAST(IDADE / 12.0 AS DECIMAL(10,2))
                WHEN COD_IDADE = '2' THEN CAST(IDADE / 365.0 AS DECIMAL(10,2))
                ELSE NULL
            END < 60 THEN 'Adulto'
        ELSE 'Idoso'
    END AS faixa_etaria,

    CASE RACA_COR
        WHEN '01' THEN 'Branca'
        WHEN '02' THEN 'Preta'
        WHEN '03' THEN 'Parda'
        WHEN '04' THEN 'Amarela'
        ELSE 'Não identificado'
    END AS raca_cor,

    CASE INSTRU
        WHEN '0' THEN 'Não informado'
        WHEN '2' THEN 'Ensino Fundamental'
        WHEN '3' THEN 'Ensino Médio'
        WHEN '4' THEN 'Ensino Superior'
        ELSE 'Não identificado'
    END AS escolaridade,

    ISNULL(NUM_FILHOS, 0) AS quantidade_filhos,

    NULLIF(DIAG_PRINC, '0000') AS cid_principal,

    ISNULL(VAL_SH, 0) AS valor_servicos_hospitalares,
    ISNULL(VAL_SP, 0) AS valor_servicos_profissionais,
    ISNULL(VAL_TOT, 0) AS valor_total_internacao,
    ISNULL(VAL_UTI, 0) AS valor_uti,

    DIAS_PERM AS dias_permanencia,
    QT_DIARIAS AS quantidade_diarias,

    CASE
        WHEN IDENT = '5' THEN 1
        ELSE 0
    END AS internacao_longa_permanencia,

    CAST(MORTE AS BIT) AS obito,

    CASE GESTAO
        WHEN '1' THEN 'Gestão Estadual'
        WHEN '2' THEN 'Gestão Municipal'
        ELSE 'Não identificado'
    END AS tipo_gestao,

    GESTOR_COD AS codigo_gestor,

    DATEFROMPARTS(ANO_CMPT, MES_CMPT, 1) AS data_referencia,

    GETDATE() AS data_ingestao

FROM bronze.sih_rd b
WHERE NOT EXISTS (
    SELECT 1
    FROM prata.sih_internacoes p
    WHERE p.numero_aih = b.N_AIH
      AND p.competencia = CONCAT(
            b.ANO_CMPT,
            RIGHT('00' + CAST(b.MES_CMPT AS VARCHAR), 2)
      )
      AND p.data_internacao = CONVERT(DATE, b.DT_INTER, 112)
      AND p.data_saida = CONVERT(DATE, b.DT_SAIDA, 112)
      AND p.tipo_identificacao =
          CASE b.IDENT
              WHEN '1' THEN 'AIH Normal'
              WHEN '5' THEN 'AIH Longa Permanência'
              ELSE 'Não identificado'
          END
);