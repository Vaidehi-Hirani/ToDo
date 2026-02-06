using System.ComponentModel.DataAnnotations;

namespace ToDo.Api.DTOs;

public class GoogleAuthDto
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}
