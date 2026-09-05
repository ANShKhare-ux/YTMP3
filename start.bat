@echo off
echo ===================================================
echo     Starting SonicWave YouTube to MP3 Converter
echo ===================================================
echo.
echo Starting Backend API Server (Port 3001)...
start "SonicWave Backend" cmd /k "cd server && npm.cmd start"

echo Starting Frontend Web App (Port 5173)...
start "SonicWave Frontend" cmd /k "cd client && npm.cmd run dev"

echo.
echo Both services are launching!
echo Browser UI: http://localhost:5173
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
