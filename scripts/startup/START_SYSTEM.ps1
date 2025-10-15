# Smart Parking System - Startup Script
# Run this to start the entire system

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "      RFID Smart Parking System - Startup Script          " -ForegroundColor Cyan  
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "[1/4] Checking MongoDB..." -ForegroundColor Yellow
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -eq 'Running') {
    Write-Host "✓ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "✗ MongoDB not running. Starting..." -ForegroundColor Red
    Start-Service MongoDB -ErrorAction SilentlyContinue
}

# Check if Mosquitto is running
Write-Host "[2/4] Checking MQTT Broker..." -ForegroundColor Yellow
$mosqProcess = Get-Process mosquitto -ErrorAction SilentlyContinue
if ($mosqProcess) {
    Write-Host "✓ Mosquitto MQTT broker is running" -ForegroundColor Green
} else {
    Write-Host "! Mosquitto not running. Please start it manually:" -ForegroundColor Yellow
    Write-Host "  mosquitto -v" -ForegroundColor White
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "Starting services in separate windows..." -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Start Python Backend
Write-Host "[3/4] Starting Python Backend (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Python FastAPI Backend' -ForegroundColor Green; uvicorn app.main:app --reload --port 8000"
Start-Sleep -Seconds 2

# Start React Frontend  
Write-Host "[4/4] Starting React Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend\client'; Write-Host 'React Frontend' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "             System Started Successfully!                   " -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Optional Services (run manually if needed):" -ForegroundColor Yellow
Write-Host "  Vision:    cd vision && python src/vision_service.py" -ForegroundColor White
Write-Host "  Aggregator: cd aggregator && python aggregator_service.py" -ForegroundColor White
Write-Host "  Node.js:   cd frontend/server && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
