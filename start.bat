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
echo  Port: 3001
echo  Database: Database\data\satellite.db
echo ======================================================================
npm run start
pause
