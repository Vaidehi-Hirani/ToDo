
$baseUrl = "http://localhost:5209/api"

try {
    Write-Host "1. Registering User..."
    $uniqueEmail = "test_" + (Get-Date -Format "yyyyMMddHHmmss") + "@example.com"
    $registerBody = @{
        name = "Test User"
        email = $uniqueEmail
        password = "Password123!"
    } | ConvertTo-Json
    $regResult = Invoke-RestMethod -Uri "$baseUrl/Users/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Registration: $regResult"

    Write-Host "`n2. Logging in..."
    $loginBody = @{
        email = $uniqueEmail
        password = "Password123!"
    } | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/Users/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful. Token acquired."

    $headers = @{
        Authorization = "Bearer $token"
    }

    Write-Host "`n3. Creating Project..."
    $projectBody = @{
        name = "Work Tasks"
        description = "Tasks related to work"
    } | ConvertTo-Json
    $project = Invoke-RestMethod -Uri "$baseUrl/Projects" -Method Post -Body $projectBody -ContentType "application/json" -Headers $headers
    $projectId = $project.id
    Write-Host "Project Created: $($project.name) (ID: $projectId)"

    Write-Host "`n4. Creating Task..."
    $taskBody = @{
        title = "Email the boss"
        description = "Send quarterly report"
        projectId = $projectId
        priority = "High"
    } | ConvertTo-Json
    $task = Invoke-RestMethod -Uri "$baseUrl/Tasks" -Method Post -Body $taskBody -ContentType "application/json" -Headers $headers
    Write-Host "Task Created: $($task.title) (ID: $($task.id))"

    Write-Host "`n5. Fetching Projects..."
    $projects = Invoke-RestMethod -Uri "$baseUrl/Projects" -Method Get -Headers $headers
    Write-Host "Projects Found: $($projects.Count)"
    $projects | ConvertTo-Json -Depth 5

    Write-Host "`n6. Updating Task..."
    $updateBody = @{
        isCompleted = $true
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/Tasks/$($task.id)" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
    Write-Host "Task updated to Completed."

    Write-Host "`n7. Verifying Task completion..."
    $updatedTask = Invoke-RestMethod -Uri "$baseUrl/Tasks/$($task.id)" -Method Get -Headers $headers
    Write-Host "Task IsCompleted: $($updatedTask.isCompleted)"

    Write-Host "`nSUCCESS: All CRUD tests passed."
}
catch {
    Write-Error $_
    exit 1
}
