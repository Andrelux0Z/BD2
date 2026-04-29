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

                    // Consulta básica de la tabla de empleados.
                    // Si se desea se puede reemplazar la próxima query directa por un llamado a un Stored Procedure específico (ej: sp_ObtenerEmpleados)
                    string query = "SELECT Id, Nombre, ValorDocumentoIdentidad as DocumentoIdentidad FROM dbo.Empleado";
                    
                    if (!string.IsNullOrWhiteSpace(filtro))
                    {
                        query += " WHERE Nombre LIKE @filtro OR ValorDocumentoIdentidad LIKE @filtro";
                    }

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
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
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
    }
}
