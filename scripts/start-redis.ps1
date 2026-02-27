# Start Redis/Memurai for Horizon project
Write-Host "Checking Redis/Memurai..." -ForegroundColor Cyan

# Check if Redis is already running
$testResult = & redis-cli ping 2>&1
if ($LASTEXITCODE -eq 0 -and $testResult -eq "PONG") {
    Write-Host "Redis is already running" -ForegroundColor Green
    exit 0
}

# Try Memurai service (имя службы может быть Memurai или MemuraiDeveloper)
$memuraiService = Get-Service -Name "Memurai" -ErrorAction SilentlyContinue
if (-not $memuraiService) { $memuraiService = Get-Service -Name "MemuraiDeveloper" -ErrorAction SilentlyContinue }
if ($memuraiService) {
    if ($memuraiService.Status -eq "Stopped") {
        Write-Host "Starting Memurai service..." -ForegroundColor Yellow
        Start-Service -Name $memuraiService.Name
        Start-Sleep -Seconds 2
    }
    $testResult = & redis-cli ping 2>&1
    if ($LASTEXITCODE -eq 0 -and $testResult -eq "PONG") {
        Write-Host "Memurai started successfully" -ForegroundColor Green
        exit 0
    }
}

# Check old Redis
$redisPath = "C:\Program Files\Redis\redis-server.exe"
if (Test-Path $redisPath) {
    Write-Host "Found old Redis 3.x - not compatible with BullMQ" -ForegroundColor Yellow
    Write-Host "Install Memurai Developer - see docs/REDIS_SETUP.md" -ForegroundColor Yellow
}

Write-Host "Redis not found or not running" -ForegroundColor Red
Write-Host "Install Memurai Developer - see docs/REDIS_SETUP.md" -ForegroundColor Yellow
exit 1