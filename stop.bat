@echo off
TITLE DF Satellite - Stop Server
echo ======================================================================
echo           🛑 DF SATELLITE — STOPPING SERVER
echo ======================================================================
echo Stopping any running instance on port 3001...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ports = @(3001, 3000);" ^
    "foreach ($p in $ports) {" ^
    "    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue;" ^
    "    if ($conns) {" ^
    "        $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue };" ^
    "        Write-Host ('  Stopped server process on port ' + $p + '.') -ForegroundColor Green;" ^
    "    }" ^
    "}"

echo ======================================================================
echo  Server stopped.
echo ======================================================================
timeout /t 2 >nul
