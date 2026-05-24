@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
if errorlevel 1 exit /b 1
echo.
echo Starting Tetris at http://localhost:3001
echo.
npm start
