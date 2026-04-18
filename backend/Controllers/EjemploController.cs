using Microsoft.AspNetCore.Mvc;

namespace ProyectoBases2.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EjemploController : ControllerBase
{
    // GET: api/ejemplo
    [HttpGet]
    public IActionResult ObtenerMensaje()
    {
        // Simple prueba de que la API responde
        return Ok(new { mensaje = "El backend .NET de ProyectoBases2 esta funcionando correctamente." });
    }
}
