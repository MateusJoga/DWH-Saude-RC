CREATE TABLE prata.sih_internacoes (

    -- Chave DW
    id_internacao INT IDENTITY(1,1) PRIMARY KEY,

    -- Identificador negócio
    numero_aih VARCHAR(20) UNIQUE NOT NULL,

    -- Localização
    codigo_uf_zona CHAR(6),
    codigo_municipio_residencia CHAR(6),
    codigo_municipio_internacao CHAR(6),

    cep_paciente CHAR(8),

    -- Competência
    ano_competencia SMALLINT NOT NULL,
    mes_competencia TINYINT NOT NULL,

    competencia CHAR(6),

    -- Datas
    data_internacao DATE,
    data_saida DATE,

    -- Hospital
    cnes CHAR(7),

    -- Internação
    tipo_identificacao VARCHAR(10),
    especialidade VARCHAR(10),
    carater_internacao VARCHAR(10),
    complexidade VARCHAR(10),

    -- Demografia
    sexo CHAR(1),

    codigo_tipo_idade VARCHAR(5),
    idade SMALLINT,

    faixa_etaria VARCHAR(30),

    raca_cor VARCHAR(5),

    escolaridade VARCHAR(10),

    quantidade_filhos SMALLINT,

    -- Diagnósticos
    cid_principal VARCHAR(10),
    cid_secundario VARCHAR(10),
    cid_associado VARCHAR(10),
    cid_obito VARCHAR(10),

    -- Financeiro
    valor_servicos_hospitalares DECIMAL(14,2),
    valor_servicos_profissionais DECIMAL(14,2),
    valor_total_internacao DECIMAL(14,2),
    valor_uti DECIMAL(14,2),

    -- Permanência
    dias_permanencia SMALLINT,
    quantidade_diarias SMALLINT,

    internacao_longa_permanencia BIT,

    -- Desfecho
    obito BIT,

    -- Gestão
    tipo_gestao VARCHAR(10),
    codigo_gestor VARCHAR(20),

    -- Temporalidade DW
    data_referencia DATE,

    -- Auditoria
    data_ingestao DATETIME2 DEFAULT GETDATE()

);