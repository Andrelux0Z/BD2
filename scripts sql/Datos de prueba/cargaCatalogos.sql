DECLARE @xml XML
SET @xml = '
<Datos>
    <Puestos>
        <Puesto Nombre="Cajero"        SalarioxHora="11.00"/>
        <Puesto Nombre="Camarero"      SalarioxHora="10.00"/>
        <Puesto Nombre="Cuidador"      SalarioxHora="13.50"/>
        <Puesto Nombre="Conductor"     SalarioxHora="15.00"/>
        <Puesto Nombre="Asistente"     SalarioxHora="11.00"/>
        <Puesto Nombre="Recepcionista" SalarioxHora="12.00"/>
        <Puesto Nombre="Fontanero"     SalarioxHora="13.00"/>
        <Puesto Nombre="Ninera"        SalarioxHora="12.00"/>
        <Puesto Nombre="Conserje"      SalarioxHora="11.00"/>
        <Puesto Nombre="Albanil"       SalarioxHora="10.50"/>
    </Puestos>
    <TiposEvento>
        <TipoEvento Id="1"  Nombre="Login Exitoso"/>
        <TipoEvento Id="2"  Nombre="Login No Exitoso"/>
        <TipoEvento Id="3"  Nombre="Login deshabilitado"/>
        <TipoEvento Id="4"  Nombre="Logout"/>
        <TipoEvento Id="5"  Nombre="Insercion no exitosa"/>
        <TipoEvento Id="6"  Nombre="Insercion exitosa"/>
        <TipoEvento Id="7"  Nombre="Update no exitoso"/>
        <TipoEvento Id="8"  Nombre="Update exitoso"/>
        <TipoEvento Id="9"  Nombre="Intento de borrado"/>
        <TipoEvento Id="10" Nombre="Borrado exitoso"/>
        <TipoEvento Id="11" Nombre="Consulta con filtro de nombre"/>
        <TipoEvento Id="12" Nombre="Consulta con filtro de cedula"/>
        <TipoEvento Id="13" Nombre="Intento de insertar movimiento"/>
        <TipoEvento Id="14" Nombre="Insertar movimiento exitoso"/>
    </TiposEvento>
    <TiposMovimientos>
        <TipoMovimiento Id="1" Nombre="Cumplir mes"           TipoAccion="Credito"/>
        <TipoMovimiento Id="2" Nombre="Bono vacacional"        TipoAccion="Credito"/>
        <TipoMovimiento Id="3" Nombre="Reversion Debito"       TipoAccion="Credito"/>
        <TipoMovimiento Id="4" Nombre="Disfrute de vacaciones" TipoAccion="Debito"/>
        <TipoMovimiento Id="5" Nombre="Venta de vacaciones"    TipoAccion="Debito"/>
        <TipoMovimiento Id="6" Nombre="Reversion de Credito"   TipoAccion="Debito"/>
    </TiposMovimientos>
</Datos>'

-- Puestos
INSERT INTO dbo.Puesto (Nombre, SalarioxHora)
SELECT
    x.value('@Nombre',        'NVARCHAR(100)')
    ,x.value('@SalarioxHora', 'DECIMAL(10,2)')
FROM @xml.nodes('/Datos/Puestos/Puesto') AS t(x)

-- TipoEvento
SET IDENTITY_INSERT dbo.TipoEvento ON

INSERT INTO dbo.TipoEvento (Id, Nombre)
SELECT
    x.value('@Id',     'INT')
    ,x.value('@Nombre', 'NVARCHAR(100)')
FROM @xml.nodes('/Datos/TiposEvento/TipoEvento') AS t(x)

SET IDENTITY_INSERT dbo.TipoEvento OFF

-- TipoMovimiento
SET IDENTITY_INSERT dbo.TipoMovimiento ON

INSERT INTO dbo.TipoMovimiento (Id, Nombre, TipoAccion)
SELECT
    x.value('@Id',         'INT')
    ,x.value('@Nombre',     'NVARCHAR(100)')
    ,x.value('@TipoAccion', 'NVARCHAR(20)')
FROM @xml.nodes('/Datos/TiposMovimientos/TipoMovimiento') AS t(x)

SET IDENTITY_INSERT dbo.TipoMovimiento OFF

-- Verificacion
SELECT * FROM dbo.Puesto
SELECT * FROM dbo.TipoEvento
SELECT * FROM dbo.TipoMovimiento