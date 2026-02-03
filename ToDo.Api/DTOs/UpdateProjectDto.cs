using System.ComponentModel.DataAnnotations;

namespace ToDo.Api.DTOs;

public class UpdateProjectDto
{
    [MaxLength(100)]
    public string? Name { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public DateTime? DueDate { get; set; }
    
    public bool? IsCompleted { get; set; }
}
