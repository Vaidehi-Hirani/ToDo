using System.ComponentModel.DataAnnotations;

namespace ToDo.Api.DTOs;

public class UpdateUserRoleDto
{
    [Required]
    [RegularExpression("^(User|Admin)$", ErrorMessage = "Role must be 'User' or 'Admin'")]
    public string Role { get; set; } = string.Empty;
}
