# Создание пользователя horizon и БД horizon для запуска без Docker.
# Запуск: в PowerShell из корня проекта: .\scripts\setup-local-db.ps1
# Нужен пароль пользователя postgres (задаётся при установке PostgreSQL).

$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psql)) {
    Write-Host "Не найден psql. Установите PostgreSQL 16 (winget install PostgreSQL.PostgreSQL.16)." -ForegroundColor Red
    exit 1
}

Write-Host "Пробую подключиться без пароля..."
$testResult = & $psql -U postgres -h localhost -p 5432 -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Подключение без пароля успешно!" -ForegroundColor Green
    $needPassword = $false
} else {
    Write-Host "Требуется пароль пользователя postgres." -ForegroundColor Yellow
    $pass = Read-Host "Введите пароль (или Enter для пустого)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass)
    $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    if ($plainPass) {
        $env:PGPASSWORD = $plainPass
    }
    $needPassword = $true
}

Write-Host "Создаю пользователя horizon..."
& $psql -U postgres -h localhost -p 5432 -c "CREATE USER horizon WITH PASSWORD 'horizon_dev';" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "Пользователь horizon уже существует или ошибка — продолжаю." }

Write-Host "Создаю базу данных horizon..."
& $psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE horizon OWNER horizon;" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "БД horizon уже существует или ошибка." }

if ($needPassword) {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
Write-Host "Готово. Дальше выполните: npm run db:push  и  npm run db:seed" -ForegroundColor Green
