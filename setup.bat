@echo off
setlocal enabledelayedexpansion
TITLE DF Satellite - Windows Setup Tool
echo ======================================================================
echo           ⚙️  DF SATELLITE — WINDOWS SERVER SETUP TOOL
echo ======================================================================
echo  This script will prepare DF Satellite on this Windows server:
echo   1. Install Node.js dependencies (npm install)
echo   2. Verify environment configuration (.env)
echo   3. Generate Prisma client types
echo   4. Initialize/verify SQLite database
echo   5. Compile production build (npm run build)
echo ======================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js 18 or 20 LTS from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Check .env file
echo [1/5] Verifying environment configuration (.env)...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo       Created .env from .env.example
    ) else (
        echo DATABASE_URL="file:../Database/data/satellite.db" > .env
        echo NEXTAUTH_SECRET="df-satellite-secret-key-2026" >> .env
        echo NEXTAUTH_URL="http://localhost:3001" >> .env
        echo PORT=3001 >> .env
        echo HOST="0.0.0.0" >> .env
        echo       Generated default .env configuration
    )
) else (
    echo       .env configuration file found.
)

:: 3. Install dependencies
echo.
echo [2/5] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies.
    pause
    exit /b %errorlevel%
)

:: 4. Generate Prisma Client
echo.
echo [3/5] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client.
    pause
    exit /b %errorlevel%
)

:: 5. Database check
echo.
echo [4/5] Checking database status...
if not exist "Database\data" mkdir "Database\data"

if not exist "Database\data\satellite.db" (
    if exist "DF_Satellite_DB_latest.zip" (
        echo       Found DF_Satellite_DB_latest.zip, restoring database...
        call import.bat DF_Satellite_DB_latest.zip
    ) else if exist "Database\backups\DF_Satellite_DB_latest.zip" (
        echo       Found Database\backups\DF_Satellite_DB_latest.zip, restoring database...
        call import.bat Database\backups\DF_Satellite_DB_latest.zip
    ) else (
        echo       No existing database or backup archive detected.
        echo       Initializing new database schema and initial seed data...
        call npx prisma db push
        call npm run prisma:seed
    )
) else (
    echo       Existing database verified at Database\data\satellite.db
)

:: 6. Production Build
echo.
echo [5/5] Compiling production build (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Production build failed. Please inspect the errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo ======================================================================
echo  ✅ Setup Complete! DF Satellite is ready for deployment.
echo ======================================================================
echo  To start the server:
echo    - Double-click 'start.bat' (runs on http://localhost:3001 or LAN IP)
echo.
echo  To stop the server:
echo    - Double-click 'stop.bat'
echo ======================================================================
echo.
pause
