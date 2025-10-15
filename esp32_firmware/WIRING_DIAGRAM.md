# ESP32-CAM Wiring Diagrams

## 📌 ESP32-CAM Pinout Reference

```
                    ┌─────────────────────┐
                    │   ESP32-CAM Module  │
                    ├─────────────────────┤
          5V ───────┤ 5V                  │
         GND ───────┤ GND                 │
      GPIO12 ───────┤ GPIO12   (FLASH LED)│
      GPIO13 ───────┤ GPIO13              │
      GPIO15 ───────┤ GPIO15              │
      GPIO14 ───────┤ GPIO14              │
       GPIO2 ───────┤ GPIO2               │
       GPIO4 ───────┤ GPIO4   (FLASH)     │
      GPIO16 ───────┤ GPIO16  (PSRAM)     │
      GPIO17 ───────┤ GPIO17  (PSRAM)     │
       GPIO0 ───────┤ GPIO0   (BOOT MODE) │
        U0R  ───────┤ U0R (RX)            │
        U0T  ───────┤ U0T (TX)            │
        RST  ───────┤ RST (RESET)         │
                    └─────────────────────┘
```

---

## 🔌 Programming Mode Wiring (FTDI Adapter)

### Connection Table

| FTDI Pin | ESP32-CAM Pin | Wire Color (suggestion) | Notes |
|----------|---------------|------------------------|-------|
| 5V       | 5V            | Red                    | Power supply |
| GND      | GND           | Black                  | Common ground |
| TX       | U0R           | Yellow                 | FTDI transmit to ESP receive |
| RX       | U0T           | Orange                 | FTDI receive from ESP transmit |
| -        | GPIO 0        | White to GND           | **Connect to GND for upload** |

### ASCII Diagram

```
┌──────────────┐                    ┌──────────────────┐
│ FTDI Adapter │                    │   ESP32-CAM      │
├──────────────┤                    ├──────────────────┤
│              │                    │                  │
│   5V    ●────┼────────────────────┼───● 5V           │
│              │        RED         │                  │
│   GND   ●────┼────────────────────┼───● GND          │
│              │       BLACK        │                  │
│   TX    ●────┼────────────────────┼───● U0R (RX)     │
│              │       YELLOW       │                  │
│   RX    ●────┼────────────────────┼───● U0T (TX)     │
│              │       ORANGE       │                  │
│              │                    │                  │
│              │      ┌─────┐       │                  │
│              │      │WHITE│       │                  │
│              │      └──┬──┘       │                  │
│              │         │          │                  │
│              │         └──────────┼───● GPIO 0       │
│              │                    │   │              │
│   GND   ●────┼────────────────────┼───●              │
│              │  (For programming) │                  │
└──────────────┘                    └──────────────────┘

                 [RST Button] - Press during upload
```

---

## ⚡ Running Mode Wiring (After Upload)

**IMPORTANT:** Remove GPIO 0 to GND connection!

### With FTDI (Development)
```
┌──────────────┐                    ┌──────────────────┐
│ FTDI Adapter │                    │   ESP32-CAM      │
├──────────────┤                    ├──────────────────┤
│   5V    ●────┼────────────────────┼───● 5V           │
│   GND   ●────┼────────────────────┼───● GND          │
│   TX    ●────┼────────────────────┼───● U0R          │
│   RX    ●────┼────────────────────┼───● U0T          │
│              │                    │                  │
│              │    GPIO 0 NOT      │   GPIO 0 ●       │
│              │    CONNECTED!      │   (FLOATING)     │
└──────────────┘                    └──────────────────┘
```

### With External Power (Production)
```
┌──────────────┐                    
│  5V Adapter  │                    ┌──────────────────┐
│  (1A or more)│                    │   ESP32-CAM      │
├──────────────┤                    ├──────────────────┤
│              │                    │                  │
│   +5V   ●────┼────────────────────┼───● 5V           │
│              │        RED         │                  │
│   GND   ●────┼────────────────────┼───● GND          │
│              │       BLACK        │                  │
└──────────────┘                    └──────────────────┘

            WiFi Connected ───► Streaming to Vision Service
```

---

## 🔋 Power Supply Considerations

### Current Requirements
- **Idle:** ~70-100mA
- **Streaming:** ~200-300mA
- **Peak (WiFi TX):** ~400-500mA

### Recommended Power Options

