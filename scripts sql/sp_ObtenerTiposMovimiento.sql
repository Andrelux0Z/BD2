CREATE PROCEDURE [dbo].[sp_ObtenerTiposMovimiento]
AS
BEGIN
    SET NOCOUNT ON

    SELECT Id, Nombre, TipoAccion
    FROM dbo.TipoMovimiento
    ORDER BY Nombre
END
GO
