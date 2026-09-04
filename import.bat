@echo off
TITLE DF Satellite - Database Import
echo ======================================================================
echo           📥 DF Satellite - Database Restore Tool
echo ======================================================================
if "%~1"=="" (
  echo Please drag and drop a backup zip file onto this script.
  pause
  exit /b
)
powershell -Command "Expand-Archive -Path '%~1' -DestinationPath 'Database' -Force"
echo Database restored from %~1!
pause
