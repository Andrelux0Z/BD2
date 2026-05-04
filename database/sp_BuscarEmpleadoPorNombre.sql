CREATE PROCEDURE [dbo].[sp_BuscarEmpleadoPorNombre]
    @nombre VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        Id,
        Nombre,
        ValorDocumentoIdentidad,
        SaldoVacaciones
    FROM 
        dbo.Empleado
    WHERE 
        Nombre = @nombre
        AND EsActivo = 1;
END
GO
