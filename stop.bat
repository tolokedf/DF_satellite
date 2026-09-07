@echo off
TITLE DF Satellite - Stop Server
echo ======================================================================
echo           🛑 DF SATELLITE — STOPPING SERVER
echo ======================================================================
echo Stopping any running instance on port 3001...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$conns = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue;" ^
    "if ($conns) {" ^
    "    $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue };" ^
    "    Write-Host '  Stopped server process on port 3001.' -ForegroundColor Green;" ^
    "} else {" ^
    "    Write-Host '  No active server process found on port 3001.' -ForegroundColor Yellow;" ^
    "}"

echo ======================================================================
echo  Server stopped.
echo ======================================================================
timeout /t 2 >nul
