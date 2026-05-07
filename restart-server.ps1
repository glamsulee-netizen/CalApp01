# PowerShell script to restart the server container with fixes
Write-Host "Restarting server container to apply CORS and cookies fixes..."
Write-Host ""

# Check if Docker Compose is running
Write-Host "Checking Docker Compose status..."
docker-compose ps

Write-Host ""
Write-Host "Restarting server container..."
docker-compose restart server

Write-Host ""
Write-Host "Waiting for server to start..."
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Checking server logs..."
docker-compose logs server --tail=20

Write-Host ""
Write-Host "Server restarted with the following fixes:"
Write-Host "1. CORS origin now includes 'http://localhost'"
Write-Host "2. Cookie settings fixed for localhost (secure: false, sameSite: 'strict')"
Write-Host "3. RegisterPage now properly handles registration success/errors"
Write-Host "4. AuthStore register function now returns user data"
Write-Host ""
Write-Host "Test registration at: http://localhost/register"