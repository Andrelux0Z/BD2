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

                    // Devuelve la lista de empleados ordenada alfabéticamente por nombre.
                    string query = "SELECT Nombre, ValorDocumentoIdentidad as DocumentoIdentidad FROM dbo.Empleado";

                    if (!string.IsNullOrWhiteSpace(filtro))
                    {
                        query += " WHERE Nombre LIKE @filtro OR ValorDocumentoIdentidad LIKE @filtro";
                    }

                    query += " ORDER BY Nombre ASC";

                    using (var command = new SqlCommand(query, connection))
                    {
                        if (!string.IsNullOrWhiteSpace(filtro))
                        {
                            command.Parameters.AddWithValue("@filtro", $"%{filtro}%");
                        }

                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                empleados.Add(new
                                {
                                    Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                                    DocumentoIdentidad = reader.GetString(reader.GetOrdinal("DocumentoIdentidad"))
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

        // Obtiene un empleado por su nombre (se pueden omitir espacios en la URL)
        [HttpGet("byname/{nombre}")]
        public IActionResult GetEmpleadoPorNombre(string nombre)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    // Buscamos por nombre ignorando espacios
                    string query = "SELECT TOP 1 Id, Nombre, ValorDocumentoIdentidad, SaldoVacaciones FROM dbo.Empleado WHERE REPLACE(Nombre, ' ', '') = @nombre OR Nombre = @nombre";

                    using (var command = new SqlCommand(query, connection))
                    {
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

        // Verifica existencia por nombre o documento
        [HttpGet("exists")]
        public IActionResult CheckExists([FromQuery] string? nombre = null, [FromQuery] string? documento = null)
        {
            try
            {
                bool existsName = false;
                bool existsDocumento = false;

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    if (!string.IsNullOrWhiteSpace(nombre))
                    {
                        using (var cmd = new SqlCommand("SELECT COUNT(1) FROM dbo.Empleado WHERE Nombre = @nombre", connection))
                        {
                            cmd.Parameters.AddWithValue("@nombre", nombre);
                            existsName = (int)cmd.ExecuteScalar() > 0;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(documento))
                    {
                        using (var cmd = new SqlCommand("SELECT COUNT(1) FROM dbo.Empleado WHERE ValorDocumentoIdentidad = @doc", connection))
                        {
                            cmd.Parameters.AddWithValue("@doc", documento);
                            existsDocumento = (int)cmd.ExecuteScalar() > 0;
                        }
                    }
                }

                return Ok(new { success = true, existsName, existsDocumento });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al comprobar existencia", error = ex.Message });
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

                    string query = "SELECT MIN(Id) AS Id, Nombre FROM dbo.Puesto GROUP BY Nombre ORDER BY Nombre ASC";

                    using (var cmd = new SqlCommand(query, connection))
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

                return Ok(puestos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al recuperar puestos", error = ex.Message });
            }
        }

        // Inserta un nuevo empleado (valida existencia)
        [HttpPost]
        public IActionResult CreateEmpleado([FromBody] dynamic payload)
        {
            try
            {
                string nombre = (string)payload.nombre;
                string documento = (string)payload.documento;
                int idPuesto = (int)payload.idPuesto;

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    // Verificar duplicados
                    using (var chk = new SqlCommand("SELECT COUNT(1) FROM dbo.Empleado WHERE Nombre = @nombre OR ValorDocumentoIdentidad = @doc", connection))
                    {
                        chk.Parameters.AddWithValue("@nombre", nombre);
                        chk.Parameters.AddWithValue("@doc", documento);
                        int exists = (int)chk.ExecuteScalar();
                        if (exists > 0)
                        {
                            return Conflict(new { success = false, message = "Ya existe un empleado con ese nombre o identificación" });
                        }
                    }

                    string insert = @"INSERT INTO dbo.Empleado (IdPuesto, ValorDocumentoIdentidad, Nombre, FechaContratacion, SaldoVacaciones, EsActivo)
                                      VALUES (@idPuesto, @doc, @nombre, GETDATE(), 0, 1); SELECT SCOPE_IDENTITY();";

                    using (var cmd = new SqlCommand(insert, connection))
                    {
                        cmd.Parameters.AddWithValue("@idPuesto", idPuesto);
                        cmd.Parameters.AddWithValue("@doc", documento);
                        cmd.Parameters.AddWithValue("@nombre", nombre);

                        var newIdObj = cmd.ExecuteScalar();
                        int newId = Convert.ToInt32(newIdObj);

                        return Ok(new { success = true, id = newId });
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
