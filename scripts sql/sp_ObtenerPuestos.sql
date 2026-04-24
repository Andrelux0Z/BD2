CREATE PROCEDURE [dbo].[sp_ObtenerPuestos]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        Id,
        Nombre
    FROM 
        dbo.Puesto
    ORDER BY 
        Nombre ASC;
END
GO
