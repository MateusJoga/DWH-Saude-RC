CREATE OR ALTER PROCEDURE dbo.sp_processar_dw
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        EXEC prata.sp_atualizar_prata;
        EXEC ouro.sp_validar_ouro;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;