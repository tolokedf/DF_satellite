@echo off
TITLE DF Satellite - Database Export
echo ======================================================================
echo           📦 DF Satellite - Database Export Tool
echo ======================================================================
powershell -Command "Compress-Archive -Path 'Database\data\*' -DestinationPath ('Database\backups\DF_Satellite_DB_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.zip') -Force"
echo Backup created in Database\backups\
pause
