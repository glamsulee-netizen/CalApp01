# PowerShell script to run Caddy with local configuration
# Stop any existing Caddy process
Write-Host "Stopping any existing Caddy processes..."
Get-Process -Name "caddy" -ErrorAction SilentlyContinue | Stop-Process -Force

# Start Caddy with local configuration
Write-Host "Starting Caddy with local configuration..."
Start-Process -FilePath "caddy" -ArgumentList "run --config Caddyfile.local" -NoNewWindow

Write-Host "Caddy started with local configuration"
Write-Host "Frontend should be available at http://localhost/"
Write-Host "API should be proxied from http://localhost/api to http://localhost:3000"