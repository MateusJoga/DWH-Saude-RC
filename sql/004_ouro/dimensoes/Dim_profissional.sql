CREATE VIEW ouro.dim_profissional AS

SELECT DISTINCT

    cbo_profissional AS codigo_cbo,

    CASE cbo_profissional

        -- Médicos
        WHEN '225125' THEN 'Médico Clínico'
        WHEN '225250' THEN 'Médico Ginecologista e Obstetra'
        WHEN '225270' THEN 'Médico Ortopedista'
        WHEN '225210' THEN 'Médico Cirurgião Geral'
        WHEN '225235' THEN 'Médico Pediatra'
        WHEN '225103' THEN 'Médico Infectologista'
        WHEN '225285' THEN 'Médico Neurologista'
        WHEN '225151' THEN 'Médico Anestesiologista'
        WHEN '225220' THEN 'Médico Hematologista'
        WHEN '225230' THEN 'Médico Psiquiatra'
        WHEN '225240' THEN 'Médico Radiologista'
        WHEN '225203' THEN 'Médico Cirurgião Vascular'
        WHEN '225109' THEN 'Médico Nefrologista'
        WHEN '225112' THEN 'Médico Neurologista'
        WHEN '225120' THEN 'Médico Cardiologista'
        WHEN '225121' THEN 'Médico Cancerologista'
        WHEN '225124' THEN 'Médico Pediatra'
        WHEN '225133' THEN 'Médico Psiquiatra'
        WHEN '225135' THEN 'Médico Dermatologista'
        WHEN '225150' THEN 'Médico Auditor'
        WHEN '225165' THEN 'Médico Gastroenterologista'
        WHEN '225185' THEN 'Médico Endocrinologista'
        WHEN '225215' THEN 'Médico Infectologista'
        WHEN '225225' THEN 'Médico Intensivista'
        WHEN '225255' THEN 'Médico Patologista'
        WHEN '225260' THEN 'Médico Pneumologista'
        WHEN '225265' THEN 'Médico Proctologista'
        WHEN '225275' THEN 'Médico Otorrinolaringologista'
        WHEN '225290' THEN 'Médico Urologista'

        -- Enfermagem e saúde
        WHEN '223505' THEN 'Enfermeiro'
        WHEN '223605' THEN 'Fisioterapeuta'
        WHEN '223710' THEN 'Nutricionista'
        WHEN '223810' THEN 'Fonoaudiólogo'

        -- Psicologia
        WHEN '251510' THEN 'Psicólogo Clínico'
        WHEN '251520' THEN 'Psicólogo Hospitalar'
        WHEN '251605' THEN 'Assistente Social'

        -- Não informado
        WHEN '000000' THEN 'Não informado'

        ELSE 'Outros profissionais'

    END AS descricao_profissional,

    CASE

        WHEN LEFT(cbo_profissional, 3) = '225'
            THEN 'Médico'

        WHEN LEFT(cbo_profissional, 3) = '223'
            THEN 'Profissional da saúde'

        WHEN LEFT(cbo_profissional, 3) = '251'
            THEN 'Ciências humanas e saúde'

        ELSE 'Outros'

    END AS categoria_profissional

FROM prata.sih_procedimentos

WHERE cbo_profissional IS NOT NULL;