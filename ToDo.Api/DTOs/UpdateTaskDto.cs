using System.ComponentModel.DataAnnotations;

namespace ToDo.Api.DTOs;

public class UpdateTaskDto
{
    [MaxLength(200)]
    public string? Title { get; set; }
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public bool? IsCompleted { get; set; }
    
    public DateTime? DueDate { get; set; }
    
    [RegularExpression("Low|Medium|High", ErrorMessage = "Priority must be Low, Medium or High")]
    public string? Priority { get; set; }
    
    public string? Category { get; set; }
    
    public string? RepeatType { get; set; }
    
    public int? ProjectId { get; set; }
}
