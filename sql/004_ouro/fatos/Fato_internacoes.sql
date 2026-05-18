CREATE VIEW ouro.fato_internacoes AS

SELECT

    -- Identificação
    i.id_internacao,
    i.numero_aih,

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

    -- Municípios
    mr.nome_municipio AS municipio_residencia,
    mi.nome_municipio AS municipio_internacao,

    -- Perfil paciente
    p.sexo,
    p.faixa_etaria,
    p.raca_cor,
    p.escolaridade,

    -- Tipo internação
    ti.tipo_identificacao,
    ti.especialidade,
    ti.carater_internacao,
    ti.complexidade,
    ti.tipo_gestao,

    -- CID
    c.codigo_cid,
    c.grupo_cid,
    c.capitulo_cid,

    -- Métricas financeiras
    i.valor_servicos_hospitalares,
    i.valor_servicos_profissionais,
    i.valor_total_internacao,
    i.valor_uti,

    -- Permanência
    i.dias_permanencia,
    i.quantidade_diarias,

    -- Indicadores
    i.obito,
    i.internacao_longa_permanencia,

    -- Métrica base
    1 AS quantidade_internacoes

FROM prata.sih_internacoes i

-- Tempo
LEFT JOIN ouro.dim_tempo t
    ON i.data_referencia = t.data

-- Hospital
LEFT JOIN ouro.dim_hospital h
    ON i.cnes = h.cnes
    AND i.competencia = h.competencia

-- Município residência
LEFT JOIN ouro.dim_municipio mr
    ON i.codigo_municipio_residencia = mr.codigo_municipio

-- Município internação
LEFT JOIN ouro.dim_municipio mi
    ON i.codigo_municipio_internacao = mi.codigo_municipio

-- Perfil paciente
LEFT JOIN ouro.dim_paciente_perfil p
    ON i.sexo = p.sexo
    AND i.codigo_tipo_idade = p.codigo_tipo_idade
    AND i.faixa_etaria = p.faixa_etaria
    AND i.raca_cor = p.raca_cor
    AND i.escolaridade = p.escolaridade

-- Tipo internação
LEFT JOIN ouro.dim_internacao_tipo ti
    ON i.tipo_identificacao = ti.tipo_identificacao
    AND i.especialidade = ti.especialidade
    AND i.carater_internacao = ti.carater_internacao
    AND i.complexidade = ti.complexidade
    AND i.tipo_gestao = ti.tipo_gestao

-- CID
LEFT JOIN ouro.dim_cid c
    ON i.cid_principal = c.codigo_cid;