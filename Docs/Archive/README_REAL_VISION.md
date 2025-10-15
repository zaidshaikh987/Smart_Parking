# 🚗 Real Vision Integration - YOLOv8 Vehicle Detection

## 🎯 What is This?

This is a **real computer vision service** that uses **YOLOv8** (state-of-the-art object detection) to detect vehicles in real-time from your webcam or video files. It replaces the simulated vision system with actual AI-powered detection.

---

## 🆚 Demo vs. Real Vision

### Demo System (Simulated)
- ❌ Fake detections (random data)
- ❌ Static images
- ❌ No actual AI
- ✅ Fast to set up
- ✅ Always works

### Real Vision System (YOLOv8)
- ✅ **Real AI detection** using YOLOv8
- ✅ **Live video** from webcam/camera
- ✅ **Actual vehicle recognition**
- ✅ Bounding boxes, confidence scores
- ✅ Production-ready architecture

---

## 🚀 Quick Start - 3 Simple Steps!

### Step 1: Run the Service
Double-click:
```
START_AND_TEST_REAL_VISION.bat
```

This will:
1. Start the Real Vision Service (with YOLOv8)
2. Download YOLOv8 model (first time only)
3. Connect to your webcam
4. Run automated tests
5. Open browser to live video feed

### Step 2: Watch the Magic
A new window opens showing your webcam feed with:
- 🟦 **Blue boxes** around detected vehicles
- 🟢 **Green slots** = parking spaces available
- 🔴 **Red slots** = parking spaces occupied
- 📊 **Stats** showing vehicle count and time

### Step 3: Test Detection
Point your webcam at:
- 🚗 Toy cars
- 📱 Phone showing car images
- 🖼️ Posters/pictures of vehicles
- 🚙 Real cars (if near parking/window)

Watch YOLOv8 detect them in real-time!

---

## 📁 Project Structure

```
Car_Parking_Space_Detection/
│
├── vision/
│   ├── real_vision_webcam.py      ← Real Vision Service (YOLOv8)
│   ├── vision_service.py           ← Simulated Vision (demo)
│   └── vision_config.yaml          ← Configuration for production
│
├── START_REAL_VISION.bat           ← Start real vision only
├── START_AND_TEST_REAL_VISION.bat  ← Start + test + open browser
├── test_real_vision.py             ← Automated test script
│
├── TESTING_REAL_VISION.md          ← Detailed testing guide
├── README_REAL_VISION.md           ← This file
│
└── yolov8n.pt                      ← YOLOv8 model (auto-downloaded)
```

---

## 🔧 How It Works

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Webcam    │─────▶│  YOLOv8 AI   │─────▶│  Video Feed  │
│  (or video) │      │  Detection   │      │  with boxes  │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Polygon    │
                     │  Slot Check  │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  REST APIs   │
                     │  (FastAPI)   │
                     └──────────────┘
```

### Detection Process

1. **Frame Capture**: Get frame from webcam
2. **YOLOv8 Inference**: Run AI detection on frame
3. **Vehicle Detection**: Identify cars/trucks with bounding boxes
4. **Slot Mapping**: Check which parking slots contain vehicles
5. **Annotation**: Draw boxes, labels, slot overlays
6. **Streaming**: Send annotated frame to browser via MJPEG
7. **API Updates**: Expose slot status via REST API

---

## 🌐 API Endpoints

Once running on `http://localhost:8005`:

| Endpoint | Description | Example Response |
|----------|-------------|------------------|
| `GET /` | Service info | `{"service": "Real Vision", "status": "running"}` |
| `GET /status` | Service status | `{"status": "online", "model": "YOLOv8", "cameras": 1}` |
| `GET /slots/status` | Slot occupancy | `{"slots": {"A1": {"occupied": false}}}` |
| `GET /cameras` | Camera list | `{"cameras": [{"camera_id": "CAM_01", ...}]}` |
| `GET /camera/CAM_01/frame` | **Live video feed** (MJPEG stream) | Binary video data |

---

## 🧪 Testing

### Option 1: Automated Test
```bash
python test_real_vision.py
```

This will:
- ✅ Test all API endpoints
- ✅ Check service health
- ✅ Verify slot status
- ✅ Validate camera feed

