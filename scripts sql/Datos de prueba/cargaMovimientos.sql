DECLARE @xml XML
SET @xml = '
<Datos>
    <Movimientos>
        <movimiento ValorDocId="7517662" IdTipoMovimiento="5" Fecha="2024-01-18" Monto="2"  PostByUser="hardingmicheal" PostInIP="42.142.119.153"   PostTime="2024-01-18 18:47:14"/>
        <movimiento ValorDocId="6993943" IdTipoMovimiento="2" Fecha="2024-10-31" Monto="1"  PostByUser="mgarrison"      PostInIP="156.92.82.57"     PostTime="2024-10-31 12:43:18"/>
        <movimiento ValorDocId="8326328" IdTipoMovimiento="5" Fecha="2024-11-22" Monto="7"  PostByUser="andersondeborah" PostInIP="218.213.110.232" PostTime="2024-11-22 00:23:53"/>
        <movimiento ValorDocId="4510358" IdTipoMovimiento="6" Fecha="2024-07-03" Monto="3"  PostByUser="hardingmicheal" PostInIP="143.42.131.166"   PostTime="2024-07-03 17:07:39"/>
        <movimiento ValorDocId="8403646" IdTipoMovimiento="6" Fecha="2024-12-07" Monto="8"  PostByUser="zkelly"         PostInIP="155.44.100.105"   PostTime="2024-12-07 15:44:30"/>
        <movimiento ValorDocId="8326328" IdTipoMovimiento="5" Fecha="2024-11-26" Monto="10" PostByUser="hardingmicheal" PostInIP="141.163.255.56"   PostTime="2024-11-26 09:33:41"/>
        <movimiento ValorDocId="6993943" IdTipoMovimiento="4" Fecha="2024-11-20" Monto="6"  PostByUser="hardingmicheal" PostInIP="4.176.52.1"       PostTime="2024-11-20 23:31:41"/>
        <movimiento ValorDocId="2918773" IdTipoMovimiento="4" Fecha="2024-10-30" Monto="10" PostByUser="zkelly"         PostInIP="220.164.108.231"  PostTime="2024-10-30 03:55:57"/>
        <movimiento ValorDocId="2161775" IdTipoMovimiento="3" Fecha="2024-06-13" Monto="2"  PostByUser="hardingmicheal" PostInIP="135.223.57.22"    PostTime="2024-06-13 13:28:39"/>
        <movimiento ValorDocId="8403646" IdTipoMovimiento="2" Fecha="2024-01-01" Monto="6"  PostByUser="zkelly"         PostInIP="150.250.94.62"    PostTime="2024-01-01 05:17:10"/>
        <movimiento ValorDocId="2918773" IdTipoMovimiento="5" Fecha="2024-07-12" Monto="6"  PostByUser="hardingmicheal" PostInIP="218.191.123.15"   PostTime="2024-07-12 09:10:16"/>
        <movimiento ValorDocId="5095109" IdTipoMovimiento="6" Fecha="2024-12-27" Monto="14" PostByUser="hardingmicheal" PostInIP="136.103.23.170"   PostTime="2024-12-27 12:59:03"/>
        <movimiento ValorDocId="6993943" IdTipoMovimiento="5" Fecha="2024-04-08" Monto="1"  PostByUser="jgonzalez"      PostInIP="158.48.100.86"    PostTime="2024-04-08 01:24:38"/>
        <movimiento ValorDocId="8403646" IdTipoMovimiento="2" Fecha="2024-08-25" Monto="8"  PostByUser="jgonzalez"      PostInIP="204.0.219.231"    PostTime="2024-08-25 16:24:07"/>
        <movimiento ValorDocId="5095109" IdTipoMovimiento="2" Fecha="2024-03-07" Monto="7"  PostByUser="andersondeborah" PostInIP="208.0.4.33"      PostTime="2024-03-07 08:19:28"/>
    </Movimientos>
</Datos>'

DECLARE @movimientos TABLE
    ( ValorDocId        NVARCHAR(20)
    , IdTipoMovimiento  INT
    , TipoAccion        NVARCHAR(20)
    , Fecha             DATE
    , Monto             DECIMAL(10,2)
    , MontoAjustado     DECIMAL(10,2)
    , PostByUser        NVARCHAR(100)
    , PostInIP          NVARCHAR(50)
    , PostTime          DATETIME )

INSERT INTO @movimientos
    ( ValorDocId
    , IdTipoMovimiento
    , TipoAccion
    , Fecha
    , Monto
    , MontoAjustado
    , PostByUser
    , PostInIP
    , PostTime )
SELECT
    x.value('@ValorDocId',        'NVARCHAR(20)')
    ,x.value('@IdTipoMovimiento',  'INT')
    ,tm.TipoAccion
    ,x.value('@Fecha',             'DATE')
    ,x.value('@Monto',             'DECIMAL(10,2)')
    ,CASE
        WHEN tm.TipoAccion = 'Credito'
            THEN  x.value('@Monto', 'DECIMAL(10,2)')
            ELSE -x.value('@Monto', 'DECIMAL(10,2)')
     END
    ,x.value('@PostByUser',        'NVARCHAR(100)')
    ,x.value('@PostInIP',          'NVARCHAR(50)')
    ,x.value('@PostTime',          'DATETIME')
FROM @xml.nodes('/Datos/Movimientos/movimiento') AS t(x)
    INNER JOIN dbo.TipoMovimiento tm ON (tm.Id = x.value('@IdTipoMovimiento', 'INT'))

INSERT INTO dbo.Movimiento
    ( IdEmpleado
    , IdTipoMovimiento
    , Fecha
    , Monto
    , NuevoSaldo
    , IdUsuario
    , IpPostIn
    , PostTime )
SELECT
    e.Id
    ,m.IdTipoMovimiento
    ,m.Fecha
    ,m.Monto
    ,SUM(m.MontoAjustado) OVER
        ( PARTITION BY m.ValorDocId
          ORDER BY m.Fecha, m.PostTime
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW )
    ,u.Id
    ,m.PostInIP
    ,m.PostTime
FROM @movimientos m
    INNER JOIN dbo.Empleado e ON (e.ValorDocumentoIdentidad = m.ValorDocId)
    INNER JOIN dbo.Usuario  u ON (u.Username = m.PostByUser)

UPDATE dbo.Empleado
SET SaldoVacaciones = ultimoSaldo.NuevoSaldo
FROM dbo.Empleado e
    INNER JOIN (
        SELECT
            IdEmpleado
            ,NuevoSaldo
            ,ROW_NUMBER() OVER
                ( PARTITION BY IdEmpleado
                  ORDER BY Fecha DESC, PostTime DESC ) AS rn
        FROM dbo.Movimiento
    ) ultimoSaldo ON (ultimoSaldo.IdEmpleado = e.Id)
WHERE (ultimoSaldo.rn = 1)

-- Verificacion
SELECT * FROM dbo.Movimiento
SELECT * FROM dbo.Empleado