CREATE TABLE bronze.sih_sp (

    -- Gestão
    SP_GESTOR VARCHAR(20),
    SP_UF VARCHAR(5),
    SP_CNES VARCHAR(10),

    -- Competência
    SP_AA SMALLINT,
    SP_MM TINYINT,

    -- AIH
    SP_NAIH VARCHAR(20),
    SP_U_AIH VARCHAR(10),

    -- Datas
    SP_DTINTER VARCHAR(8),
    SP_DTSAIDA VARCHAR(8),

    -- Procedimentos
    SP_PROCREA VARCHAR(20),
    SP_ATOPROF VARCHAR(20),
    SP_TP_ATO VARCHAR(10),
    SP_QTD_ATO INT,
    SP_QT_PROC INT,

    -- Financeiro
    SP_VALATO DECIMAL(14,2),
    SP_PTSP DECIMAL(14,2),
    SP_FINANC VARCHAR(10),
    SP_CO_FAEC VARCHAR(10),

    -- Profissional
    SP_PF_CBO VARCHAR(20),

    -- Diagnósticos
    SP_CIDPRI VARCHAR(10),
    SP_CIDSEC VARCHAR(10),

    -- Complexidade
    SP_COMPLEX VARCHAR(10),

    -- Controle
    data_ingestao DATETIME DEFAULT GETDATE()

);