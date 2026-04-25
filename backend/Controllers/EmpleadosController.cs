using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;

namespace ProyectoBases2.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmpleadosController : ControllerBase
    {
        private readonly string _connectionString;

        public EmpleadosController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public IActionResult GetEmpleados([FromQuery] string? filtro = null)
        {
            try
            {
                var empleados = new List<object>();

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var command = new SqlCommand("dbo.sp_ListarEmpleados", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        object filtroParam = string.Empty;
                        if (filtro != null)
                        {
                            filtroParam = filtro;
                        }

                        command.Parameters.AddWithValue("@inFiltro", filtroParam);
                        command.Parameters.AddWithValue("@inIdPostByUser", 1);
                        command.Parameters.AddWithValue("@inIpPostIn", "127.0.0.1");
                        
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(outResultCode);

                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                empleados.Add(new
                                {
                                    Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                                    DocumentoIdentidad = reader.GetString(reader.GetOrdinal("ValorDocumentoIdentidad"))
                                });
                            }
                        }
                    }
                }

                return Ok(empleados);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al recuperar empleados", error = ex.Message });
            }
        }

        // Obtiene un empleado por su nombre
        [HttpGet("byname/{nombre}")]
        public IActionResult GetEmpleadoPorNombre(string nombre)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var command = new SqlCommand("dbo.sp_BuscarEmpleadoPorNombre", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@nombre", nombre);

                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                var empleado = new
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                                    ValorDocumentoIdentidad = reader.GetString(reader.GetOrdinal("ValorDocumentoIdentidad")),
                                    SaldoVacaciones = reader.GetDecimal(reader.GetOrdinal("SaldoVacaciones"))
                                };

                                return Ok(new { success = true, empleado });
                            }
                        }
                    }
                }

                return NotFound(new { success = false, message = "Empleado no encontrado" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al buscar empleado", error = ex.Message });
            }
        }

        // Lista de puestos (nombres únicos en orden alfabético)
        [HttpGet("puestos")]
        public IActionResult GetPuestos()
        {
            try
            {
                var puestos = new List<object>();

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var cmd = new SqlCommand("dbo.sp_ObtenerPuestos", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                puestos.Add(new
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    Nombre = reader.GetString(reader.GetOrdinal("Nombre"))
                                });
                            }
                        }
                    }
                }

                return Ok(puestos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al recuperar puestos", error = ex.Message });
            }
        }

        // Inserta un nuevo empleado
        [HttpPost]
        public IActionResult CreateEmpleado([FromBody] JsonElement payload)
        {
            try
            {
                string nombre = payload.GetProperty("nombre").GetString();
                string documento = payload.GetProperty("documento").GetString();
                int idPuesto = payload.GetProperty("idPuesto").GetInt32();
                DateTime fechaContratacion = DateTime.Now;

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var cmd = new SqlCommand("dbo.sp_InsertarEmpleado", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@inIdPuesto", idPuesto);
                        cmd.Parameters.AddWithValue("@inValorDocumentoIdentidad", documento);
                        cmd.Parameters.AddWithValue("@inNombre", nombre);
                        cmd.Parameters.AddWithValue("@inFechaContratacion", fechaContratacion);
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
                        else if (resultCode == 50004)
                        {
                            return Conflict(new { success = false, message = "Ya existe un empleado con esa identificación" });
                        }
                        else if (resultCode == 50005)
                        {
                            return Conflict(new { success = false, message = "Ya existe un empleado con ese nombre" });
                        }
                        else
                        {
                            return StatusCode(400, new { success = false, message = "Error al crear empleado", code = resultCode });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al crear empleado", error = ex.Message });
            }
        }
    }
}
