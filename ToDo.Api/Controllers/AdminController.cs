using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToDo.Api.Data;
using ToDo.Api.DTOs;

namespace ToDo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(AppDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/admin/users
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.Tasks)
                .Include(u => u.Projects)
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt,
                    TaskCount = u.Tasks.Count,
                    ProjectCount = u.Projects.Count
                })
                .ToListAsync();

            _logger.LogInformation($"Admin {User.FindFirstValue(ClaimTypes.NameIdentifier)} retrieved {users.Count} users");

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return StatusCode(500, new { message = "An error occurred while retrieving users" });
        }
    }

    // DELETE: api/admin/users/5
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Cannot delete yourself
            if (id == currentUserId)
            {
                return BadRequest(new { message = "You cannot delete your own account" });
            }

            var userToDelete = await _context.Users.FindAsync(id);
            if (userToDelete == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Cannot delete last admin
            if (userToDelete.Role == "Admin")
            {
                var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
                if (adminCount <= 1)
                {
                    return BadRequest(new { message = "Cannot delete the last admin user" });
                }
            }

            // Hard delete (cascade will handle related tasks/projects)
            _context.Users.Remove(userToDelete);
            await _context.SaveChangesAsync();

            _logger.LogWarning($"Admin {currentUserId} deleted user {id} ({userToDelete.Email})");

            return Ok(new { message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting user {id}");
            return StatusCode(500, new { message = "An error occurred while deleting the user" });
        }
    }

    // PUT: api/admin/users/5/role
    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto dto)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var userToUpdate = await _context.Users.FindAsync(id);
            if (userToUpdate == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Cannot demote yourself
            if (id == currentUserId && userToUpdate.Role == "Admin" && dto.Role == "User")
            {
                return BadRequest(new { message = "You cannot demote yourself from admin" });
            }

            // Cannot demote last admin
            if (userToUpdate.Role == "Admin" && dto.Role == "User")
            {
                var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
                if (adminCount <= 1)
                {
                    return BadRequest(new { message = "Cannot demote the last admin user" });
                }
            }

            var oldRole = userToUpdate.Role;
            userToUpdate.Role = dto.Role;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Admin {currentUserId} changed user {id} ({userToUpdate.Email}) role from {oldRole} to {dto.Role}");

            // Load navigation properties for the response
            await _context.Entry(userToUpdate).Collection(u => u.Tasks).LoadAsync();
            await _context.Entry(userToUpdate).Collection(u => u.Projects).LoadAsync();

            return Ok(new { message = "User role updated successfully", user = new UserDto
            {
                Id = userToUpdate.Id,
                Name = userToUpdate.Name,
                Email = userToUpdate.Email,
                Role = userToUpdate.Role,
                CreatedAt = userToUpdate.CreatedAt,
                TaskCount = userToUpdate.Tasks.Count,
                ProjectCount = userToUpdate.Projects.Count
            }});
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating role for user {id}");
            return StatusCode(500, new { message = "An error occurred while updating the user role" });
        }
    }
}
