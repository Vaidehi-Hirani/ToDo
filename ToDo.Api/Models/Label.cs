namespace ToDo.Api.Models;

public class TaskLabel
{
    public int TaskId { get; set; }
    public TaskItem? Task { get; set; }
    
    public int LabelId { get; set; }
    public Label? Label { get; set; }
}

public class Label
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#A18267";
    public int UserId { get; set; }
    public User? User { get; set; }
    public List<TaskLabel> TaskLabels { get; set; } = new();
}
