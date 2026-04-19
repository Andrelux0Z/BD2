DECLARE @xml XML
SET @xml = '
<Datos>
    <Errores>
        <error Codigo="50001" Descripcion="Username no existe"/>
        <error Codigo="50002" Descripcion="Password no existe"/>
        <error Codigo="50003" Descripcion="Login deshabilitado"/>
        <error Codigo="50004" Descripcion="Empleado con ValorDocumentoIdentidad ya existe en insercion"/>
        <error Codigo="50005" Descripcion="Empleado con mismo nombre ya existe en insercion"/>
        <error Codigo="50006" Descripcion="Empleado con ValorDocumentoIdentidad ya existe en actualizacion"/>
        <error Codigo="50007" Descripcion="Empleado con mismo nombre ya existe en actualizacion"/>
        <error Codigo="50008" Descripcion="Error de base de datos"/>
        <error Codigo="50009" Descripcion="Nombre de empleado no alfabetico"/>
        <error Codigo="50010" Descripcion="Valor de documento de identidad no alfabetico"/>
        <error Codigo="50011" Descripcion="Monto del movimiento rechazado, saldo seria negativo."/>
    </Errores>
</Datos>'

INSERT INTO dbo.Error (Codigo, Descripcion)
SELECT
    x.value('@Codigo',      'INT')
    ,x.value('@Descripcion', 'NVARCHAR(500)')
FROM @xml.nodes('/Datos/Errores/error') AS t(x)

-- Verificacion
SELECT * FROM dbo.Error