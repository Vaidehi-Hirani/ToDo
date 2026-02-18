using Microsoft.EntityFrameworkCore;
using ToDo.Api.Data;
using ToDo.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers
builder.Services.AddControllers();

// DB Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Email Service
builder.Services.AddScoped<IEmailService, EmailService>();

// CORS Configuration - Read from environment variable or appsettings
var allowedOriginsString = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
var allowedOrigins = !string.IsNullOrEmpty(allowedOriginsString)
    ? allowedOriginsString.Split(',', StringSplitOptions.RemoveEmptyEntries)
    : builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
      ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        corsBuilder => corsBuilder
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});


// ================= JWT CONFIG =================

// Read JWT settings from environment variables or appsettings
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Secret Key is not configured");

var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["Jwt:Issuer"];

var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["Jwt:Audience"];

// Add Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        )
    };
});

// ================= END JWT CONFIG =================


var app = builder.Build();

// Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global Exception Handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = exceptionFeature?.Error;

        // Log exception (in production, use proper logging framework)
        if (exception != null)
        {
            Console.Error.WriteLine($"Unhandled exception: {exception}");
        }

        var response = new
        {
            message = "An internal error occurred",
            error = app.Environment.IsDevelopment() ? exception?.Message : null
        };

        await context.Response.WriteAsJsonAsync(response);
    });
});

app.UseHttpsRedirection();

// CORS must be called before Authentication and Authorization
app.UseCors("AllowAngular");

// IMPORTANT: Authentication BEFORE Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        if (context.Request.Path == "/")
        {
            context.Response.Redirect("/swagger");
            return;
        }
        await next();

    });
}

// Seed default admin user
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Check if admin user exists
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@gmail.com");

        if (adminUser == null)
        {
            logger.LogInformation("Creating default admin user...");

            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<ToDo.Api.Models.User>();
            var admin = new ToDo.Api.Models.User
            {
                Name = "Admin",
                Email = "admin@gmail.com",
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            admin.PasswordHash = hasher.HashPassword(admin, "Admin.123");

            context.Users.Add(admin);
            await context.SaveChangesAsync();

            logger.LogInformation("Default admin user created successfully!");
        }
        else
        {
            logger.LogInformation("Admin user already exists.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error creating default admin user");
    }
}

app.Run();
