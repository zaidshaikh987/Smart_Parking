# RFID Smart Parking System - Complete Setup Guide

This guide will walk you through setting up the entire RFID Smart Parking System from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Setup](#mongodb-setup)
3. [MQTT Broker Setup](#mqtt-broker-setup)
4. [Backend Setup](#backend-setup)
5. [Vision Service Setup](#vision-service-setup)
6. [ESP32 Setup](#esp32-setup)
7. [Testing the System](#testing-the-system)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements
- **Python 3.9 or higher**
- **MongoDB** (Community Edition or Atlas)
- **MQTT Broker** (Mosquitto recommended)
- **Arduino IDE** or PlatformIO (for ESP32)
- **Git** (optional, for version control)

### Hardware Requirements (for full deployment)
- **Computer/Laptop** (for backend and vision services)
- **ESP32 DevKit** (for gate controller)
- **ESP32-CAM** (for video streaming)
- **MFRC522 RFID Reader Module**
- **Relay Module** (for gate control)
- **LEDs** (for status indicators)
- **Webcam or IP Camera** (alternative to ESP32-CAM)

### Python Packages
All required packages are listed in respective `requirements.txt` files.

---

## MongoDB Setup

### Option 1: Local MongoDB

#### Windows
1. **Download MongoDB**
   ```powershell
   # Visit: https://www.mongodb.com/try/download/community
   # Download MongoDB Community Server for Windows
   ```

2. **Install MongoDB**
   - Run the installer
   - Choose "Complete" installation
   - Install as Windows Service
   - Install MongoDB Compass (GUI tool)

3. **Verify Installation**
   ```powershell
   # Start MongoDB service
   net start MongoDB
   
   # Check if running
   mongo --version
   ```

4. **Configure Connection**
   - Edit `config/database.yaml`
   - Set `uri: "mongodb://localhost:27017"`

#### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb

# macOS (using Homebrew)
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Account**
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free tier

2. **Create Cluster**
   - Create a free M0 cluster
   - Choose a region close to you
   - Wait for cluster to deploy

3. **Configure Access**
   - Database Access → Add Database User
   - Network Access → Add IP Address (0.0.0.0/0 for testing)

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Update `config/database.yaml` with your URI

---

## MQTT Broker Setup

### Windows

1. **Download Mosquitto**
   ```powershell
   # Visit: https://mosquitto.org/download/
   # Download Windows installer
   ```

2. **Install Mosquitto**
   - Run installer
   - Add to PATH when prompted

3. **Start Broker**
   ```powershell
   # Start as service
   net start mosquitto
   
   # Or run manually
   mosquitto -v
   ```

4. **Test Connection**
   ```powershell
   # In one terminal - subscribe
   mosquitto_sub -h localhost -t test/topic
   
   # In another terminal - publish
   mosquitto_pub -h localhost -t test/topic -m "Hello"
   ```

### Linux
```bash
# Install
sudo apt-get install mosquitto mosquitto-clients

# Start service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test
mosquitto_sub -h localhost -t test/topic &
mosquitto_pub -h localhost -t test/topic -m "Hello"
```

### Configuration
- Edit `config/mqtt.yaml` with your broker details
- Default: `broker_host: localhost`, `broker_port: 1883`

---

## Backend Setup

### 1. Navigate to Backend Directory
```powershell
cd backend
```

### 2. Create Virtual Environment
```powershell
# Create venv
python -m venv venv

# Activate venv
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Configure Database
- Edit `config/database.yaml`
- Set MongoDB connection URI

### 5. Initialize Database
```powershell
# Run from project root
python scripts/setup_database.py
```

### 6. Start Backend Server
```powershell
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 7. Verify Backend
- Open browser: `http://localhost:8000`
- Check API docs: `http://localhost:8000/docs`
- Test health: `http://localhost:8000/health`

---

## Vision Service Setup

### 1. Navigate to Vision Directory
```powershell
cd vision
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Download YOLOv8 Model
```python
# The model downloads automatically on first run
# Or manually:
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
```

### 4. Configure Cameras
- Edit `vision/config/cameras.yaml`
- Set camera URLs (ESP32-CAM, RTSP, or video files)
- Define parking slot polygons

#### Example Camera Configuration
```yaml
cameras:
  - camera_id: "CAM_01"
    stream_url: "http://192.168.1.100:81/stream"
    detection_mode: "yolo"
    slots:
      - slot_id: "SLOT_A1"
        polygon:
          - [100, 200]
          - [300, 200]
          - [310, 400]
          - [90, 400]
```

### 5. Test Vision Service
```powershell
# Test with sample video
python src/vision_service.py --mode yolo --video test.mp4

# With live camera
python src/vision_service.py --mode yolo --camera 0
```

---

## ESP32 Setup

### ESP32 Gate Controller

#### 1. Hardware Connections
```
ESP32 Pin Connections:
- GPIO 25 → Relay Module IN
- GPIO 26 → Green LED (System OK)
- GPIO 27 → Red LED (Error)
- GPIO 14 → Blue LED (Gate Open)
- GPIO 21 → RFID SDA
- GPIO 22 → RFID RST
- GPIO 18 → RFID SCK
- GPIO 19 → RFID MISO
- GPIO 23 → RFID MOSI
- 3.3V → RFID VCC, LED (+) via resistors
- GND → Common Ground
```

#### 2. Install Arduino IDE
1. Download from [arduino.cc](https://www.arduino.cc/en/software)
2. Install ESP32 board support:
   - File → Preferences
   - Add to Additional Board Manager URLs:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager
   - Search "ESP32" and install

#### 3. Install Required Libraries
```
Tools → Manage Libraries → Search and Install:
- PubSubClient (by Nick O'Leary)
- ArduinoJson (by Benoit Blanchon)
- MFRC522 (by GithubCommunity)
```

#### 4. Configure Firmware
- Open `esp32/gate_controller/gate_controller.ino`
- Edit `config.h`:
  ```cpp
  #define WIFI_SSID "Your_WiFi_Name"
  #define WIFI_PASSWORD "Your_WiFi_Password"
  #define MQTT_SERVER "192.168.1.100"  // Your broker IP
  ```

#### 5. Upload Firmware
- Connect ESP32 via USB
- Tools → Board → ESP32 Dev Module
- Tools → Port → Select your ESP32 port
- Click Upload button

#### 6. Monitor Serial Output
- Tools → Serial Monitor
- Set baud rate to 115200
- Verify connection messages

### ESP32-CAM Setup

#### 1. Hardware Setup
- Connect FTDI programmer to ESP32-CAM
- GPIO 0 to GND for programming mode

#### 2. Upload Camera Firmware
- Use CameraWebServer example
- Configure WiFi credentials
- Set to highest resolution supported

#### 3. Get Stream URL
- After upload, disconnect GPIO 0
- Reset ESP32-CAM
- Check Serial Monitor for IP address
- Stream URL: `http://<ESP32_IP>:81/stream`

---

## Testing the System

### 1. Start All Services

#### Terminal 1: MQTT Broker
```powershell
mosquitto -v
```

#### Terminal 2: Backend
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Terminal 3: Vision Service
```powershell
cd vision
python src/vision_service.py --mode yolo
```

#### Terminal 4: Aggregator (coming in next section)
```powershell
cd aggregator
python aggregator_service.py
```

### 2. Create Test User
```powershell
# Using PowerShell
$body = @{
    rfid_id = "TEST123"
    user_name = "Test User"
    vehicle_no = "MH12AB1234"
    contact = "+919876543210"
    initial_balance = 1000
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/users" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### 3. Test Entry
```powershell
$body = @{
    rfid_id = "TEST123"
    camera_id = "CAM_01"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/entry" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### 4. Check System Status
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/status" | 
    Select-Object -ExpandProperty Content
```

### 5. Test Exit
```powershell
$body = @{
    rfid_id = "TEST123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/exit" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## Troubleshooting

### Backend Issues

#### "Database connection failed"
- Verify MongoDB is running: `net start MongoDB`
- Check connection string in `config/database.yaml`
- Test connection: `mongo` (should open MongoDB shell)

#### "Port 8000 already in use"
- Change port: `uvicorn app.main:app --port 8001`
- Or stop conflicting process

### Vision Service Issues

#### "Could not open video stream"
- Verify camera URL is correct
- Test URL in browser
- Check firewall settings

#### "YOLO model not found"
- Ensure internet connection (downloads on first run)
- Or manually download: https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt

#### "Low FPS / Slow detection"
- Reduce frame rate in `cameras.yaml`
- Use smaller YOLO model (yolov8n.pt)
- Set `use_gpu: false` if no CUDA

### MQTT Issues

#### "Connection refused"
- Check broker is running: `mosquitto -v`
- Verify port 1883 is open
- Test with: `mosquitto_sub -h localhost -t test`

#### "Messages not received"
- Check topic names match in config
- Verify QoS settings
- Check broker logs

### ESP32 Issues

#### "WiFi connection failed"
- Double-check SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength

#### "MQTT connection failed"
- Verify broker IP address
- Check firewall allows port 1883
- Ensure broker is running

#### "RFID not detected"
- Check wiring connections
- Verify RFID module voltage (3.3V)
- Test with Serial Monitor

---

## Next Steps

After successful setup:
1. Review [API Documentation](API_DOCUMENTATION.md)
2. Follow [Demo Workflow](DEMO_WORKFLOW.md)
3. Configure production settings
4. Set up monitoring and logging
5. Implement backup procedures

---

## Support

For issues and questions:
- Check documentation in `docs/` folder
- Review configuration files
- Check system logs
- Test individual components

**System is now ready for use!** 🎉
