# ESP32-CAM Integration Guide for Smart Parking System

## 📋 What You Need

### Hardware
1. **ESP32-CAM** module (AI-Thinker model recommended)
2. **FTDI Programmer** or **USB-to-TTL adapter** (for initial firmware upload)
3. **Jumper wires** (female-to-female)
4. **5V Power supply** (for stable operation - can use USB or external adapter)
5. **Camera module** (usually comes with ESP32-CAM)

### Software
1. **Arduino IDE** (v1.8.x or v2.x)
2. **ESP32 Board Support** for Arduino
3. **USB Drivers** for FTDI/CH340 (depending on your programmer)

---

## 🔧 Step 1: Install Arduino IDE and ESP32 Support

### 1.1 Download Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install for Windows

### 1.2 Add ESP32 Board Manager
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to **Tools → Board → Boards Manager**
6. Search for **"ESP32"**
7. Install **"esp32 by Espressif Systems"** (latest version)

---

## 🔌 Step 2: Wire ESP32-CAM to Programmer

### Connection Diagram (FTDI to ESP32-CAM)

| FTDI Programmer | ESP32-CAM      |
|-----------------|----------------|
| 5V              | 5V             |
| GND             | GND            |
| TX              | U0R (RX)       |
| RX              | U0T (TX)       |

### Important:
- **GPIO 0 → GND** (for programming mode - connect this temporarily)
- Remove GPIO 0 to GND connection after uploading code

---

## 💾 Step 3: Upload Firmware to ESP32-CAM

### 3.1 Open the Sketch
1. In Arduino IDE, open the file:
   ```
   esp32_firmware/camera_stream/camera_stream.ino
   ```

### 3.2 Configure WiFi Credentials
Edit lines 19-20 in the sketch:
```cpp
const char* ssid = "YOUR_WIFI_SSID";        // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password
```

### 3.3 Select Board and Port
1. **Tools → Board → ESP32 Arduino → AI Thinker ESP32-CAM**
2. **Tools → Port → COM3** (or whatever port your FTDI appears as)

### 3.4 Configure Upload Settings
- **Upload Speed**: 115200
- **Flash Frequency**: 80MHz
- **Flash Mode**: QIO
- **Partition Scheme**: Huge APP (3MB No OTA/1MB SPIFFS)

### 3.5 Upload
1. Press and hold the **RST button** on ESP32-CAM
2. Click **Upload** in Arduino IDE
3. Wait for "Connecting..." message
4. Release RST button
5. Wait for upload to complete (~30-60 seconds)

### 3.6 Test the Camera
1. **Disconnect GPIO 0 from GND**
2. Press **RST button** to restart
3. Open **Tools → Serial Monitor** (115200 baud)
4. You should see:
   ```
   ESP32-CAM Smart Parking Vision Module
   ======================================
   Connecting to WiFi...
   WiFi connected
   Camera Ready! Stream URL: http://192.168.1.XXX/stream
   ```

---

## 🌐 Step 4: Integrate with Vision Service

### 4.1 Note ESP32-CAM IP Address
From Serial Monitor, note the IP address (e.g., `192.168.1.105`)

### 4.2 Update Vision Service Config

Edit `vision/config/cameras.yaml`:

```yaml
cameras:
  CAM_01:
    name: "Parking Entrance Camera"
    stream_url: "http://192.168.1.105/stream"  # Your ESP32-CAM IP
    detection_type: "yolo"
    fps: 10
    resolution: [640, 480]
    zones:
      - zone_id: "SLOT_A1"
        coordinates: [[100, 100], [300, 100], [300, 250], [100, 250]]
      - zone_id: "SLOT_A2"
        coordinates: [[320, 100], [520, 100], [520, 250], [320, 250]]
  
  CAM_02:
    name: "Parking Row B Camera"
    stream_url: "http://192.168.1.106/stream"  # Second ESP32-CAM
    detection_type: "yolo"
    fps: 10
    resolution: [640, 480]
    zones:
      - zone_id: "SLOT_B1"
        coordinates: [[50, 80], [280, 80], [280, 220], [50, 220]]
```

### 4.3 Update Vision Service Code

