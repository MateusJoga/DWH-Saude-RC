CREATE OR ALTER PROCEDURE ouro.sp_validar_ouro
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 'prata.sih_internacoes' AS tabela, COUNT(*) AS quantidade
    FROM prata.sih_internacoes

    UNION ALL

    SELECT 'ouro.fato_internacoes', COUNT(*)
    FROM ouro.fato_internacoes

    UNION ALL

    SELECT 'prata.sih_procedimentos', COUNT(*)
    FROM prata.sih_procedimentos

    UNION ALL

    SELECT 'ouro.fato_procedimentos', COUNT(*)
    FROM ouro.fato_procedimentos;
END;