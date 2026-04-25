using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace ProyectoBases2.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MovimientosController : ControllerBase
    {
        private readonly string _connectionString;

        public MovimientosController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("{idEmpleado}")]
        public IActionResult GetMovimientos(int idEmpleado)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var command = new SqlCommand("dbo.sp_ListarMovimientos", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.Add(new SqlParameter("@inIdEmpleado", idEmpleado));
                        
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(outResultCode);

                        object? empleadoInfo = null;
                        var movimientos = new List<object>();

                        using (var reader = command.ExecuteReader())
                        {
                            // Primer result set: Datos del empleado
                            if (reader.Read())
                            {
                                empleadoInfo = new
                                {
                                    ValorDocumentoIdentidad = reader["ValorDocumentoIdentidad"].ToString(),
                                    Nombre = reader["Nombre"].ToString(),
                                    SaldoVacaciones = reader["SaldoVacaciones"]
                                };
                            }

                            // Segundo result set: Lista de movimientos
                            if (reader.NextResult())
                            {
                                while (reader.Read())
                                {
                                    movimientos.Add(new
                                    {
                                        Fecha = reader["Fecha"],
                                        NombreTipoMovimiento = reader["NombreTipoMovimiento"].ToString(),
                                        Monto = reader["Monto"],
                                        NuevoSaldo = reader["NuevoSaldo"],
                                        NombreUsuario = reader["NombreUsuario"].ToString(),
                                        IpPostIn = reader["IpPostIn"].ToString(),
                                        PostTime = reader["PostTime"]
                                    });
                                }
                            }
                        }

                        if (empleadoInfo == null)
                        {
                            return NotFound(new { success = false, message = "Empleado no encontrado o inactivo" });
                        }

                        return Ok(new
                        {
                            success = true,
                            empleado = empleadoInfo,
                            movimientos = movimientos
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al recuperar movimientos", error = ex.Message });
            }
        }

        // Lista de tipos de movimiento
        [HttpGet("tipos")]
        public IActionResult GetTiposMovimiento()
        {
            try
            {
                var tipos = new List<object>();

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var cmd = new SqlCommand("SELECT Id, Nombre, TipoAccion FROM dbo.TipoMovimiento ORDER BY Nombre", connection))
                    {
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                tipos.Add(new
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                                    TipoAccion = reader.GetString(reader.GetOrdinal("TipoAccion"))
                                });
                            }
                        }
                    }
                }

                return Ok(tipos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al recuperar tipos de movimiento", error = ex.Message });
            }
        }

        // Insertar un nuevo movimiento
        [HttpPost]
        public IActionResult CreateMovimiento([FromBody] dynamic payload)
        {
            try
            {
                int idEmpleado = (int)payload.idEmpleado;
                int idTipoMovimiento = (int)payload.idTipoMovimiento;
                decimal monto = (decimal)payload.monto;

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var cmd = new SqlCommand("dbo.sp_InsertarMovimiento", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@inIdEmpleado", idEmpleado);
                        cmd.Parameters.AddWithValue("@inIdTipoMovimiento", idTipoMovimiento);
                        cmd.Parameters.AddWithValue("@inMonto", monto);
                        cmd.Parameters.AddWithValue("@inIdPostByUser", 1);
                        cmd.Parameters.AddWithValue("@inIpPostIn", "127.0.0.1");

                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        cmd.Parameters.Add(outResultCode);

                        cmd.ExecuteNonQuery();

                        int resultCode = (int)outResultCode.Value;

                        if (resultCode == 0)
                        {
                            return Ok(new { success = true });
                        }
                        else if (resultCode == 50011)
                        {
                            return Conflict(new { success = false, message = "Saldo insuficiente para realizar este movimiento" });
                        }
                        else
                        {
                            return StatusCode(400, new { success = false, message = "Error al crear movimiento", code = resultCode });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al crear movimiento", error = ex.Message });
            }
        }
    }
}