@echo off
cd /d "%~dp0"
title SonicWave YouTube to MP3 Converter Launcher

echo ===================================================
echo     Starting SonicWave YouTube to MP3 Converter
echo ===================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is required to run SonicWave on Windows.
    echo Please install Node.js LTS version from https://nodejs.org/
    echo.
    echo Once installed, double-click start.bat again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found in your system PATH.
    echo Please make sure Node.js and npm are properly installed.
    echo.
    pause
    exit /b 1
)

set "BACKEND_DEPS=0"
if exist "server\node_modules\" set "BACKEND_DEPS=1"
if exist "node_modules\" set "BACKEND_DEPS=1"
if "%BACKEND_DEPS%"=="0" (
    echo [Setup] Installing backend dependencies...
    cd /d "%~dp0server"
    call npm install
    cd /d "%~dp0"
)

:: Standalone Packaged Distribution: use pre-compiled client/dist on port 3001 directly
if exist "client\dist\index.html" (
    if not exist "client\node_modules\" (
        echo [Mode] Standalone Desktop Package detected.
        echo Starting SonicWave Engine on Port 3001...
        start "SonicWave Backend (Port 3001)" cmd /k "cd /d ""%~dp0server"" && npm start"
        echo.
        echo ===================================================
        echo   SonicWave Converter Studio is launching!
        echo   Opening Converter Studio: http://localhost:3001/#app
        echo ===================================================
        echo.
        ping 127.0.0.1 -n 4 >nul
        start http://localhost:3001/#app
        exit /b 0
    )
)

if not exist "client\node_modules\" (
    echo [Setup] Installing frontend dependencies...
    cd /d "%~dp0client"
    call npm install
    cd /d "%~dp0"
)

echo Starting Backend API Server on Port 3001...
start "SonicWave Backend (Port 3001)" cmd /k "cd /d ""%~dp0server"" && npm start"

echo Starting Frontend Web App on Port 5173...
start "SonicWave Frontend (Port 5173)" cmd /k "cd /d ""%~dp0client"" && npm run dev"

echo.
echo ===================================================
echo   Both services are launching!
echo   Opening SonicWave Website: http://localhost:5173
echo ===================================================
echo.

ping 127.0.0.1 -n 4 >nul
start http://localhost:5173
