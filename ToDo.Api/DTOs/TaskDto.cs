namespace ToDo.Api.DTOs;

public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public string? RepeatType { get; set; }
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public int UserId { get; set; }
}
