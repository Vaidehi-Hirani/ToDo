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
        if (userIdClaim == null) return 0;
        return int.Parse(userIdClaim.Value);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        var userId = GetUserId();
        var projects = await _context.Projects
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .Include(p => p.Tasks)
            .ToListAsync();

        return Ok(projects.Select(MapToProjectDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
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

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto dto)
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

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, UpdateProjectDto dto)
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
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
