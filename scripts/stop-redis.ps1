# Остановка Redis сервера
# Использование: .\scripts\stop-redis.ps1

$processes = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue

if ($processes) {
    Write-Host "Остановка Redis сервера..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Write-Host "✓ Redis остановлен" -ForegroundColor Green
} else {
    Write-Host "Redis сервер не запущен" -ForegroundColor Gray
}
