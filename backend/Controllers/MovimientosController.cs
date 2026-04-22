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
    }
}