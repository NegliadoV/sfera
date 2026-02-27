# Stop Redis process on port 6379
# Usage: Run PowerShell as Administrator, then: .\scripts\stop-redis-port.ps1

Write-Host "Stopping Redis on port 6379..." -ForegroundColor Yellow

# Find process using port 6379
$listening = netstat -ano | findstr ":6379" | findstr "LISTENING"
if (-not $listening) {
    Write-Host "Port 6379 is already free" -ForegroundColor Green
    exit 0
}

# Extract PID from netstat output
$pidValue = $null
foreach ($line in $listening) {
    if ($line -match '\s+(\d+)$') {
        $pidValue = [int]$matches[1]
        break
    }
}

if (-not $pidValue) {
    Write-Host "Could not find process ID" -ForegroundColor Red
    exit 1
}

Write-Host "Found process PID: $pidValue" -ForegroundColor Cyan

# Try to stop the process
$proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Stopping: $($proc.ProcessName) (PID: $pidValue)" -ForegroundColor Yellow
    try {
        Stop-Process -Id $pidValue -Force
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Failed to stop process. Trying taskkill..." -ForegroundColor Yellow
        taskkill /F /PID $pidValue 2>&1 | Out-Null
        Start-Sleep -Seconds 2
    }
}

# Check if port is free
$stillListening = netstat -ano | findstr ":6379" | findstr "LISTENING"
if ($stillListening) {
    Write-Host "Port 6379 is still in use!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Write-Host "Or stop Redis manually:" -ForegroundColor Yellow
    Write-Host "1. Open Services (services.msc)" -ForegroundColor White
    Write-Host "2. Find Redis service and stop it" -ForegroundColor White
    Write-Host "3. Or use Task Manager to end process PID $pidValue" -ForegroundColor White
    exit 1
} else {
    Write-Host "Port 6379 is now free!" -ForegroundColor Green
    Write-Host "You can now install Memurai Developer" -ForegroundColor Cyan
    exit 0
}
