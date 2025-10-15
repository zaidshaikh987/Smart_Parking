# 🛠️ Complete Setup Guide

**Step-by-step instructions to set up the entire smart parking system**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Vision Service Setup](#vision-service-setup)
5. [Aggregator Setup](#aggregator-setup)
6. [Frontend Setup](#frontend-setup)
7. [ESP32-CAM Setup](#esp32-cam-setup-optional)
8. [Running the System](#running-the-system)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software
```bash
# Python 3.8 or higher
python --version

# Node.js 16 or higher
node --version
npm --version

# PostgreSQL
psql --version

# Git
git --version
```

### Install Missing Dependencies

#### Windows
```powershell
# Install Chocolatey (if not installed)
# Then install packages:
choco install python nodejs postgresql git

# Install MQTT Broker
choco install mosquitto
```

#### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip nodejs npm postgresql mosquitto

# Mac
brew install python node postgresql mosquitto
```

---

## 2. Database Setup

### Create PostgreSQL Database

```bash
# Start PostgreSQL service
# Windows: Start services.msc → PostgreSQL service
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres
```

In PostgreSQL shell:
```sql
CREATE DATABASE parking_db;
CREATE USER parking_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE parking_db TO parking_user;
\q
```

---

## 3. Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3.2 Configure Environment

Create `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://parking_user:your_password@localhost/parking_db

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_PREFIX=/api/v1
PROJECT_NAME=Smart Parking API

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]

# Razorpay (optional - for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# MQTT
MQTT_BROKER=localhost
MQTT_PORT=1883
```

### 3.3 Run Database Migrations

```bash
cd backend
python -m alembic upgrade head
```

### 3.4 Create Admin User (Optional)

```bash
cd backend
python scripts/create_admin.py
```

Or manually via API after starting server.

### 3.5 Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Test:** Open http://localhost:8000/docs

---

## 4. Vision Service Setup

### 4.1 Install Dependencies

```bash
cd vision
pip install -r requirements.txt
```

Required packages:
- ultralytics (YOLOv8)
- opencv-python
- paho-mqtt
- fastapi
- uvicorn

### 4.2 Download YOLO Model

```bash
cd vision
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

This downloads the YOLOv8 nano model (~6MB).

### 4.3 Configure Cameras

Edit `vision/config/cameras.yaml`:

```yaml
cameras:
  CAM_01:
    name: "Main Parking Camera"
    stream_url: "0"  # Use 0 for webcam, or URL for ESP32-CAM
    detection_type: "yolo"
    fps: 10
    resolution: [640, 480]
    zones:
      - zone_id: "SLOT_A1"
        coordinates: [[100, 100], [300, 100], [300, 250], [100, 250]]
      - zone_id: "SLOT_A2"
        coordinates: [[320, 100], [520, 100], [520, 250], [320, 250]]
```

**For ESP32-CAM:**
```yaml
stream_url: "http://192.168.1.105/stream"  # Replace with your ESP32 IP
```

### 4.4 Start Vision Service

```bash
cd vision
python src/vision_service.py
```

**Test:** Open http://localhost:8001/camera/CAM_01/frame

---

## 5. Aggregator Setup

### 5.1 Install Dependencies

```bash
cd aggregator
pip install paho-mqtt requests pyyaml
```

### 5.2 Configure Aggregator

Edit `aggregator/config.yaml`:

```yaml
mqtt:
  broker: "localhost"
  port: 1883
  topics:
    slot_updates: "parking/slots/+"
    rfid_scans: "parking/rfid/scans"
    gate_control: "parking/gate/control"

backend:
  api_url: "http://localhost:8000/api/v1"
  
system:
  poll_interval: 5  # seconds
  retry_attempts: 3
```

### 5.3 Start Aggregator

```bash
cd aggregator
python aggregator_service.py
```

---

## 6. Frontend Setup

### 6.1 Install Node Dependencies

```bash
cd frontend
npm install

cd client
npm install
```

### 6.2 Configure Environment

Create `frontend/client/.env`:

```env
# API Endpoints
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001

# Razorpay
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id

# System
REACT_APP_BACKEND_API=http://localhost:8000/api/v1
REACT_APP_VISION_API=http://localhost:8001
REACT_APP_AGGREGATOR_API=http://localhost:5000
```

### 6.3 Start Frontend Services

**Terminal 1 - React App:**
```bash
cd frontend/client
npm start
```

**Terminal 2 - Node.js Backend:**
```bash
cd frontend
node server/server.js
```

**Access:** http://localhost:3000

**Default Login:**
- Email: `admin@parking.com`
- Password: `admin123`

---

## 7. ESP32-CAM Setup (Optional)

### 7.1 Hardware Requirements
- ESP32-CAM module
- FTDI programmer (for uploading firmware)
- 5V power supply
- Jumper wires

### 7.2 Software Requirements
- Arduino IDE
- ESP32 board support

### 7.3 Quick Setup

1. **Install Arduino IDE**: https://www.arduino.cc/en/software

2. **Add ESP32 Board Support**:
   - File → Preferences
   - Add URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

3. **Wire ESP32-CAM**:
   ```
   FTDI 5V  → ESP32-CAM 5V
   FTDI GND → ESP32-CAM GND
   FTDI TX  → ESP32-CAM U0R
   FTDI RX  → ESP32-CAM U0T
   GPIO 0   → GND (for programming only)
   ```

4. **Update WiFi credentials** in `esp32_firmware/camera_stream/camera_stream.ino`:
   ```cpp
   const char* ssid = "YourWiFi";
   const char* password = "YourPassword";
   ```

5. **Upload firmware**:
   - Open `.ino` file in Arduino IDE
   - Select: AI Thinker ESP32-CAM
   - Upload

6. **Get IP address**:
   - Disconnect GPIO 0 from GND
   - Press RST button
   - Open Serial Monitor (115200 baud)
   - Note IP address

7. **Update vision config** with ESP32-CAM IP

**Detailed guide:** See `esp32_firmware/ESP32_GUIDE.md`

---

## 8. Running the System

### Start All Services

**Option 1: Manual (Recommended for development)**

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Vision Service
cd vision
python src/vision_service.py

# Terminal 3: Aggregator
cd aggregator
python aggregator_service.py

# Terminal 4: Frontend React
cd frontend/client
npm start

# Terminal 5: Frontend Node Server
cd frontend
node server/server.js

# Terminal 6: MQTT Broker (if not running as service)
mosquitto -v
```

**Option 2: Using Scripts** (Create your own startup script)

Windows (`start_all.bat`):
```batch
@echo off
start cmd /k "cd backend && uvicorn app.main:app --reload"
start cmd /k "cd vision && python src/vision_service.py"
start cmd /k "cd aggregator && python aggregator_service.py"
start cmd /k "cd frontend\client && npm start"
start cmd /k "cd frontend && node server/server.js"
```

Linux/Mac (`start_all.sh`):
```bash
#!/bin/bash
cd backend && uvicorn app.main:app --reload &
cd vision && python src/vision_service.py &
cd aggregator && python aggregator_service.py &
cd frontend/client && npm start &
cd frontend && node server/server.js &
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Admin dashboard |
| Backend API | http://localhost:8000 | REST API |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Vision Service | http://localhost:8001 | Computer vision API |
| Camera Feed | http://localhost:8001/camera/CAM_01/frame | Live camera stream |
| Node Server | http://localhost:3001 | Frontend proxy |

---

## 9. Troubleshooting

### Backend Issues

**Database connection error:**
```bash
# Check PostgreSQL is running
# Windows: services.msc
# Linux: sudo systemctl status postgresql

# Test connection
psql -U parking_user -d parking_db
```

**Port already in use:**
```bash
# Find and kill process on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux:
lsof -i :8000
kill -9 <PID>
```

### Vision Service Issues

**Camera not found:**
- Check if webcam is connected
- Try different camera index (0, 1, 2)
- For ESP32-CAM, verify IP address and stream URL

**YOLO model not found:**
```bash
cd vision
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

**Low FPS:**
- Reduce resolution in camera config
- Use YOLOv8n (nano) instead of larger models
- Close other applications using camera

### Frontend Issues

**npm install fails:**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Port 3000 already in use:**
```bash
# Change port
set PORT=3002 && npm start  # Windows
PORT=3002 npm start         # Linux/Mac
```

**API connection refused:**
- Verify backend is running
- Check CORS settings in backend
- Check firewall settings

### MQTT Issues

**Connection refused:**
```bash
# Check Mosquitto is running
# Windows: services.msc → Mosquitto Broker
# Linux: sudo systemctl status mosquitto

# Start manually
mosquitto -v
```

**Messages not received:**
- Check topic names match in config
- Test with MQTT client:
  ```bash
  mosquitto_sub -t "parking/#" -v
  ```

### ESP32-CAM Issues

**Upload fails:**
- Ensure GPIO 0 connected to GND
- Press RST when "Connecting..." appears
- Check TX/RX not swapped

**No WiFi connection:**
- Verify SSID/password
- Use 2.4GHz WiFi (not 5GHz)
- Check Serial Monitor for errors

**Stream not loading:**
- Use external 5V power supply
- Check firewall
- Verify same network

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend API responds at http://localhost:8000/docs
- [ ] Database migrations successful
- [ ] Vision service shows camera feed
- [ ] MQTT broker running
- [ ] Aggregator connecting to MQTT
- [ ] Frontend loads at http://localhost:3000
- [ ] Can login to dashboard
- [ ] Real-time updates working
- [ ] (Optional) ESP32-CAM streaming

---

## 🚀 Next Steps

1. **Configure parking zones** in `vision/config/cameras.yaml`
2. **Register RFID users** via frontend dashboard
3. **Set up payment gateway** (add Razorpay keys)
4. **Deploy ESP32-CAM** for live video
5. **Test complete flow**: RFID entry → Detection → Session → Exit → Payment

---

## 📚 Additional Resources

- **Frontend Guide**: `frontend/FRONTEND_GUIDE.md`
- **ESP32-CAM Guide**: `esp32_firmware/ESP32_GUIDE.md`
- **API Documentation**: http://localhost:8000/docs
- **Project Overview**: `README.md`

---

**Need Help?** Open an issue or contact the maintainer.
