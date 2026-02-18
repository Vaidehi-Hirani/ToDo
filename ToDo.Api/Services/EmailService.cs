using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ToDo.Api.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string userName, string userRole)
    {
        var subject = "Welcome to ToDo App!";

        var roleBadge = userRole == "Admin"
            ? "<span style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px;'>ADMIN</span>"
            : "";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Welcome to ToDo App</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; background-color: #f4f4f4;'>
    <table role='presentation' style='width: 100%; border-collapse: collapse;'>
        <tr>
            <td style='padding: 40px 0;'>
                <table role='presentation' style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);'>
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;'>
                            <h1 style='margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;'>ToDo App</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style='padding: 40px 30px;'>
                            <h2 style='margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;'>
                                Welcome, {userName}! {roleBadge}
                            </h2>

                            <p style='margin: 0 0 16px 0; color: #666666; font-size: 16px; line-height: 1.6;'>
                                Thank you for joining <strong>ToDo App</strong>! We're excited to help you organize your tasks and boost your productivity.
                            </p>

                            <p style='margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 1.6;'>
                                Your account has been successfully created with <strong>{userRole}</strong> privileges.
                            </p>

                            <div style='background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 24px 0; border-radius: 4px;'>
                                <h3 style='margin: 0 0 12px 0; color: #333333; font-size: 18px; font-weight: 600;'>Quick Start Guide:</h3>
                                <ul style='margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;'>
                                    <li>Create your first project to organize related tasks</li>
                                    <li>Add tasks and set priorities to stay focused</li>
                                    <li>Mark tasks as complete to track your progress</li>
                                    {(userRole == "Admin" ? "<li><strong>Manage users and roles from the admin panel</strong></li>" : "")}
                                </ul>
                            </div>

                            <p style='margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;'>
                                If you have any questions or need assistance, feel free to reach out to our support team.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;'>
                            <p style='margin: 0 0 8px 0; color: #999999; font-size: 12px;'>
                                This email was sent to {toEmail}
                            </p>
                            <p style='margin: 0; color: #999999; font-size: 12px;'>
                                © 2026 ToDo App. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var host = _config["Smtp:Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST");
            var port = int.Parse(_config["Smtp:Port"] ?? Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
            var username = _config["Smtp:Username"] ?? Environment.GetEnvironmentVariable("SMTP_USERNAME");
            var password = _config["Smtp:Password"] ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD");
            var fromEmail = _config["Smtp:FromEmail"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL");
            var fromName = _config["Smtp:FromName"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? "ToDo App";
            var enableSsl = bool.Parse(_config["Smtp:EnableSsl"] ?? Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL") ?? "true");

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(fromEmail))
            {
                _logger.LogWarning("SMTP configuration is incomplete. Email will not be sent.");
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"Email sent successfully to {toEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {toEmail}: {ex.Message}");
            // Don't throw - we don't want email failures to block registration
        }
    }
}
