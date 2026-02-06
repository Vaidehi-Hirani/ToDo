using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;

using ToDo.Api.Data;
using ToDo.Api.Models;
using ToDo.Api.DTOs;

namespace ToDo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public UsersController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    // ================= REGISTER =================

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (existingUser != null)
        {
            return BadRequest("Email already registered");
        }

        var hasher = new PasswordHasher<User>();

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = dto.Password
        };

        user.PasswordHash =
            hasher.HashPassword(user, user.PasswordHash);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate tokens so user is logged in after registration
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return Ok(new TokenDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Id = user.Id,
            Name = user.Name,
            Email = user.Email
        });
    }

    // ================= LOGIN =================

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null)
            return Unauthorized("Invalid credentials");

        var hasher = new PasswordHasher<User>();

        var result = hasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.Password
        );

        if (result == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid credentials");

        // Generate JWT
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _context.SaveChangesAsync();

        return Ok(new TokenDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Id = user.Id,
            Name = user.Name,
            Email = user.Email
        });
    }

    // ================= GOOGLE SIGN-IN =================

    [HttpPost("google-signin")]
    public async Task<IActionResult> GoogleSignIn(GoogleAuthDto dto)
    {
        try
        {
            // Verify the Google ID token
            var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")
                ?? _config["Google:ClientId"];

            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { googleClientId! }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);

            if (payload == null)
            {
                return Unauthorized("Invalid Google token");
            }

            // Check if user exists
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == payload.Email);

            // Auto-create user if doesn't exist
            if (user == null)
            {
                user = new User
                {
                    Name = payload.Name ?? payload.Email.Split('@')[0],
                    Email = payload.Email,
                    PasswordHash = string.Empty // No password for Google users
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return Ok(new TokenDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Id = user.Id,
                Name = user.Name,
                Email = user.Email
            });
        }
        catch (Exception ex)
        {
            // Log the actual error for debugging (use proper logging in production)
            Console.Error.WriteLine($"Google Sign-In Error: {ex}");
            return BadRequest(new { message = "Failed to authenticate with Google. Please try again." });
        }
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(RefreshTokenRequestDto dto)
    {
        if (dto is null)
        {
            return BadRequest("Invalid client request");
        }

        string accessToken = dto.Token;
        string refreshToken = dto.RefreshToken;

        var principal = GetPrincipalFromExpiredToken(accessToken);
        if (principal == null)
        {
            return BadRequest("Invalid access token or refresh token");
        }

        var userId = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
             userId = principal.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
        }

        if (userId == null)
        {
            return BadRequest("Invalid access token: user identifier not found");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);

        if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return BadRequest("Invalid access token or refresh token");
        }

        var newAccessToken = GenerateJwtToken(user);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        await _context.SaveChangesAsync();

        return Ok(new TokenDto
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            Id = user.Id,
            Name = user.Name,
            Email = user.Email
        });
    }

    // ================= JWT =================

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("name", user.Name)
        };

        var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? _config["Jwt:Key"];
        var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? _config["Jwt:Issuer"];
        var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? _config["Jwt:Audience"];

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey!)
        );

        var creds = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15), // Shorter expiry for access token
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string? token)
    {
        if (string.IsNullOrEmpty(token))
            return null;

        var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? _config["Jwt:Key"];
        var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? _config["Jwt:Issuer"];
        var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? _config["Jwt:Audience"];

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,  // FIXED: Now validates audience
            ValidateIssuer = true,    // FIXED: Now validates issuer
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
            ValidateLifetime = false  // Required for refresh token flow
        };

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256,
                                                    StringComparison.InvariantCultureIgnoreCase))
                return null;

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
