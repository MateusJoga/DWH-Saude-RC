CREATE VIEW ouro.fato_procedimentos AS

SELECT

    -- Identificação
    p.id_procedimento,
    p.numero_aih,

    -- Tempo
    t.data AS data_referencia,
    t.ano,
    t.mes,
    t.nome_mes,
    t.trimestre,
    t.semestre,

    -- Hospital
    h.id_hospital,
    h.cnes,
    h.nome_municipio AS municipio_hospital,
    h.uf AS uf_hospital,

    -- Procedimento
    dp.codigo_procedimento,
    dp.procedimento_cirurgico,
    dp.procedimento_alto_custo,

    -- Profissional
    prof.codigo_cbo,
    prof.descricao_profissional,
    prof.categoria_profissional,

    -- CID
    cid.codigo_cid,
    cid.grupo_cid,
    cid.capitulo_cid,

    -- Financeiro
    p.valor_procedimento,
    p.pontos_sus,

    p.tipo_financiamento,

    p.codigo_faec,
    p.possui_faec,

    -- Quantidades
    p.quantidade_atos,
    p.quantidade_procedimentos,

    -- Complexidade
    p.complexidade,

    -- Métrica base
    1 AS quantidade_registros

FROM prata.sih_procedimentos p

-- Tempo
LEFT JOIN ouro.dim_tempo t
    ON p.data_referencia = t.data

-- Hospital
LEFT JOIN ouro.dim_hospital h
    ON p.cnes = h.cnes
    AND p.competencia = h.competencia

-- Procedimento
LEFT JOIN ouro.dim_procedimento dp
    ON p.codigo_procedimento = dp.codigo_procedimento

-- Profissional
LEFT JOIN ouro.dim_profissional prof
    ON p.cbo_profissional = prof.codigo_cbo

-- CID
LEFT JOIN ouro.dim_cid cid
    ON p.cid_principal = cid.codigo_cid;