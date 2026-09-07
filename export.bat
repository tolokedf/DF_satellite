@echo off
setlocal enabledelayedexpansion
TITLE DF Satellite - Database Export Tool
echo ======================================================================
echo           📦 DF SATELLITE - DATABASE EXPORT TOOL
echo ======================================================================

if not exist "Database\data\satellite.db" (
    echo [ERROR] Database file not found at Database\data\satellite.db
    pause
    exit /b 1
)

if not exist "Database\backups" mkdir "Database\backups"

echo  Source:      Database\data\satellite.db
echo  Destination: Database\backups\
echo ----------------------------------------------------------------------

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ts = Get-Date -Format 'yyyyMMdd_HHmmss';" ^
    "$zipName = 'DF_Satellite_DB_' + $ts + '.zip';" ^
    "$dest = Join-Path 'Database\backups' $zipName;" ^
    "Compress-Archive -Path 'Database\data' -DestinationPath $dest -Force;" ^
    "Copy-Item $dest -Destination 'DF_Satellite_DB_latest.zip' -Force;" ^
    "$size = (Get-Item $dest).Length / 1KB;" ^
    "$hash = (Get-FileHash $dest -Algorithm SHA256).Hash;" ^
    "Write-Host (' ✅ Export Complete! ' + [math]::Round($size, 1) + ' KB');" ^
    "Write-Host (' 🔒 SHA-256 Checksum: ' + $hash);" ^
    "Write-Host (' 💾 Backup Archive:   ' + $dest);" ^
    "Write-Host (' 📍 Quick USB Copy:   DF_Satellite_DB_latest.zip');" ^
    "Write-Host ('                      ' + $zipName);"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Export failed.
    pause
    exit /b 1
)

echo ----------------------------------------------------------------------
echo ======================================================================
echo  📋 How to Transfer to Windows Desktop:
echo  1. Copy 'DF_Satellite_DB_latest.zip' to your USB drive.
echo  2. On the deployment desktop, place it in the DF_satellite root folder.
echo  3. Double-click 'import.bat' (or drag and drop the zip onto import.bat).
echo ======================================================================
echo.
pause
