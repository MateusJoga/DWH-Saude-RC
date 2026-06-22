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