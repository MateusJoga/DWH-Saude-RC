CREATE VIEW ouro.dim_internacao_tipo AS

SELECT DISTINCT

    tipo_identificacao,

    CASE tipo_identificacao
        WHEN 'AIH Normal'
            THEN 'Internação comum'

        WHEN 'AIH Longa Permanência'
            THEN 'Internação prolongada'

        ELSE 'Não identificado'
    END AS descricao_tipo_identificacao,

    especialidade,

    CASE especialidade

        WHEN 'Cirúrgica'
            THEN 'Procedimentos cirúrgicos'

        WHEN 'Obstétrica'
            THEN 'Parto e gestação'

        WHEN 'Clínica Médica'
            THEN 'Tratamento clínico'

        WHEN 'Psiquiátrica'
            THEN 'Saúde mental'

        WHEN 'Pediátrica'
            THEN 'Atendimento infantil'

        ELSE 'Outras especialidades'

    END AS descricao_especialidade,

    carater_internacao,

    CASE carater_internacao

        WHEN 'Eletiva'
            THEN 'Internação planejada'

        WHEN 'Urgência'
            THEN 'Atendimento emergencial'

        WHEN 'Acidente de Trabalho'
            THEN 'Acidente ocupacional'

        ELSE 'Não identificado'

    END AS descricao_carater_internacao,

    complexidade,

    CASE complexidade

        WHEN 'Média Complexidade'
            THEN 'Procedimentos intermediários'

        WHEN 'Alta Complexidade'
            THEN 'Procedimentos especializados'

        ELSE 'Não identificado'

    END AS descricao_complexidade,

    tipo_gestao,

    CASE tipo_gestao

        WHEN 'Gestão Estadual'
            THEN 'Administração estadual'

        WHEN 'Gestão Municipal'
            THEN 'Administração municipal'

        ELSE 'Não identificado'

    END AS descricao_tipo_gestao

FROM prata.sih_internacoes;