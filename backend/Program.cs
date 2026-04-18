var builder = WebApplication.CreateBuilder(args);

// Agrega soporte para el patron MVC (Controllers)
builder.Services.AddControllers();
builder.Services.AddOpenApi(); // Para generar documentacion de la API (Swagger/OpenAPI)

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthorization();

// Mapea las rutas a los controladores
app.MapControllers();

app.Run();
