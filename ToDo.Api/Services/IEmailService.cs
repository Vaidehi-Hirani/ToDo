namespace ToDo.Api.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string userName, string userRole);
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
}