The vision service is already compatible! It uses OpenCV's `cv2.VideoCapture()` which can read MJPEG streams from ESP32-CAM.

Simply restart the vision service:
```bash
cd vision
python src/vision_service.py
```

---

## 🎥 Step 5: View Live Stream

### In Browser
Open: `http://192.168.1.105/stream` (replace with your ESP32-CAM IP)

### In Python (Testing)
```python
import cv2

stream_url = "http://192.168.1.105/stream"
cap = cv2.VideoCapture(stream_url)

while True:
    ret, frame = cap.read()
    if ret:
        cv2.imshow("ESP32-CAM Stream", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

---

## 🔧 Multiple Camera Setup

### For Multiple ESP32-CAM Modules:

1. **Flash each ESP32-CAM** with the same firmware
2. **Change camera_id** in each firmware (line 23):
   ```cpp
   const char* camera_id = "CAM_01";  // Change to CAM_02, CAM_03, etc.
   ```
3. Each ESP32-CAM will get a different IP from your router
4. Add all camera IPs to `vision/config/cameras.yaml`

---

## ⚡ Power Considerations

### Important:
- ESP32-CAM draws **~200-300mA** during operation
- **FTDI programmer may not supply enough current** - use external 5V power for stable operation
- Connect 5V and GND from power supply to ESP32-CAM (keep GND common with programmer during upload)

### Recommended Power Setup:
```
5V Power Supply (1A+) → ESP32-CAM (5V & GND)
                       → Keep FTDI GND connected to ESP32 GND
                       → FTDI TX/RX still connected
```

---

## 🐛 Troubleshooting

### Camera Not Connecting to WiFi
- Double-check SSID and password
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check Serial Monitor for error messages

### Upload Failed
- Ensure GPIO 0 is connected to GND during upload
- Try pressing RST button when "Connecting..." appears
- Reduce upload speed to 57600
- Check TX/RX connections (they might need to be swapped)

### Poor Video Quality
- Adjust `jpeg_quality` in firmware (lower number = higher quality)
- Ensure good lighting conditions
- Clean camera lens
- Use external 5V power supply

### Stream Freezing
- ESP32-CAM might be overheating - add heatsink
- Power supply might be insufficient - use 5V/1A adapter
- WiFi signal might be weak - move closer to router

### Can't Access Stream URL
- Ensure ESP32-CAM and computer are on same network
- Check firewall settings
- Ping the ESP32-CAM IP address
- Try health endpoint: `http://192.168.1.105/health`

---

## 📊 System Architecture with ESP32-CAM

```
┌─────────────────┐
│   ESP32-CAM     │  
│  (Camera Feed)  │───┐
│ 192.168.1.105   │   │
└─────────────────┘   │
                      │ HTTP/MJPEG Stream
┌─────────────────┐   │
│   ESP32-CAM     │───┤
│  (Camera Feed)  │   │
│ 192.168.1.106   │   │
└─────────────────┘   │
                      ▼
              ┌──────────────┐
              │    Vision    │
              │   Service    │───► MQTT ───► Aggregator ───► Backend API
              │  (YOLOv8)    │
              └──────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   Frontend   │
              │  Dashboard   │
              └──────────────┘
```

---

## 🎯 Next Steps

1. ✅ Flash ESP32-CAM with firmware
2. ✅ Test stream in browser
3. ✅ Configure camera zones in `cameras.yaml`
4. ✅ Start vision service
5. ✅ Monitor detections in frontend dashboard
6. 🚀 Deploy to parking lot!

---

## 📝 Optional Enhancements

### Add OTA (Over-The-Air) Updates
- Use ESP32 OTA library to update firmware wirelessly
- No need to physically connect programmer after initial setup

### Add Camera Settings API
- Expose endpoints to adjust brightness, contrast, etc. via HTTP
- Control camera remotely from frontend

### Add Motion Detection
- Implement motion-based triggers to save bandwidth
- Only stream when motion is detected

### Add Night Vision
- Use IR LEDs for night operation
- Adjust camera settings for low-light conditions

---

**You're all set!** 🎉  
Your ESP32-CAM is now streaming real footage into your smart parking system.
