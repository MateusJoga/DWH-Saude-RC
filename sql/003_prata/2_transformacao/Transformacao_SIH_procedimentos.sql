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
    codigo_faec,
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
    SP_NAIH,
    SP_CNES,
    SP_GESTOR,
    SP_UF,
    SP_AA,
    SP_MM,
    CONCAT(SP_AA, RIGHT('00' + CAST(SP_MM AS VARCHAR), 2)),
    CONVERT(DATE, SP_DTINTER, 112),
    CONVERT(DATE, SP_DTSAIDA, 112),

    CASE SP_U_AIH
        WHEN '0' THEN 'AIH normal'
        WHEN '1' THEN 'AIH complementar'
        ELSE 'Não identificado'
    END,

    SP_PROCREA,
    SP_ATOPROF,
    SP_QTD_ATO,
    SP_QT_PROC,
    ISNULL(SP_VALATO, 0),
    ISNULL(SP_PTSP, 0),

    CASE SP_FINANC
        WHEN '01' THEN 'Atenção Básica'
        WHEN '04' THEN 'FAEC'
        WHEN '06' THEN 'Média e Alta Complexidade'
        WHEN '07' THEN 'Vigilância em Saúde'
        ELSE 'Não identificado'
    END,

    NULLIF(SP_CO_FAEC, ''),

    CASE
        WHEN NULLIF(SP_CO_FAEC, '') IS NOT NULL THEN 1
        ELSE 0
    END,

    SP_PF_CBO,
    NULLIF(SP_CIDPRI, '0000'),

    CASE SP_COMPLEX
        WHEN '02' THEN 'Média Complexidade'
        WHEN '03' THEN 'Alta Complexidade'
        ELSE 'Não identificado'
    END,

    CASE
        WHEN LEFT(SP_PROCREA, 2) = '04' THEN 1
        ELSE 0
    END,

    CASE
        WHEN SP_COMPLEX = '03'
          OR NULLIF(SP_CO_FAEC, '') IS NOT NULL THEN 1
        ELSE 0
    END,

    DATEFROMPARTS(SP_AA, SP_MM, 1),
    GETDATE()

FROM bronze.sih_sp b
WHERE NOT EXISTS (
    SELECT 1
    FROM prata.sih_procedimentos p
    WHERE
        p.numero_aih = b.SP_NAIH
        AND p.codigo_procedimento = b.SP_PROCREA
        AND p.codigo_ato_profissional = b.SP_ATOPROF
);