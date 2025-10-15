@echo off
title Real Vision Service - YOLOv8 Webcam
color 0A

echo ========================================
echo STARTING REAL VISION SERVICE
echo ========================================
echo.
echo Using YOLOv8 with Webcam
echo.
echo Service will be available at:
echo http://localhost:8005
echo.
echo Video feed:
echo http://localhost:8005/camera/CAM_01/frame
echo.
echo ========================================
echo.

cd /d "%~dp0"
python vision\real_vision_webcam.py

pause
