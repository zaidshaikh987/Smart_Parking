@echo off
echo Starting Smart Parking System...
echo.
echo Starting Backend...
start cmd /k "cd backend && uvicorn app.main:app --reload"
timeout /t 3 /nobreak >nul

echo Starting Vision Service...
start cmd /k "cd vision && python src/vision_service.py"
timeout /t 3 /nobreak >nul

echo Starting Aggregator...
start cmd /k "cd aggregator && python aggregator_service.py"
timeout /t 3 /nobreak >nul

echo Starting Frontend Node Server...
start cmd /k "cd frontend && node server/server.js"
timeout /t 3 /nobreak >nul

echo Starting Frontend React App...
start cmd /k "cd frontend\client && npm start"

echo.
echo All services started!
echo Access dashboard at: http://localhost:3000
pause
