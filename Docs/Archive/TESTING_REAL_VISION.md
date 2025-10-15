# Testing Real Vision Service with YOLOv8

## 🎯 Overview
You now have a **real computer vision service** using YOLOv8 that can detect vehicles in real-time from your webcam!

---

## 🚀 Quick Start

### Step 1: Start the Real Vision Service

Run the batch file:
```bash
START_REAL_VISION.bat
```

Or manually:
```bash
python vision\real_vision_webcam.py
```

The service will:
- ✅ Download YOLOv8 nano model (first time only)
- ✅ Connect to your webcam
- ✅ Start detecting vehicles in real-time
- ✅ Serve video feed with annotations

### Step 2: Access the Live Feed

Open in your browser:
```
http://localhost:8005/camera/CAM_01/frame
```

You should see:
- 📹 **Live webcam feed**
- 🚗 **Blue boxes around detected vehicles** with confidence scores
- 🅿️ **Parking slot overlays** (green = free, red = occupied)
- ℹ️ **Info overlay** showing vehicle count and timestamp

---

## 🧪 Testing Steps

### Test 1: Basic Vehicle Detection
1. Open the video feed: http://localhost:8005/camera/CAM_01/frame
2. Point your webcam at:
   - Toy cars
   - Pictures/posters of cars
   - Your phone/tablet showing car images
   - Real cars (if near a window/parking)
3. Watch YOLOv8 detect vehicles with blue bounding boxes!

### Test 2: Check API Endpoints

**Service Status:**
```bash
curl http://localhost:8005/status
```

**Slot Status:**
```bash
curl http://localhost:8005/slots/status
```

**Camera List:**
```bash
curl http://localhost:8005/cameras
```

### Test 3: Parking Slot Occupancy
1. The service defines 4 parking slots: A1, A2, A3, A4
2. Position toy cars or images in front of the webcam
3. Watch the slot colors change from **GREEN** (free) to **RED** (occupied)
4. Check the API: `curl http://localhost:8005/slots/status`

---

## 📊 What You're Seeing

### YOLOv8 Detection
- **Model**: YOLOv8n (nano - fastest, smallest)
- **Classes**: Cars (class 2) and Trucks (class 7)
- **Confidence**: 0.3 minimum (30%)
- **Output**: Bounding boxes with confidence scores

### Parking Slots
The service defines 4 parking slots with polygon coordinates:
- **A1**: Top-left quadrant
- **A2**: Top-right quadrant
- **A3**: Bottom-left quadrant
- **A4**: Bottom-right quadrant

When a vehicle's center point falls inside a slot polygon, that slot is marked as **OCCUPIED**.

---

## 🎨 Customizing Parking Slots

Edit `vision/real_vision_webcam.py` to define your own slots:

```python
slots = {
    'A1': {'polygon': [[x1, y1], [x2, y2], [x3, y3], [x4, y4]], 'occupied': False},
    # Add more slots...
}
```

You can use a slot picker tool or manually define coordinates based on your camera view.

---

## 🔧 Performance Optimization

### Adjust Detection Confidence
In `real_vision_webcam.py`, line 66:
```python
results = model(frame, conf=0.3, classes=[2, 7], verbose=False)
```

- Lower `conf` (e.g., 0.2) = more detections, more false positives
- Higher `conf` (e.g., 0.5) = fewer detections, higher accuracy

### Use Different YOLOv8 Models
Change line 26:
```python
model = YOLO('yolov8n.pt')  # nano (fastest)
model = YOLO('yolov8s.pt')  # small
model = YOLO('yolov8m.pt')  # medium (more accurate, slower)
```

---

## 🎥 Using Video Files Instead of Webcam

Replace line 30 in `real_vision_webcam.py`:
```python
# Instead of webcam:
cap = cv2.VideoCapture(0)

# Use video file:
cap = cv2.VideoCapture('path/to/parking_video.mp4')
```

---

## 🔌 Integration with Smart Parking System

### Option 1: Replace Simulated Vision Service
Stop the simulated vision service on port 8001, and update your real vision service to run on port 8001.

### Option 2: Run Side-by-Side
Keep both running:
- **Simulated**: http://localhost:8001 (for demo)
- **Real**: http://localhost:8005 (for testing)

Switch between them in your frontend by changing the vision service URL.

---

## 📈 Next Steps

### 1. Collect Training Data
- Record videos of your actual parking lot
- Label parking slots in the video
- Fine-tune YOLOv8 on your specific environment

### 2. Add More Features
- License plate detection (OCR)
- Vehicle counting/tracking
- Parking duration tracking
- Multi-camera support

### 3. Deploy to Production
- Use IP cameras instead of webcam
- Run on edge device (Jetson Nano, Raspberry Pi 4)
- Integrate with real ESP32 gate controllers
- Connect to real RFID readers

---

## 🐛 Troubleshooting

### Webcam Not Found
```
cv2.VideoCapture(0) returns None
```
**Solution**: 
- Check if another app is using the webcam
- Try `cv2.VideoCapture(1)` for a different camera
- Grant camera permissions to Python/terminal

### Poor Detection
**Solutions**:
- Better lighting conditions
- Higher quality webcam
- Use larger YOLOv8 model (yolov8m.pt)
- Lower confidence threshold

### Slow Performance
**Solutions**:
- Use GPU (CUDA) if available
- Reduce frame rate
- Lower resolution: `cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)`
- Use yolov8n (nano model)

---

## 🎉 Success Criteria

You've successfully set up real vision if you can:
- ✅ See live webcam feed with YOLOv8 detection
- ✅ Vehicles are detected with bounding boxes
- ✅ Parking slots change color based on occupancy
- ✅ API endpoints return correct status
- ✅ Service runs without errors

---

## 📞 Need Help?

Check the logs in the terminal where you started the service. YOLOv8 will show detection details and any errors.

Happy testing! 🚗🎥✨
