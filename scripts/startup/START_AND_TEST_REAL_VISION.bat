@echo off
title Real Vision Service - YOLOv8 + Testing
color 0A

echo ============================================================
echo STARTING REAL VISION SERVICE WITH YOLOV8
echo ============================================================
echo.
echo This will:
echo   1. Start the Real Vision Service (port 8005)
echo   2. Run automated tests
echo   3. Open the live video feed in browser
echo.
echo ============================================================
echo.

cd /d "%~dp0"

:: Start the service in a new window
echo Starting Real Vision Service...
start "Real Vision Service" cmd /k python vision\real_vision_webcam.py

:: Wait for service to initialize
echo Waiting for service to start...
timeout /t 5 /nobreak >nul

:: Run tests
echo.
echo Running automated tests...
python test_real_vision.py

:: Open browser to video feed
echo.
echo Opening live video feed in browser...
start http://localhost:8005/camera/CAM_01/frame

echo.
echo ============================================================
echo ✅ REAL VISION SERVICE IS RUNNING!
echo ============================================================
echo.
echo Service Window: Check the "Real Vision Service" window
echo Video Feed: http://localhost:8005/camera/CAM_01/frame
echo API: http://localhost:8005/status
echo.
echo Show car images or toys to your webcam to test detection!
echo.
echo Press any key to close this window...
pause >nul