#### ✅ GOOD - USB Power Adapter (5V/1A)
```
[Wall Outlet] → [USB Adapter 5V/1A] → [Micro USB to Wires] → [ESP32-CAM]
```

#### ✅ GOOD - External 5V Regulator
```
[12V Battery] → [Buck Converter (12V→5V)] → [ESP32-CAM]
```

#### ⚠️ MARGINAL - FTDI Programmer
```
[Computer USB] → [FTDI Adapter] → [ESP32-CAM]
```
*May work but can be unstable - use for programming only*

#### ❌ BAD - 3.3V Supply
```
ESP32-CAM requires 5V input (has onboard regulator to 3.3V)
```

---

## 🎥 Camera Connection

The camera module connects via the FFC (Flat Flex Cable) connector:

```
┌────────────────────────────────┐
│        ESP32-CAM Board         │
│                                │
│    ┌──────────────────┐        │
│    │  Camera Connector│        │
│    │  (FFC Socket)    │        │
│    └────────┬─────────┘        │
│             │                  │
│             │ FFC Cable        │
│             │ (contacts down)  │
│             ▼                  │
│      ┌─────────────┐           │
│      │   OV2640    │           │
│      │   Camera    │           │
│      │   Module    │           │
│      └─────────────┘           │
└────────────────────────────────┘

⚠️ IMPORTANT: Ensure FFC cable contacts face DOWN when inserting!
```

---

## 🔍 Troubleshooting with Multimeter

### Check Power Supply
```
Test Point          Expected Voltage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5V Pin to GND       ~5.0V (±0.25V)
3.3V Pin to GND     ~3.3V (±0.15V)
```

### Check Connections
```
Multimeter Continuity Mode:
- FTDI TX to ESP32 U0R: Should beep ✓
- FTDI RX to ESP32 U0T: Should beep ✓
- FTDI GND to ESP32 GND: Should beep ✓
```

---

## 🛠️ GPIO 0 States

| GPIO 0 State | ESP32 Boot Mode | When to Use |
|--------------|-----------------|-------------|
| Connected to GND | **UART Download Mode** (Programming) | When uploading firmware via Arduino IDE |
| Floating (not connected) | **Flash Boot Mode** (Normal operation) | After upload, for running the program |
| Pulled HIGH (to 3.3V) | Flash Boot Mode | Optional - can use internal pull-up |

---

## 📸 Multiple ESP32-CAM Setup

### For 2 Cameras:
```
┌─────────────┐         ┌─────────────┐
│ESP32-CAM #1 │         │ESP32-CAM #2 │
│ (CAM_01)    │         │ (CAM_02)    │
│192.168.1.105│         │192.168.1.106│
└──────┬──────┘         └──────┬──────┘
       │                       │
       │      WiFi Router      │
       └───────────┬───────────┘
                   │
            ┌──────▼──────┐
            │   Vision    │
            │   Service   │
            │ (localhost) │
            └─────────────┘
```

Each ESP32-CAM needs:
- Separate 5V power supply
- WiFi connection (same network)
- Unique camera_id in firmware

---

## 🔐 Security Considerations (Production)

### Add Authentication (Future Enhancement)
```cpp
// In ESP32-CAM firmware
const char* auth_token = "your_secret_token_here";

// Modify stream_handler to check for auth header
```

### Use Static IP (Optional)
```cpp
// In setup() function, after WiFi.begin():
IPAddress local_IP(192, 168, 1, 105);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

if (!WiFi.config(local_IP, gateway, subnet)) {
  Serial.println("Failed to configure static IP");
}
```

---

## 📋 Pre-Flight Checklist

Before connecting power:
- [ ] All wiring double-checked
- [ ] No short circuits (use multimeter)
- [ ] Camera FFC cable inserted correctly
- [ ] Power supply is 5V (not 3.3V or 12V)
- [ ] WiFi credentials updated in firmware

For programming:
- [ ] GPIO 0 connected to GND
- [ ] FTDI TX/RX not swapped
- [ ] Correct board selected in Arduino IDE
- [ ] Correct COM port selected

For operation:
- [ ] GPIO 0 disconnected from GND
- [ ] ESP32-CAM reset after upload
- [ ] Serial monitor shows IP address
- [ ] Stream accessible in browser

---

**Need Help?** See troubleshooting in `ESP32_SETUP_GUIDE.md`
