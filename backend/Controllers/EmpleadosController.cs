using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

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
                                    id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                                    documentoIdentidad = reader.GetString(reader.GetOrdinal("ValorDocumentoIdentidad"))
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
        public IActionResult CreateEmpleado([FromBody] dynamic payload)
        {
            try
            {
                string nombre = (string)payload.nombre;
                string documento = (string)payload.documento;
                int idPuesto = (int)payload.idPuesto;
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

        // Consulta un empleado por id
        [HttpGet("{id}")]
        public IActionResult GetEmpleadoPorId(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand("dbo.sp_ConsultarEmpleado", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@inId", id);
                        command.Parameters.AddWithValue("@inIdPostByUser", 1);
                        command.Parameters.AddWithValue("@@inIpPostIn", "127.0.0.1");
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(outResultCode);

                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                var empleado = new
                                {
                                    Nombre              = reader["Nombre"].ToString(),
                                    ValorDocumentoIdentidad = reader["ValorDocumentoIdentidad"].ToString(),
                                    NombrePuesto        = reader["NombrePuesto"].ToString(),
                                    SaldoVacaciones     = reader["SaldoVacaciones"]
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
                return StatusCode(500, new { success = false, message = "Error al consultar empleado", error = ex.Message });
            }
        }

        // Edita un empleado existente
        [HttpPut("{id}")]
        public IActionResult UpdateEmpleado(int id, [FromBody] EmpleadoUpdateRequest payload)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand("dbo.sp_ActualizarEmpleado", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@inId",                        id);
                        command.Parameters.AddWithValue("@inIdPuesto",                  payload.IdPuesto);
                        command.Parameters.AddWithValue("@inValorDocumentoIdentidad",   payload.Documento);
                        command.Parameters.AddWithValue("@inNombre",                    payload.Nombre);
                        command.Parameters.AddWithValue("@inIdPostByUser",              1);
                        command.Parameters.AddWithValue("@@inIpPostIn",                  "127.0.0.1");
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(outResultCode);

                        command.ExecuteNonQuery();
                        int resultCode = (int)outResultCode.Value;

                        if (resultCode == 0)
                            return Ok(new { success = true });
                        else if (resultCode == 50006)
                            return Conflict(new { success = false, message = "Ya existe un empleado con esa identificación" });
                        else if (resultCode == 50007)
                            return Conflict(new { success = false, message = "Ya existe un empleado con ese nombre" });
                        else
                            return BadRequest(new { success = false, message = "Error al actualizar empleado", code = resultCode });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al actualizar empleado", error = ex.Message });
            }
        }

        // Registra intento de borrado en bitacora
        [HttpPost("{id}/intento-borrado")]
        public IActionResult IntentoBorrado(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand("dbo.sp_IntentoBorrarEmpleado", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@inId",            id);
                        command.Parameters.AddWithValue("@inIdPostByUser",  1);
                        command.Parameters.AddWithValue("@inIpPostIn",      "127.0.0.1");
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(outResultCode);

                        command.ExecuteNonQuery();
                        return Ok(new { success = true });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al registrar intento", error = ex.Message });
            }
        }

        // Borrado logico de un empleado
        [HttpDelete("{id}")]
        public IActionResult DeleteEmpleado(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand("dbo.sp_BorrarEmpleado", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@inId",            id);
                        command.Parameters.AddWithValue("@inIdPostByUser",  1);
                        command.Parameters.AddWithValue("@inIpPostIn",      "127.0.0.1");
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(outResultCode);

                        command.ExecuteNonQuery();
                        int resultCode = (int)outResultCode.Value;

                        if (resultCode == 0)
                            return Ok(new { success = true });
                        else
                            return BadRequest(new { success = false, code = resultCode });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al eliminar empleado", error = ex.Message });
            }
        }

    }
    public class EmpleadoUpdateRequest
    {
        public string Nombre    { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public int    IdPuesto  { get; set; }
    }

}
