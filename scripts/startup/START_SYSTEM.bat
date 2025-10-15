@echo off
echo Starting Smart Parking System...
echo ============================================================

cd /d "C:\Users\MD.ZAID SHAIKH\Projects\Car_Parking_Space_Detection"

echo.
echo [1/5] Starting Backend Service (Port 8000)...
start "Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul

echo [2/5] Starting Vision Service (Port 8001)...
start "Vision" cmd /k "cd vision && python vision_simulator.py"
timeout /t 2 /nobreak >nul

echo [3/5] Starting Aggregator Service (Port 8002)...
start "Aggregator" cmd /k "cd aggregator && python aggregator_simulator.py"
timeout /t 2 /nobreak >nul

echo [4/5] Starting ESP32 Gate Simulators (Ports 8100, 8101)...
start "ESP32 Gates" cmd /k "python esp32_simulator.py"
timeout /t 3 /nobreak >nul

echo [5/5] All services started!
echo.
echo ============================================================
echo  System is running on:
echo  - Backend:     http://localhost:8000
echo  - Vision:      http://localhost:8001
echo  - Aggregator:  http://localhost:8002
echo  - Entry Gate:  http://127.0.0.1:8100
echo  - Exit Gate:   http://127.0.0.1:8101
echo.
echo  Frontend:      http://localhost:3000
echo ============================================================
echo.
echo Waiting 10 seconds for services to initialize...
timeout /t 10 /nobreak >nul

echo.
echo Testing services...
curl -s http://localhost:8000/health >nul 2>&1 && echo [OK] Backend is running || echo [FAIL] Backend is not responding
curl -s http://localhost:8001/status >nul 2>&1 && echo [OK] Vision is running || echo [FAIL] Vision is not responding
curl -s http://localhost:8002/status >nul 2>&1 && echo [OK] Aggregator is running || echo [FAIL] Aggregator is not responding
curl -s http://127.0.0.1:8100/status >nul 2>&1 && echo [OK] Entry Gate is running || echo [FAIL] Entry Gate is not responding
curl -s http://127.0.0.1:8101/status >nul 2>&1 && echo [OK] Exit Gate is running || echo [FAIL] Exit Gate is not responding

echo.
echo ============================================================
echo  SYSTEM READY! Open http://localhost:3000 in your browser
echo ============================================================
echo.
pause
