namespace ToDo.Api.Models;
public class Project{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public DateTime CreatedAt {get; set;} = DateTime.UtcNow;
    public DateTime? DueDate {get; set;}
    public bool IsCompleted {get; set;} = false;
    public bool IsDeleted {get; set;} = false;
    public int UserId {get; set;}
    public User User {get; set;} = null!;
    public ICollection<TaskItem> Tasks {get; set;} = new List<TaskItem>();
}