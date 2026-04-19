DECLARE @xml XML
SET @xml = '
<Datos>
    <Usuarios>
        <usuario Id="1" Nombre="UsuarioScripts"  Pass="UsuarioScripts"/>
        <usuario Id="2" Nombre="mgarrison"       Pass=")*2LnSr^lk"/>
        <usuario Id="3" Nombre="jgonzalez"       Pass="3YSI0HtiXI"/>
        <usuario Id="4" Nombre="zkelly"          Pass="X4US4aLam@"/>
        <usuario Id="5" Nombre="andersondeborah" Pass="732F34xo%S"/>
        <usuario Id="6" Nombre="hardingmicheal"  Pass="himB9Dzd%_"/>
    </Usuarios>
</Datos>'

SET IDENTITY_INSERT dbo.Usuario ON

INSERT INTO dbo.Usuario (Id, Username, Password)
SELECT
    x.value('@Id',     'INT')
    ,x.value('@Nombre', 'NVARCHAR(100)')
    ,x.value('@Pass',   'NVARCHAR(100)')
FROM @xml.nodes('/Datos/Usuarios/usuario') AS t(x)

SET IDENTITY_INSERT dbo.Usuario OFF

-- Verificacion
SELECT * FROM dbo.Usuario