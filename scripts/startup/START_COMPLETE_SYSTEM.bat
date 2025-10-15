@echo off
title Smart Parking - Complete System
color 0B

echo ============================================================
echo    SMART PARKING SYSTEM - COMPLETE STARTUP
echo ============================================================
echo.
echo Starting ALL services including Real Vision...
echo.
echo Services that will start:
echo   [1] Backend API (port 8000)
echo   [2] Simulated Vision (port 8001)
echo   [3] Real YOLOv8 Vision (port 8005)
echo   [4] Aggregator (port 8002)
echo   [5] ESP32 Entry Simulator (port 8100)
echo   [6] ESP32 Exit Simulator (port 8101)
echo   [7] React Frontend (port 3000)
echo.
echo ============================================================
pause

cd /d "%~dp0"

:: Start Backend
echo.
echo [1/7] Starting Backend API...
start "Backend API" cmd /k "python quick_backend.py"
timeout /t 3 /nobreak >nul

:: Start Simulated Vision
echo [2/7] Starting Simulated Vision Service...
start "Vision Service (Simulated)" cmd /k "cd vision && python vision_simulator.py"
timeout /t 2 /nobreak >nul

:: Start Real Vision
echo [3/7] Starting Real YOLOv8 Vision Service...
start "Vision Service (Real YOLOv8)" cmd /k "python vision\real_vision_webcam.py"
timeout /t 3 /nobreak >nul

:: Start Aggregator
echo [4/7] Starting Aggregator Service...
start "Aggregator Service" cmd /k "cd aggregator && python aggregator_simulator.py"
timeout /t 2 /nobreak >nul

:: Start ESP32 Simulators (combined)
echo [5/7] Starting ESP32 Gate Simulators...
start "ESP32 Gates" cmd /k "python esp32_simulator.py"
timeout /t 2 /nobreak >nul

:: Start Frontend
echo [6/6] Starting React Frontend...
cd frontend\client
start "React Frontend" cmd /k "npm start"
cd ..\..

echo.
echo ============================================================
echo.
echo ✅ ALL SERVICES STARTED SUCCESSFULLY!
echo.
echo ============================================================
echo.
echo Services are running on:
echo   • Backend:           http://localhost:8000
echo   • Simulated Vision:  http://localhost:8001
echo   • Real Vision:       http://localhost:8005
echo   • Aggregator:        http://localhost:8002
echo   • ESP32 Entry:       http://localhost:8100
echo   • ESP32 Exit:        http://localhost:8101
echo   • Frontend:          http://localhost:3000
echo.
echo ============================================================
echo.
echo 🎨 NEW FEATURES IN FRONTEND:
echo.
echo   1. 📹 Real Vision Feed (/vision)
echo      - Toggle between Simulated and Real YOLOv8
echo      - Live video streams with detection
echo      - Real-time slot status
echo.
echo   2. 🔄 System Flow (/flow)
echo      - Interactive 9-step workflow
echo      - Auto-play animation
echo      - Detailed technology breakdown
echo.
echo ============================================================
echo.
echo Waiting 15 seconds for frontend to compile...
timeout /t 15 /nobreak

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ============================================================
echo.
echo 🚀 System is ready! Navigate to:
echo.
echo   Dashboard → 📹 Real Vision Feed
echo   Dashboard → 🔄 System Flow
echo.
echo Press any key to close this window (services will keep running)
pause >nul
