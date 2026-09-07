@echo off
TITLE DF Satellite - Field Deployment Management
echo ======================================================================
echo           🚀 DF SATELLITE — FIELD DEPLOYMENT SUITE
echo ======================================================================
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
:: Auto-generate Prisma client if missing
if not exist "node_modules\@prisma\client" (
    echo  Generating Prisma Client...
    call npx prisma generate
)

:: Auto-build if production build is missing
if not exist ".next" (
    echo  No production build found. Building application...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed. Please run 'npm run build' manually to inspect errors.
        pause
        exit /b %errorlevel%
    )
)

echo  Port: 3001
echo  Database: Database\data\satellite.db
echo ======================================================================
call npm run start
pause
