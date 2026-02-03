using System.ComponentModel.DataAnnotations;

namespace ToDo.Api.DTOs;
public class CreateProjectDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public DateTime? DueDate { get; set; }
}