### Option 2: Manual Testing

**Test API:**
```bash
curl http://localhost:8005/status
curl http://localhost:8005/slots/status
```

**Test Video Feed:**
Open browser: `http://localhost:8005/camera/CAM_01/frame`

**Test Detection:**
1. Show toy car to webcam
2. Watch blue box appear around it
3. Check if parking slot turns red
4. Call API: `curl http://localhost:8005/slots/status`

---

## 🎨 Customization

### Adjust Detection Sensitivity

Edit `vision/real_vision_webcam.py`, line 66:

```python
# More sensitive (more detections, more false positives)
results = model(frame, conf=0.2, classes=[2, 7])

# Default
results = model(frame, conf=0.3, classes=[2, 7])

# More strict (fewer detections, higher accuracy)
results = model(frame, conf=0.5, classes=[2, 7])
```

### Use Different YOLOv8 Model

Edit line 26:

```python
# Fastest, least accurate
model = YOLO('yolov8n.pt')  # nano (6MB)

# Balanced
model = YOLO('yolov8s.pt')  # small (22MB)

# Most accurate, slowest
model = YOLO('yolov8m.pt')  # medium (52MB)
```

### Define Custom Parking Slots

Edit lines 33-38:

```python
slots = {
    'A1': {'polygon': [[x1, y1], [x2, y2], [x3, y3], [x4, y4]], 'occupied': False},
    'B1': {'polygon': [[x1, y1], [x2, y2], [x3, y3], [x4, y4]], 'occupied': False},
    # Add more...
}
```

Use a slot picker tool to get coordinates visually.

### Use Video File Instead of Webcam

Edit line 30:

```python
# Instead of webcam
cap = cv2.VideoCapture(0)

# Use video file
cap = cv2.VideoCapture('videos/parking_lot.mp4')

# Use IP camera
cap = cv2.VideoCapture('rtsp://192.168.1.100:554/stream')
```

---

## 🔌 Integration with Smart Parking System

### Full System Architecture

```
Frontend (React)
    ↓
Backend (FastAPI) ← MongoDB
    ↓
┌───────────────────────────┐
│  REAL VISION (YOLOv8)     │ ← You are here!
│  - Vehicle detection      │
│  - Slot occupancy         │
│  - Video streaming        │
└───────────────────────────┘
    ↓
Aggregator Service
    ↓
ESP32 Gate Controllers
    ↓
Physical Gates + RFID
```

### Integration Steps

**Option 1: Replace Simulated Vision**
1. Stop the simulated vision service (port 8001)
2. Update `real_vision_webcam.py` to use port 8001
3. Restart with real vision

**Option 2: Side-by-Side**
1. Keep simulated on port 8001 (for demo)
2. Keep real on port 8005 (for testing)
3. Toggle in frontend between services

**Option 3: Hybrid**
1. Use simulated for UI demo
2. Use real for actual parking monitoring
3. Switch based on environment variable

---

## 📊 Performance

### Benchmarks (on typical laptop)

| Model | FPS | Latency | Accuracy | Size |
|-------|-----|---------|----------|------|
| YOLOv8n | 30+ | ~33ms | Good | 6MB |
| YOLOv8s | 20+ | ~50ms | Better | 22MB |
| YOLOv8m | 10+ | ~100ms | Best | 52MB |

### Optimization Tips

**For Speed:**
- Use YOLOv8n (nano)
- Lower webcam resolution
- Skip frames (process every 2nd frame)
- Use GPU if available

**For Accuracy:**
- Use YOLOv8m or YOLOv8l
- Higher resolution webcam
- Better lighting
- Train custom model on your data

---

## 🎓 Advanced: Training Custom Model

Want better accuracy for your specific parking lot? Train a custom model!

### Steps:

1. **Collect Data**
   - Record 1000+ images of your parking lot
   - Include various conditions (day/night, empty/full)

2. **Label Data**
   - Use tools like LabelImg or Roboflow
   - Label vehicles and parking slots

3. **Train Model**
   ```bash
   yolo train data=parking.yaml model=yolov8n.pt epochs=100
   ```

