CREATE VIEW ouro.dim_cid AS

SELECT DISTINCT

    cid_principal AS codigo_cid,

    LEFT(cid_principal, 1) AS grupo_cid,

    CASE LEFT(cid_principal, 1)

        WHEN 'A' THEN 'Algumas doenças infecciosas e parasitárias'
        WHEN 'B' THEN 'Algumas doenças infecciosas e parasitárias'

        WHEN 'C' THEN 'Neoplasias'
        WHEN 'D' THEN 'Doenças do sangue e transtornos imunitários'

        WHEN 'E' THEN 'Doenças endócrinas, nutricionais e metabólicas'

        WHEN 'F' THEN 'Transtornos mentais e comportamentais'

        WHEN 'G' THEN 'Doenças do sistema nervoso'

        WHEN 'H' THEN 'Doenças do olho e ouvido'

        WHEN 'I' THEN 'Doenças do aparelho circulatório'

        WHEN 'J' THEN 'Doenças do aparelho respiratório'

        WHEN 'K' THEN 'Doenças do aparelho digestivo'

        WHEN 'L' THEN 'Doenças da pele e tecido subcutâneo'

        WHEN 'M' THEN 'Doenças do sistema osteomuscular'

        WHEN 'N' THEN 'Doenças do aparelho geniturinário'

        WHEN 'O' THEN 'Gravidez, parto e puerpério'

        WHEN 'P' THEN 'Afecções originadas no período perinatal'

        WHEN 'Q' THEN 'Malformações congênitas'

        WHEN 'R' THEN 'Sintomas e sinais anormais'

        WHEN 'S' THEN 'Lesões e traumatismos'

        WHEN 'T' THEN 'Lesões, intoxicações e causas externas'

        WHEN 'Z' THEN 'Fatores que influenciam o estado de saúde'

        ELSE 'Não identificado'

    END AS capitulo_cid

FROM (

    SELECT cid_principal
    FROM prata.sih_internacoes

    UNION

    SELECT cid_principal
    FROM prata.sih_procedimentos

) cid

WHERE cid_principal IS NOT NULL;