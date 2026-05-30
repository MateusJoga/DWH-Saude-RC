CREATE OR ALTER PROCEDURE prata.sp_atualizar_prata
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- CNES
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

FROM bronze.cnes b
WHERE NOT EXISTS (
    SELECT 1
    FROM prata.cnes p
    WHERE p.cnes = b.CNES
      AND p.competencia = b.COMPETEN
);

        -- Internações
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

        -- Procedimentos
WITH base_deduplicada AS (
    SELECT
        b.*,
        CONCAT(
            b.SP_AA,
            RIGHT('00' + CAST(b.SP_MM AS VARCHAR), 2)
        ) AS competencia_calculada,

        ROW_NUMBER() OVER (
            PARTITION BY
                TRIM(b.SP_NAIH),
                CONCAT(b.SP_AA, RIGHT('00' + CAST(b.SP_MM AS VARCHAR), 2)),
                CONVERT(DATE, b.SP_DTINTER, 112),
                CONVERT(DATE, b.SP_DTSAIDA, 112),
                TRIM(b.SP_PROCREA),
                TRIM(b.SP_ATOPROF),
                TRIM(b.SP_PF_CBO)
            ORDER BY
                b.data_ingestao DESC
        ) AS rn
    FROM bronze.sih_sp b
)

INSERT INTO prata.sih_procedimentos (
    numero_aih,
    cnes,
    codigo_gestor,
    uf,
    ano_competencia,
    mes_competencia,
    competencia,
    data_internacao,
    data_saida,
    tipo_aih,
    codigo_procedimento,
    codigo_ato_profissional,
    quantidade_atos,
    quantidade_procedimentos,
    valor_procedimento,
    pontos_sus,
    tipo_financiamento,
    possui_faec,
    cbo_profissional,
    cid_principal,
    complexidade,
    procedimento_cirurgico,
    procedimento_alto_custo,
    data_referencia,
    data_ingestao
)
SELECT
    TRIM(b.SP_NAIH),
    TRIM(b.SP_CNES),
    TRIM(b.SP_GESTOR),
    b.SP_UF,
    b.SP_AA,
    b.SP_MM,
    b.competencia_calculada,
    CONVERT(DATE, b.SP_DTINTER, 112),
    CONVERT(DATE, b.SP_DTSAIDA, 112),

    CASE b.SP_U_AIH
        WHEN '0' THEN 'AIH normal'
        WHEN '1' THEN 'AIH complementar'
        ELSE 'Não identificado'
    END,

    TRIM(b.SP_PROCREA),
    TRIM(b.SP_ATOPROF),
    b.SP_QTD_ATO,
    b.SP_QT_PROC,
    ISNULL(b.SP_VALATO, 0),
    ISNULL(b.SP_PTSP, 0),

    CASE b.SP_FINANC
        WHEN '01' THEN 'Atenção Básica'
        WHEN '04' THEN 'FAEC'
        WHEN '06' THEN 'Média e Alta Complexidade'
        WHEN '07' THEN 'Vigilância em Saúde'
        ELSE 'Não identificado'
    END,

    CASE
        WHEN NULLIF(TRIM(b.SP_CO_FAEC), '') IS NOT NULL THEN 1
        ELSE 0
    END,

    TRIM(b.SP_PF_CBO),
    NULLIF(TRIM(b.SP_CIDPRI), '0000'),

    CASE b.SP_COMPLEX
        WHEN '02' THEN 'Média Complexidade'
        WHEN '03' THEN 'Alta Complexidade'
        ELSE 'Não identificado'
    END,

    CASE
        WHEN LEFT(b.SP_PROCREA, 2) = '04' THEN 1
        ELSE 0
    END,

    CASE
        WHEN b.SP_COMPLEX = '03'
          OR NULLIF(TRIM(b.SP_CO_FAEC), '') IS NOT NULL THEN 1
        ELSE 0
    END,

    DATEFROMPARTS(b.SP_AA, b.SP_MM, 1),
    GETDATE()

FROM base_deduplicada b
WHERE b.rn = 1
  AND NOT EXISTS (
      SELECT 1
      FROM prata.sih_procedimentos p
      WHERE TRIM(p.numero_aih) = TRIM(b.SP_NAIH)
        AND p.competencia = b.competencia_calculada
        AND p.data_internacao = CONVERT(DATE, b.SP_DTINTER, 112)
        AND p.data_saida = CONVERT(DATE, b.SP_DTSAIDA, 112)
        AND TRIM(p.codigo_procedimento) = TRIM(b.SP_PROCREA)
        AND TRIM(p.codigo_ato_profissional) = TRIM(b.SP_ATOPROF)
        AND TRIM(p.cbo_profissional) = TRIM(b.SP_PF_CBO)
  );


 COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;