4. **Use Custom Model**
   ```python
   model = YOLO('runs/detect/train/weights/best.pt')
   ```

---

## 🐛 Troubleshooting

### Service Won't Start

**Problem**: Port already in use
```
ERROR: [Errno 10048] error while attempting to bind on address
```

**Solution**: Change port in `real_vision_webcam.py`
```python
uvicorn.run(app, host="0.0.0.0", port=8006)  # Use different port
```

---

### No Webcam Feed

**Problem**: Webcam not found
```
VideoCapture returns None
```

**Solutions**:
1. Close other apps using webcam (Zoom, Skype, etc.)
2. Try different camera index: `cv2.VideoCapture(1)`
3. Check camera permissions in Windows Settings
4. Use video file instead: `cv2.VideoCapture('video.mp4')`

---

### Poor Detection Accuracy

**Symptoms**:
- Vehicles not detected
- Too many false positives
- Slow detection

**Solutions**:

**Too Few Detections:**
- Lower confidence threshold: `conf=0.2`
- Use larger model: `yolov8m.pt`
- Improve lighting
- Get closer to camera

**Too Many False Positives:**
- Raise confidence: `conf=0.5`
- Filter by size/position
- Train custom model

**Slow Performance:**
- Use smaller model: `yolov8n.pt`
- Reduce resolution
- Process fewer frames
- Use GPU (CUDA)

---

### Model Download Fails

**Problem**: Can't download YOLOv8 weights

**Solution**: Manual download
1. Download from: https://github.com/ultralytics/assets/releases
2. Place `yolov8n.pt` in project root
3. Restart service

---

## 📈 Next Steps

### Immediate (Today)
- ✅ Run `START_AND_TEST_REAL_VISION.bat`
- ✅ Test detection with toy cars/images
- ✅ Verify API endpoints work
- ✅ View live feed in browser

### Short Term (This Week)
- 🎥 Record actual parking lot video
- 🔧 Adjust slot polygons for your layout
- 📊 Test different YOLOv8 models
- 🔌 Integrate with main Smart Parking system

### Long Term (Production)
- 🎓 Train custom model on your data
- 📹 Use IP cameras instead of webcam
- 💻 Deploy on edge device (Jetson Nano)
- 🔐 Add authentication to APIs
- 📱 Mobile app integration

---

## 💡 Tips & Tricks

1. **Better Lighting = Better Detection**
   - Detection accuracy drops 50% in low light
   - Use additional lighting if possible

2. **Stable Camera Mount**
   - Fixed camera position improves consistency
   - Minimize vibration/movement

3. **Optimal Camera Angle**
   - 45-60 degree overhead view works best
   - Too high = small vehicles, hard to detect
   - Too low = perspective distortion

4. **Start Small**
   - Test with 2-4 slots first
   - Scale up after validating accuracy

5. **Monitor Performance**
   - Check FPS and latency
   - Adjust model size accordingly

---

## 🎉 Success Checklist

You've successfully set up Real Vision if:

- ✅ Service starts without errors
- ✅ YOLOv8 model loads successfully
- ✅ Webcam feed displays in browser
- ✅ Blue boxes appear around vehicles
- ✅ Parking slots change color correctly
- ✅ All API endpoints respond
- ✅ Detection works in real-time

---

## 📚 Learn More

- **YOLOv8 Docs**: https://docs.ultralytics.com/
- **OpenCV Docs**: https://docs.opencv.org/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## 🆘 Need Help?

1. Check the service logs in the terminal window
2. Read `TESTING_REAL_VISION.md` for detailed testing guide
3. Verify dependencies: `pip install -r requirements.txt`
4. Test with lower confidence threshold first
5. Use toy cars for initial testing (easier than real vehicles)

---

## 🎊 Congratulations!

You now have a **real AI-powered vehicle detection system** running on your machine! This is the same technology used in production parking systems, self-driving cars, and smart city applications.

**Now go show it off!** 🚗🎥✨

Point your webcam at toy cars, phone screens with car images, or real vehicles, and watch YOLOv8 detect them in real-time. This is cutting-edge computer vision technology at your fingertips!

---

**Made with ❤️ using YOLOv8, OpenCV, and FastAPI**
