using System.Security.Claims;
using System.Text.Json;
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

        if (userIdClaim == null)
            throw new UnauthorizedAccessException("User identifier not found in token claims");

        if (!int.TryParse(userIdClaim.Value, out var userId))
            throw new UnauthorizedAccessException("User identifier has invalid format");

        return userId;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks([FromQuery] int? projectId, [FromQuery] int? labelId)
    {
        try
        {
            var userId = GetUserId();
            var query = _context.TaskItems
                .Include(t => t.Project)
                .Where(t => t.UserId == userId && !t.IsDeleted);

            if (projectId.HasValue)
            {
                query = query.Where(t => t.ProjectId == projectId.Value);
            }

            if (labelId.HasValue)
            {
                query = query.Where(t => t.LabelItems.Any(l => l.LabelId == labelId.Value));
            }

            var tasks = await query.ToListAsync();
            return Ok(tasks.Select(MapToTaskDto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("today")]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTodayTasks()
    {
        try
        {
            var userId = GetUserId();
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var tasks = await _context.TaskItems
                .Include(t => t.Project)
                .Where(t => t.UserId == userId && 
                           !t.IsDeleted && 
                           !t.IsCompleted &&
                           t.DueDate >= today && 
                           t.DueDate < tomorrow)
                .OrderBy(t => t.DueDate)
                .ToListAsync();

            return Ok(tasks.Select(MapToTaskDto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("overdue")]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetOverdueTasks()
    {
        try
        {
            var userId = GetUserId();
            var today = DateTime.UtcNow.Date;

            var tasks = await _context.TaskItems
                .Include(t => t.Project)
                .Where(t => t.UserId == userId && 
                           !t.IsDeleted && 
                           !t.IsCompleted &&
                           t.DueDate < today)
                .OrderBy(t => t.DueDate)
                .ToListAsync();

            return Ok(tasks.Select(MapToTaskDto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetUpcomingTasks([FromQuery] int days = 14)
    {
        try
        {
            var userId = GetUserId();
            var today = DateTime.UtcNow.Date;
            var endDate = today.AddDays(days);

            var tasks = await _context.TaskItems
                .Include(t => t.Project)
                .Where(t => t.UserId == userId && 
                           !t.IsDeleted && 
                           !t.IsCompleted &&
                           t.DueDate >= today && 
                           t.DueDate < endDate)
                .OrderBy(t => t.DueDate)
                .ToListAsync();

            return Ok(tasks.Select(MapToTaskDto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("recurring")]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetRecurringTasks()
    {
        try
        {
            var userId = GetUserId();

            var tasks = await _context.TaskItems
                .Include(t => t.Project)
                .Where(t => t.UserId == userId && 
                           !t.IsDeleted && 
                           !string.IsNullOrEmpty(t.RepeatType) &&
                           t.RepeatType != "none")
                .OrderBy(t => t.DueDate)
                .ToListAsync();

            return Ok(tasks.Select(MapToTaskDto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskDto>> GetTask(int id)
    {
        try
        {
            var userId = GetUserId();
            var task = await _context.TaskItems
                .Include(t => t.Project)
                .Include(t => t.LabelItems)
                .ThenInclude(tl => tl.Label)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && !t.IsDeleted);

            if (task == null)
            {
                return NotFound();
            }

            return Ok(MapToTaskDto(task));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskDto dto)
    {
        try
        {
            var userId = GetUserId();

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
                RepeatCustom = dto.RepeatCustom != null ? JsonSerializer.Serialize(dto.RepeatCustom) : null,
                ProjectId = dto.ProjectId,
                UserId = userId,
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskItems.Add(task);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, MapToTaskDto(task));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, UpdateTaskDto dto)
    {
        try
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
                
                if (task.IsCompleted && !string.IsNullOrEmpty(task.RepeatType) && task.RepeatType != "none")
                {
                    var nextDueDate = CalculateNextDueDate(task.DueDate ?? DateTime.UtcNow, task.RepeatType, task.RepeatCustom);
                    if (nextDueDate.HasValue)
                    {
                        var newTask = new TaskItem
                        {
                            Title = task.Title,
                            Description = task.Description,
                            DueDate = nextDueDate,
                            Priority = task.Priority,
                            Category = task.Category,
                            RepeatType = task.RepeatType,
                            RepeatCustom = task.RepeatCustom,
                            ProjectId = task.ProjectId,
                            UserId = userId,
                            IsCompleted = false,
                            ParentTaskId = task.Id,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.TaskItems.Add(newTask);
                    }
                }
            }
            if (dto.DueDate != null) task.DueDate = dto.DueDate;
            if (dto.Priority != null) task.Priority = dto.Priority;
            if (dto.Category != null) task.Category = dto.Category;
            if (dto.RepeatType != null)
            {
                task.RepeatType = dto.RepeatType;
                if (dto.RepeatType == "none")
                {
                    task.RepeatCustom = null;
                }
            }
            if (dto.RepeatCustom != null)
            {
                task.RepeatCustom = JsonSerializer.Serialize(dto.RepeatCustom);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        try
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/create-recurring")]
    public async Task<ActionResult<TaskDto>> CreateRecurringCopy(int id)
    {
        try
        {
            var userId = GetUserId();
            var task = await _context.TaskItems
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && !t.IsDeleted);

            if (task == null)
            {
                return NotFound();
            }

            var nextDueDate = CalculateNextDueDate(task.DueDate ?? DateTime.UtcNow, task.RepeatType ?? "none", task.RepeatCustom);
            
            var newTask = new TaskItem
            {
                Title = task.Title,
                Description = task.Description,
                DueDate = nextDueDate ?? DateTime.UtcNow.AddDays(1),
                Priority = task.Priority,
                Category = task.Category,
                RepeatType = task.RepeatType,
                RepeatCustom = task.RepeatCustom,
                ProjectId = task.ProjectId,
                UserId = userId,
                IsCompleted = false,
                ParentTaskId = task.Id,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskItems.Add(newTask);
            await _context.SaveChangesAsync();

            return Ok(MapToTaskDto(newTask));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/skip-recurring")]
    public async Task<IActionResult> SkipRecurringOccurrence(int id)
    {
        try
        {
            var userId = GetUserId();
            var task = await _context.TaskItems
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && !t.IsDeleted);

            if (task == null)
            {
                return NotFound();
            }

            var nextDueDate = CalculateNextDueDate(task.DueDate ?? DateTime.UtcNow, task.RepeatType ?? "none", task.RepeatCustom);
            if (nextDueDate.HasValue)
            {
                task.DueDate = nextDueDate;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("recurrence/preview")]
    public async Task<ActionResult<IEnumerable<string>>> PreviewRecurrence([FromBody] CreateTaskDto dto, [FromQuery] int count = 5)
    {
        var dates = new List<string>();
        var currentDate = dto.DueDate ?? DateTime.UtcNow;

        for (int i = 0; i < count; i++)
        {
            var repeatCustomStr = dto.RepeatCustom != null ? JsonSerializer.Serialize(dto.RepeatCustom) : null;
            var nextDate = CalculateNextDueDate(currentDate, dto.RepeatType ?? "none", repeatCustomStr);
            if (!nextDate.HasValue)
            {
                break;
            }
            dates.Add(nextDate.Value.ToString("yyyy-MM-dd"));
            currentDate = nextDate.Value;
        }

        return Ok(dates);
    }

    private DateTime? CalculateNextDueDate(DateTime current, string repeatType, string? repeatCustom)
    {
        switch (repeatType.ToLower())
        {
            case "daily":
                return current.AddDays(1);
            case "weekly":
                return current.AddDays(7);
            case "biweekly":
                return current.AddDays(14);
            case "monthly":
                return current.AddMonths(1);
            case "quarterly":
                return current.AddMonths(3);
            case "yearly":
                return current.AddYears(1);
            case "custom":
                if (!string.IsNullOrEmpty(repeatCustom))
                {
                    try
                    {
                        var custom = JsonSerializer.Deserialize<RepeatCustomDto>(repeatCustom);
                        if (custom != null)
                        {
                            return CalculateCustomDate(current, custom);
                        }
                    }
                    catch
                    {
                        return null;
                    }
                }
                return null;
            case "none":
            default:
                return null;
        }
    }

    private DateTime? CalculateCustomDate(DateTime current, RepeatCustomDto custom)
    {
        switch (custom.Interval?.ToLower())
        {
            case "day":
                return current.AddDays(custom.Frequency);
            case "week":
                if (custom.DaysOfWeek != null && custom.DaysOfWeek.Count > 0)
                {
                    var currentDay = (int)current.DayOfWeek;
                    var nextDay = custom.DaysOfWeek.Where(d => d > currentDay).OrderBy(d => d).FirstOrDefault();
                    if (nextDay > 0)
                    {
                        return current.AddDays(nextDay - currentDay);
                    }
                    return current.AddDays((7 - currentDay) + custom.DaysOfWeek.First());
                }
                return current.AddDays(custom.Frequency * 7);
            case "month":
                var newMonth = current.AddMonths(custom.Frequency);
                if (custom.DayOfMonth.HasValue)
                {
                    var daysInMonth = DateTime.DaysInMonth(newMonth.Year, newMonth.Month);
                    newMonth = newMonth.AddDays(Math.Min(custom.DayOfMonth.Value, daysInMonth) - newMonth.Day);
                }
                return newMonth;
            case "year":
                var newYear = current.AddYears(custom.Frequency);
                if (custom.MonthOfYear.HasValue)
                {
                    var daysInMonth = DateTime.DaysInMonth(newYear.Year, custom.MonthOfYear.Value);
                    newYear = newYear.AddMonths(custom.MonthOfYear.Value - (int)newYear.Month);
                    if (custom.DayOfMonth.HasValue)
                    {
                        newYear = newYear.AddDays(Math.Min(custom.DayOfMonth.Value, daysInMonth) - newYear.Day);
                    }
                }
                return newYear;
            default:
                return null;
        }
    }

    private static TaskDto MapToTaskDto(TaskItem t)
    {
        RepeatCustomDto? repeatCustom = null;
        if (!string.IsNullOrEmpty(t.RepeatCustom))
        {
            try
            {
                repeatCustom = JsonSerializer.Deserialize<RepeatCustomDto>(t.RepeatCustom);
            }
            catch
            {
                repeatCustom = null;
            }
        }

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
            RepeatCustom = repeatCustom,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.Name,
            UserId = t.UserId,
            IsRecurring = !string.IsNullOrEmpty(t.RepeatType) && t.RepeatType != "none",
            ParentTaskId = t.ParentTaskId
        };
    }
}
