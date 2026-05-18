CREATE TABLE prata.cnes (

    -- Chave DW
    id_cnes INT IDENTITY(1,1) PRIMARY KEY,

    -- Identificador negócio
    cnes CHAR(7) UNIQUE NOT NULL,

    -- Localização
    codigo_municipio CHAR(6) NOT NULL,
    nome_municipio VARCHAR(100),
    uf CHAR(2),
    cep CHAR(8),

    -- Gestão
    tipo_gestao CHAR(1),
    descricao_tipo_gestao VARCHAR(50),

    esfera_administrativa CHAR(1),

    natureza_juridica VARCHAR(150),

    -- Classificação
    tipo_unidade VARCHAR(100),
    nivel_dependencia VARCHAR(50),

    -- Estrutura
    qtd_leitos_tipo_1 SMALLINT DEFAULT 0,
    qtd_leitos_tipo_2 SMALLINT DEFAULT 0,
    total_leitos SMALLINT,

    -- Serviços
    possui_leito_hospitalar BIT DEFAULT 0,
    possui_urgencia_emergencia BIT DEFAULT 0,
    possui_atendimento_ambulatorial BIT DEFAULT 0,
    possui_centro_cirurgico BIT DEFAULT 0,
    possui_centro_obstetrico BIT DEFAULT 0,
    possui_centro_neonatal BIT DEFAULT 0,
    possui_atendimento_hospitalar BIT DEFAULT 0,

    -- Flags analíticas
    eh_hospital BIT,
    eh_ambulatorio BIT,

    -- Temporalidade
    competencia CHAR(6),
    data_referencia_dados DATE,

    -- Vigência
    registro_ativo BIT DEFAULT 1,
    data_inicio_vigencia DATE,
    data_fim_vigencia DATE,

    -- Auditoria
    data_ingestao DATETIME2 DEFAULT GETDATE()

);