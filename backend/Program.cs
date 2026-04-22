var builder = WebApplication.CreateBuilder(args);

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // URL local del frontend
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Agrega soporte para el patron MVC (Controllers)
builder.Services.AddControllers();
builder.Services.AddOpenApi(); // Para generar documentacion de la API (Swagger/OpenAPI)

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Aplicar CORS antes del Authorization
app.UseCors("Frontend");

app.UseAuthorization();

// Mapea las rutas a los controladores
app.MapControllers();

app.Run();
