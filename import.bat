@echo off
setlocal enabledelayedexpansion
TITLE DF Satellite - Database Restore Tool
echo ======================================================================
echo           📥 DF SATELLITE - DATABASE RESTORE TOOL
echo ======================================================================

set "INPUT_FILE=%~1"

:: If no file was passed as argument or drag-and-drop, look for default zip in backups or root
if "%INPUT_FILE%"=="" (
    if exist "Database\backups\DF_Satellite_DB_latest.zip" (
        set "INPUT_FILE=Database\backups\DF_Satellite_DB_latest.zip"
        echo  Found latest backup: Database\backups\DF_Satellite_DB_latest.zip
    ) else if exist "DF_Satellite_DB_latest.zip" (
        set "INPUT_FILE=DF_Satellite_DB_latest.zip"
        echo  Found latest backup: DF_Satellite_DB_latest.zip
    ) else if exist "Database\backups\*.zip" (
        for /f "delims=" %%F in ('dir /b /a:-d /o:-d "Database\backups\*.zip"') do (
            if not defined INPUT_FILE (
                set "INPUT_FILE=Database\backups\%%F"
                echo  Found backup archive: Database\backups\%%F
            )
        )
    )
)

:: If still no file, prompt user to enter path or drag and drop
if "%INPUT_FILE%"=="" (
    echo.
    echo  No backup archive automatically detected in project folder.
    set /p "INPUT_FILE= Enter path to backup file (.zip or .db) or drag-and-drop here: "
    set "INPUT_FILE=!INPUT_FILE:"=!"
)

if "%INPUT_FILE%"=="" (
    echo.
    echo [ERROR] No backup file provided.
    echo Usage:
    echo   1. Double-click import.bat when DF_Satellite_DB_latest.zip is in project root.
    echo   2. Drag-and-drop your backup .zip or .db onto import.bat.
    echo   3. Run: import.bat [path-to-backup-file]
    pause
    exit /b 1
)

if not exist "%INPUT_FILE%" (
    echo.
    echo [ERROR] Backup file not found: %INPUT_FILE%
    pause
    exit /b 1
)

echo.
echo  Restoring from: %INPUT_FILE%
echo  Target:         Database\data\satellite.db
echo ----------------------------------------------------------------------

:: Ensure .env exists
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    ) else (
        echo DATABASE_URL="file:../Database/data/satellite.db" > .env
        echo NEXTAUTH_SECRET="df-satellite-secret-key-2026" >> .env
        echo NEXTAUTH_URL="http://localhost:3001" >> .env
        echo PORT=3001 >> .env
        echo HOST="0.0.0.0" >> .env
    )
)

:: Ensure Database\data exists
if not exist "Database\data" mkdir "Database\data"

:: Backup current database if it exists
if exist "Database\data\satellite.db" (
    powershell -NoProfile -Command "$ts = Get-Date -Format 'yyyyMMdd_HHmmss'; Copy-Item 'Database\data\satellite.db' -Destination ('Database\data\satellite.db.bak_' + $ts) -Force; Write-Host (' ℹ️  Existing DB backed up to satellite.db.bak_' + $ts)"
)

:: Clear WAL and SHM journal files
if exist "Database\data\satellite.db-wal" del /f /q "Database\data\satellite.db-wal" >nul 2>&1
if exist "Database\data\satellite.db-shm" del /f /q "Database\data\satellite.db-shm" >nul 2>&1

:: Restore via PowerShell (supports direct .db file, zip with data/ prefix, or flat zip)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$src = '%INPUT_FILE%';" ^
    "if ($src -like '*.db') {" ^
    "    Copy-Item $src -Destination 'Database\data\satellite.db' -Force;" ^
    "} else {" ^
    "    $temp = Join-Path $env:TEMP ('df_restore_' + [System.Guid]::NewGuid().ToString());" ^
    "    Expand-Archive -Path $src -DestinationPath $temp -Force;" ^
    "    if (Test-Path (Join-Path $temp 'data\satellite.db')) {" ^
    "        Copy-Item (Join-Path $temp 'data\satellite.db') -Destination 'Database\data\satellite.db' -Force;" ^
    "    } elseif (Test-Path (Join-Path $temp 'satellite.db')) {" ^
    "        Copy-Item (Join-Path $temp 'satellite.db') -Destination 'Database\data\satellite.db' -Force;" ^
    "    } else {" ^
    "        $found = Get-ChildItem -Path $temp -Filter '*.db' -Recurse | Select-Object -First 1;" ^
    "        if ($found) {" ^
    "            Copy-Item $found.FullName -Destination 'Database\data\satellite.db' -Force;" ^
    "        } else {" ^
    "            Write-Error 'No database (.db) file found in archive.';" ^
    "            Remove-Item -Path $temp -Recurse -Force;" ^
    "            exit 1;" ^
    "        }" ^
    "    }" ^
    "    Remove-Item -Path $temp -Recurse -Force;" ^
    "}"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Restore failed. Please check the archive file.
    pause
    exit /b 1
)

echo ----------------------------------------------------------------------
echo  ✅ Database Restored Successfully!
echo  📍 Target: Database\data\satellite.db
echo ======================================================================
echo  💡 Next Steps:
echo  If the server is running, restart it to load the restored data:
echo    Double-click 'start.bat'
echo ======================================================================
echo.
pause
