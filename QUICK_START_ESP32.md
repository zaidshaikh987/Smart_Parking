# Quick Start: ESP32-CAM Integration

## 🚀 5-Minute Setup

### Prerequisites
- ✅ ESP32-CAM module
- ✅ FTDI programmer
- ✅ Arduino IDE installed
- ✅ ESP32 board support installed

---

## Step-by-Step

### 1️⃣ **Wire the Hardware**
```
FTDI 5V  → ESP32-CAM 5V
FTDI GND → ESP32-CAM GND
FTDI TX  → ESP32-CAM U0R
FTDI RX  → ESP32-CAM U0T
GPIO 0   → GND (for upload only)
```

### 2️⃣ **Update WiFi Credentials**
Edit `esp32_firmware/camera_stream/camera_stream.ino`:
```cpp
const char* ssid = "YourWiFiName";
const char* password = "YourWiFiPassword";
```

### 3️⃣ **Upload Firmware**
1. Open `.ino` file in Arduino IDE
2. Select: **AI Thinker ESP32-CAM** board
3. Select your COM port
4. Click **Upload**
5. Press **RST** button when "Connecting..." appears

### 4️⃣ **Get IP Address**
1. **Disconnect GPIO 0 from GND**
2. Press **RST** button
3. Open Serial Monitor (115200 baud)
4. Note the IP address (e.g., `192.168.1.105`)

### 5️⃣ **Test in Browser**
Open: `http://192.168.1.105/stream`

You should see live video! 🎉

### 6️⃣ **Connect to Vision Service**
Edit `vision/config/cameras.yaml`:
```yaml
cameras:
  CAM_01:
    stream_url: "http://192.168.1.105/stream"  # Your ESP32 IP
    detection_type: "yolo"
    fps: 10
```

### 7️⃣ **Restart Vision Service**
```powershell
cd vision
python src/vision_service.py
```

---

## ✅ Verification Checklist

- [ ] ESP32-CAM powers on (red LED)
- [ ] Connects to WiFi (check Serial Monitor)
- [ ] Stream accessible in browser
- [ ] Vision service detects vehicles
- [ ] Frontend dashboard shows live updates

---

## 🔧 Common Issues

**Upload fails?**
- Ensure GPIO 0 connected to GND
- Try pressing RST when "Connecting..." appears

**No WiFi connection?**
- Check SSID/password spelling
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)

**Stream not working?**
- Use external 5V power supply (FTDI might not provide enough current)
- Check firewall settings

---

## 📚 Full Documentation
See: `esp32_firmware/ESP32_SETUP_GUIDE.md`

---

## 🎯 System Flow

```
ESP32-CAM → Vision Service → Backend → Frontend
(Stream)    (Detection)      (API)     (Dashboard)
```

**That's it!** Your smart parking system now uses real ESP32-CAM footage. 🚗📹
