# Smart Parking System - Start All Services
Write-Host "🚗 Starting Smart Parking System..." -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Yellow

$baseDir = "C:\Users\MD.ZAID SHAIKH\Projects\Car_Parking_Space_Detection"

# Start Backend (Port 8000)
Write-Host "🔧 Starting Backend Service (Port 8000)..." -ForegroundColor Cyan
$backendCmd = "cd '$baseDir\backend'; python -m uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

# Start Vision Simulator (Port 8001)
Write-Host "📹 Starting Vision Service Simulator (Port 8001)..." -ForegroundColor Cyan
$visionCmd = "cd '$baseDir\vision'; python vision_simulator.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $visionCmd

Start-Sleep -Seconds 2

# Start Aggregator Simulator (Port 8002)
Write-Host "🔄 Starting Aggregator Service (Port 8002)..." -ForegroundColor Cyan
$aggregatorCmd = "cd '$baseDir\aggregator'; python aggregator_simulator.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $aggregatorCmd

Start-Sleep -Seconds 2

# Start ESP32 Gate Simulators (Ports 8100, 8101)
Write-Host "🚪 Starting ESP32 Gate Simulators (Ports 8100, 8101)..." -ForegroundColor Cyan
$gatesCmd = "cd '$baseDir'; python esp32_simulator.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $gatesCmd

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "="*60 -ForegroundColor Yellow
Write-Host "✅ ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "  🔧 Backend:     http://localhost:8000" -ForegroundColor White
Write-Host "  📹 Vision:      http://localhost:8001" -ForegroundColor White
Write-Host "  🔄 Aggregator:  http://localhost:8002" -ForegroundColor White
Write-Host "  🚪 Entry Gate:  http://127.0.0.1:8100" -ForegroundColor White
Write-Host "  🚪 Exit Gate:   http://127.0.0.1:8101" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Frontend is at: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏱️  Waiting 10 seconds for services to initialize..." -ForegroundColor Cyan

Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🧪 Testing Services..." -ForegroundColor Cyan
Write-Host ""

# Test Backend
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend:    ONLINE" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend:    OFFLINE" -ForegroundColor Red
}

# Test Vision
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/status" -Method Get -TimeoutSec 5
    Write-Host "✅ Vision:     ONLINE" -ForegroundColor Green
} catch {
    Write-Host "❌ Vision:     OFFLINE" -ForegroundColor Red
}

# Test Aggregator
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8002/status" -Method Get -TimeoutSec 5
    Write-Host "✅ Aggregator: ONLINE" -ForegroundColor Green
} catch {
    Write-Host "❌ Aggregator: OFFLINE" -ForegroundColor Red
}

# Test Entry Gate
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8100/status" -Method Get -TimeoutSec 5
    Write-Host "✅ Entry Gate: ONLINE" -ForegroundColor Green
} catch {
    Write-Host "❌ Entry Gate: OFFLINE" -ForegroundColor Red
}

# Test Exit Gate
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8101/status" -Method Get -TimeoutSec 5
    Write-Host "✅ Exit Gate:  ONLINE" -ForegroundColor Green
} catch {
    Write-Host "❌ Exit Gate:  OFFLINE" -ForegroundColor Red
}

Write-Host ""
Write-Host "="*60 -ForegroundColor Yellow
Write-Host "🎉 System Ready! Open http://localhost:3000 in your browser" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Yellow
Write-Host ""
Write-Host "Services are now running in separate windows."
Write-Host "This window can be closed."
