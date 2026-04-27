using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;

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

                    using (var cmd = new SqlCommand("dbo.sp_ObtenerTiposMovimiento", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
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
        public IActionResult CreateMovimiento([FromBody] JsonElement payload)
        {
            try
            {
                int idEmpleado = payload.GetProperty("idEmpleado").GetInt32();
                int idTipoMovimiento = payload.GetProperty("idTipoMovimiento").GetInt32();
                decimal monto = payload.GetProperty("monto").GetDecimal();
                int idUsuario = payload.TryGetProperty("idUsuario", out var idUsuarioProp) ? idUsuarioProp.GetInt32() : 1;
                string remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";


                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    // Validaciones en backend
                    if (idTipoMovimiento == 0 || monto <= 0)
                    {
                        using (var cmdBitacora = new SqlCommand("dbo.sp_InsertarBitacoraEvento", connection))
                        {
                            cmdBitacora.CommandType = CommandType.StoredProcedure;
                            cmdBitacora.Parameters.Add(new SqlParameter("@inIdTipoEvento", 13));
                            cmdBitacora.Parameters.Add(new SqlParameter("@inDescripcion", "Intento fallido: tipo de movimiento o monto invalido"));
                            cmdBitacora.Parameters.Add(new SqlParameter("@inIdPostByUser", idUsuario));
                            cmdBitacora.Parameters.Add(new SqlParameter("@inIpPostIn", remoteIp));
                            var outBitacora = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                            cmdBitacora.Parameters.Add(outBitacora);
                            cmdBitacora.ExecuteNonQuery();
                        }
                        return BadRequest(new { success = false, message = "Tipo de movimiento o monto invalido" });
                    }

                    using (var cmd = new SqlCommand("dbo.sp_InsertarMovimiento", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@inIdEmpleado", idEmpleado);
                        cmd.Parameters.AddWithValue("@inIdTipoMovimiento", idTipoMovimiento);
                        cmd.Parameters.AddWithValue("@inMonto", monto);
                        cmd.Parameters.AddWithValue("@inIdPostByUser", idUsuario);
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