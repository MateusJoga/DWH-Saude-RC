CREATE TABLE prata.sih_procedimentos (

    -- Chave DW
    id_procedimento INT IDENTITY(1,1) PRIMARY KEY,

    -- Relacionamento AIH
    numero_aih VARCHAR(20) NOT NULL,

    -- Hospital
    cnes CHAR(7),

    -- Gestão
    codigo_gestor VARCHAR(20),
    uf CHAR(2),

    -- Competência
    ano_competencia SMALLINT,
    mes_competencia TINYINT,

    competencia CHAR(6),

    -- Datas
    data_internacao DATE,
    data_saida DATE,

    -- Tipo AIH
    tipo_aih VARCHAR(50),

    -- Procedimentos
    codigo_procedimento VARCHAR(20),
    codigo_ato_profissional VARCHAR(20),

    quantidade_atos SMALLINT,
    quantidade_procedimentos SMALLINT,

    -- Financeiro
    valor_procedimento DECIMAL(14,2),

    pontos_sus DECIMAL(14,2),

    tipo_financiamento VARCHAR(80),

    codigo_faec VARCHAR(10),

    possui_faec BIT,

    -- Profissional
    cbo_profissional VARCHAR(20),

    -- Diagnósticos
    cid_principal VARCHAR(10),

    -- Complexidade
    complexidade VARCHAR(50),

    -- Flags analíticas
    procedimento_cirurgico BIT,
    procedimento_alto_custo BIT,

    -- Temporalidade DW
    data_referencia DATE,

    -- Auditoria
    data_ingestao DATETIME2 DEFAULT GETDATE()

);