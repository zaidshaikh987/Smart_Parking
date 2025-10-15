@echo off
cls
color 0A
echo.
echo ============================================================
echo      SMART PARKING SYSTEM - COMPLETE STARTUP
echo ============================================================
echo.

cd /d "%~dp0"

echo [STEP 1/5] Starting Backend API (Port 8000)...
start "Backend API" cmd /k "title Backend API && color 0B && python quick_backend.py"
timeout /t 3 >nul

echo [STEP 2/5] Starting Vision Service (Port 8001)...
start "Vision Service" cmd /k "title Vision Service && color 0D && cd vision && python vision_simulator.py"
timeout /t 2 >nul

echo [STEP 3/5] Starting Aggregator (Port 8002)...
start "Aggregator" cmd /k "title Aggregator && color 0E && cd aggregator && python aggregator_simulator.py"
timeout /t 2 >nul

echo [STEP 4/5] Starting ESP32 Gate Simulators (Ports 8100-8101)...
start "ESP32 Gates" cmd /k "title ESP32 Gates && color 0C && python esp32_simulator.py"
timeout /t 2 >nul

echo [STEP 5/5] Starting React Frontend (Port 3000)...
start "React Frontend" cmd /k "title React Frontend && color 0A && cd frontend\client && npm start"
timeout /t 5 >nul

echo.
echo ============================================================
echo             ALL SERVICES LAUNCHING...
echo ============================================================
echo.
echo   Backend Services:
echo   - Backend API:  http://localhost:8000
echo   - Vision:       http://localhost:8001  
echo   - Aggregator:   http://localhost:8002
echo   - Entry Gate:   http://127.0.0.1:8100
echo   - Exit Gate:    http://127.0.0.1:8101
echo.
echo   Frontend:
echo   - React App:    http://localhost:3000
echo.
echo ============================================================
echo.
echo Waiting for frontend to compile (20 seconds)...
timeout /t 20 >nul

echo.
echo Opening browser to http://localhost:3000
start http://localhost:3000
echo.
echo ============================================================
echo            SYSTEM IS NOW RUNNING!
echo ============================================================
echo.
echo You should see:
echo  1. Five command windows running services
echo  2. Browser opening to http://localhost:3000
echo.
echo Go to System Monitor page to verify all services are online!
echo.
pause
