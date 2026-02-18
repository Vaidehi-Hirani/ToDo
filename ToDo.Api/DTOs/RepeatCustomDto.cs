namespace ToDo.Api.DTOs;

public class RepeatCustomDto
{
    public int Frequency { get; set; } = 1;
    public string? Interval { get; set; } = "week";
    public List<int>? DaysOfWeek { get; set; }
    public int? DayOfMonth { get; set; }
    public int? MonthOfYear { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Occurrences { get; set; }
}
