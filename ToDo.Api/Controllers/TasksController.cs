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
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
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
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks([FromQuery] int? projectId)
    {
        var userId = GetUserId();
        var query = _context.TaskItems
            .Include(t => t.Project)
            .Where(t => t.UserId == userId && !t.IsDeleted);

        if (projectId.HasValue)
        {
            query = query.Where(t => t.ProjectId == projectId.Value);
        }

        var tasks = await query.ToListAsync();
        return Ok(tasks.Select(MapToTaskDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskDto>> GetTask(int id)
    {
        var userId = GetUserId();
        var task = await _context.TaskItems
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && !t.IsDeleted);

        if (task == null)
        {
            return NotFound();
        }

        return Ok(MapToTaskDto(task));
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskDto dto)
    {
        var userId = GetUserId();

        // If ProjectId is provided, verify it belongs to the user
        if (dto.ProjectId.HasValue)
        {
            var projectExists = await _context.Projects
                .AnyAsync(p => p.Id == dto.ProjectId.Value && p.UserId == userId && !p.IsDeleted);
            if (!projectExists)
            {
                return BadRequest("Invalid ProjectId");
            }
        }

        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            Priority = dto.Priority,
            Category = dto.Category,
            RepeatType = dto.RepeatType,
            ProjectId = dto.ProjectId,
            UserId = userId,
            IsCompleted = false
        };

        _context.TaskItems.Add(task);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, MapToTaskDto(task));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, UpdateTaskDto dto)
    {
        var userId = GetUserId();
        var task = await _context.TaskItems
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && !t.IsDeleted);

        if (task == null)
        {
            return NotFound();
        }

        if (dto.ProjectId.HasValue)
        {
            var projectExists = await _context.Projects
                .AnyAsync(p => p.Id == dto.ProjectId.Value && p.UserId == userId && !p.IsDeleted);
            if (!projectExists)
            {
                return BadRequest("Invalid ProjectId");
            }
            task.ProjectId = dto.ProjectId;
        }

        if (dto.Title != null) task.Title = dto.Title;
        if (dto.Description != null) task.Description = dto.Description;
        if (dto.IsCompleted.HasValue) 
        {
            task.IsCompleted = dto.IsCompleted.Value;
            task.CompletedAt = task.IsCompleted ? DateTime.UtcNow : null;
        }
        if (dto.DueDate != null) task.DueDate = dto.DueDate;
        if (dto.Priority != null) task.Priority = dto.Priority;
        if (dto.Category != null) task.Category = dto.Category;
        if (dto.RepeatType != null) task.RepeatType = dto.RepeatType;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var userId = GetUserId();
        var task = await _context.TaskItems
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && !t.IsDeleted);

        if (task == null)
        {
            return NotFound();
        }

        task.IsDeleted = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static TaskDto MapToTaskDto(TaskItem t)
    {
        return new TaskDto
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
            ProjectName = t.Project?.Name,
            UserId = t.UserId
        };
    }
}
