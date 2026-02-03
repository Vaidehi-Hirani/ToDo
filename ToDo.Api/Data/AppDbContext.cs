using Microsoft.EntityFrameworkCore;
using ToDo.Api.Models;

namespace ToDo.Api.Data;
public class AppDbContext : DbContext{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options){
    }
    public DbSet<User> Users {get; set;}
    public DbSet<TaskItem> TaskItems {get; set;}
    public DbSet<Project> Projects {get; set;}
}