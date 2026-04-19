DECLARE @xml XML
SET @xml = '
<Datos>
    <Empleados>
        <empleado Puesto="Camarero"  ValorDocumentoIdentidad="6993943" Nombre="Kaitlyn Jensen"   FechaContratacion="2017-12-07"/>
        <empleado Puesto="Albanil"   ValorDocumentoIdentidad="1896802" Nombre="Robert Buchanan"  FechaContratacion="2020-09-20"/>
        <empleado Puesto="Cajero"    ValorDocumentoIdentidad="5095109" Nombre="Christina Ward"   FechaContratacion="2015-09-13"/>
        <empleado Puesto="Fontanero" ValorDocumentoIdentidad="8403646" Nombre="Bradley Wright"   FechaContratacion="2020-01-27"/>
        <empleado Puesto="Conserje"  ValorDocumentoIdentidad="6019592" Nombre="Robert Singh"     FechaContratacion="2017-02-01"/>
        <empleado Puesto="Asistente" ValorDocumentoIdentidad="4510358" Nombre="Ryan Mitchell"    FechaContratacion="2018-06-08"/>
        <empleado Puesto="Asistente" ValorDocumentoIdentidad="7517662" Nombre="Candace Fox"      FechaContratacion="2013-12-17"/>
        <empleado Puesto="Asistente" ValorDocumentoIdentidad="8326328" Nombre="Allison Murillo"  FechaContratacion="2020-04-19"/>
        <empleado Puesto="Cuidador"  ValorDocumentoIdentidad="2161775" Nombre="Jessica Murphy"   FechaContratacion="2017-04-12"/>
        <empleado Puesto="Fontanero" ValorDocumentoIdentidad="2918773" Nombre="Nancy Newton PhD" FechaContratacion="2016-11-22"/>
    </Empleados>
</Datos>'

INSERT INTO dbo.Empleado
    ( IdPuesto
    , ValorDocumentoIdentidad
    , Nombre
    , FechaContratacion
    , SaldoVacaciones
    , EsActivo )
SELECT
    p.Id
    ,x.value('@ValorDocumentoIdentidad', 'NVARCHAR(20)')
    ,x.value('@Nombre',                  'NVARCHAR(100)')
    ,x.value('@FechaContratacion',       'DATE')
    ,0
    ,1
FROM @xml.nodes('/Datos/Empleados/empleado') AS t(x)
    INNER JOIN dbo.Puesto p ON (p.Nombre = x.value('@Puesto', 'NVARCHAR(100)'))

-- Verificacion
SELECT * FROM dbo.Empleado