@echo off
cls
echo ============================================================
echo          SMART PARKING SYSTEM - STARTING ALL SERVICES
echo ============================================================
echo.

cd /d "%~dp0"

echo [1] Starting Backend (Port 8000)...
start "Backend" cmd /k "python quick_backend.py"
timeout /t 3 >nul

echo [2] Starting Vision (Port 8001)...
start "Vision" cmd /k "cd vision && python vision_simulator.py"
timeout /t 2 >nul

echo [3] Starting Aggregator (Port 8002)...
start "Aggregator" cmd /k "cd aggregator && python aggregator_simulator.py"
timeout /t 2 >nul

echo [4] Starting ESP32 Gates (Ports 8100-8101)...
start "ESP32" cmd /k "python esp32_simulator.py"
timeout /t 3 >nul

echo.
echo ============================================================
echo ALL SERVICES STARTED!
echo ============================================================
echo Backend:     http://localhost:8000
echo Vision:      http://localhost:8001
echo Aggregator:  http://localhost:8002
echo Entry Gate:  http://127.0.0.1:8100
echo Exit Gate:   http://127.0.0.1:8101
echo.
echo Frontend:    http://localhost:3000
echo ============================================================
echo.
echo Opening System Monitor in browser in 10 seconds...
timeout /t 10 >nul
start http://localhost:3000/system
echo.
echo Done! Check the System Monitor page.
pause
