namespace ToDo.Api.Models;

public class TaskItem
    {
        public int Id { get; set;}
        public string Title {get; set;} = string.Empty;
        public string? Description {get; set;}
        public bool IsCompleted {get; set;}
        public DateTime CreatedAt {get; set;} = DateTime.UtcNow;
        public DateTime? DueDate {get; set;}
        public DateTime? CompletedAt {get; set;}
        public string? Priority {get; set;} = "Medium";
        public string? Category {get; set;}
        public string? RepeatType {get; set;}
        public bool IsDeleted {get; set;} = false;
        public int UserId {get; set;}
        public User? User {get; set;}
        public int? ProjectId {get; set;}
        public Project? Project {get; set;}
    }



