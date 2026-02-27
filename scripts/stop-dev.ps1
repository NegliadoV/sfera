# Stop Next.js dev server (processes using port 3000 or 3001 and node running next)
$ports = @(3000, 3001)
foreach ($port in $ports) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  if ($conn) {
    $pid = $conn.OwningProcess | Select-Object -First 1
    if ($pid) {
      Write-Host "Stopping process $pid (port $port)..."
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  }
}
# Remove lock so next 'npm run dev' can start
$lockPath = Join-Path $PSScriptRoot "..\.next\dev\lock"
if (Test-Path $lockPath) {
  Remove-Item $lockPath -Force
  Write-Host "Removed .next/dev/lock"
}
Write-Host "Done. Run: npm run dev"
