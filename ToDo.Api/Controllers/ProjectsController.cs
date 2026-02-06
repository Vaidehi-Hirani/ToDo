using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDo.Api.Data;
using ToDo.Api.DTOs;
using ToDo.Api.Models;

namespace ToDo.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectsController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");

        if (userIdClaim == null)
            throw new UnauthorizedAccessException("User identifier not found in token claims");

        if (!int.TryParse(userIdClaim.Value, out var userId))
            throw new UnauthorizedAccessException("User identifier has invalid format");

        return userId;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        try
        {
            var userId = GetUserId();
            var projects = await _context.Projects
                .Where(p => p.UserId == userId && !p.IsDeleted)
                .Include(p => p.Tasks)
                .ToListAsync();

            return Ok(projects.Select(MapToProjectDto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
    {
        try
        {
            var userId = GetUserId();
            var project = await _context.Projects
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && !p.IsDeleted);

            if (project == null)
            {
                return NotFound();
            }

            return Ok(MapToProjectDto(project));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto dto)
    {
        try
        {
            var userId = GetUserId();
            var project = new Project
            {
                Name = dto.Name,
                Description = dto.Description,
                DueDate = dto.DueDate,
                UserId = userId
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, MapToProjectDto(project));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, UpdateProjectDto dto)
    {
        try
        {
            var userId = GetUserId();
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && !p.IsDeleted);

            if (project == null)
            {
                return NotFound();
            }

            if (dto.Name != null) project.Name = dto.Name;
            if (dto.Description != null) project.Description = dto.Description;
            if (dto.DueDate != null) project.DueDate = dto.DueDate;
            if (dto.IsCompleted.HasValue) project.IsCompleted = dto.IsCompleted.Value;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        try
        {
            var userId = GetUserId();
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && !p.IsDeleted);

            if (project == null)
            {
                return NotFound();
            }

            project.IsDeleted = true;

            // Soft delete associated tasks
            var tasks = await _context.TaskItems.Where(t => t.ProjectId == id).ToListAsync();
            foreach (var task in tasks)
            {
                task.IsDeleted = true;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    private static ProjectDto MapToProjectDto(Project project)
    {
        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            DueDate = project.DueDate,
            IsCompleted = project.IsCompleted,
            UserId = project.UserId,
            Tasks = project.Tasks.Where(t => !t.IsDeleted).Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                IsCompleted = t.IsCompleted,
                CreatedAt = t.CreatedAt,
                DueDate = t.DueDate,
                CompletedAt = t.CompletedAt,
                Priority = t.Priority,
                Category = t.Category,
                RepeatType = t.RepeatType,
                ProjectId = t.ProjectId,
                UserId = t.UserId
            }).ToList()
        };
    }
}
