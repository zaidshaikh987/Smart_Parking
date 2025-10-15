# 🎥 Setup Real Computer Vision with YOLOv8

## 📋 Overview

This guide will help you set up **REAL computer vision** with YOLOv8 for parking slot detection using actual video footage.

---

## 🚀 Quick Setup

### Step 1: Install Dependencies

```powershell
cd vision
pip install -r requirements_real.txt
```

This will install:
- ✅ OpenCV for video processing
- ✅ YOLOv8 (Ultralytics) for object detection
- ✅ PyTorch for deep learning
- ✅ FastAPI for REST API

**Note:** YOLOv8 model will auto-download on first run (~6MB)

---

### Step 2: Prepare Video Footage

#### Option A: Use Your Own Videos

1. Create `videos` folder:
```powershell
mkdir vision\videos
```

2. Place your parking lot videos:
```
vision/videos/
  ├── parking_lot_1.mp4
  ├── parking_lot_2.mp4
  └── entry_gate.mp4
```

#### Option B: Download Sample Videos

You can use these free parking lot videos:

**From YouTube (use yt-dlp or online downloader):**
- Search: "parking lot camera footage"
- Search: "parking lot surveillance"
- Search: "parking lot timelapse"

**Example sources:**
- Pexels.com (search "parking lot")
- Pixabay.com (search "parking")
- Videvo.net (search "parking")

#### Option C: Use Webcam/IP Camera

Edit `vision/config/vision_config.yaml`:
```yaml
cameras:
  - camera_id: "CAM_01"
    source: 0  # Webcam (0, 1, 2, etc.)
    # OR
    source: "rtsp://username:password@192.168.1.100:554/stream"  # IP Camera
```

---

### Step 3: Define Parking Slots

You need to mark parking slot coordinates in your video.

#### Using the Slot Picker Tool:

```powershell
cd vision
python parking_slot_picker.py --video videos/parking_lot_1.mp4
```

**Instructions:**
1. Click 4 corners of each parking slot
2. Press `S` to save slot
3. Press `N` for next slot
4. Press `Q` when done
5. Coordinates are saved to `slots_config.yaml`

#### Manual Configuration:

Edit `vision/config/vision_config.yaml`:
```yaml
slots:
  - slot_id: "A1"
    polygon: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
```

**How to get coordinates:**
1. Open video in VLC/any player
2. Pause at a clear frame
3. Take screenshot
4. Open in Paint/Photoshop
5. Note x,y coordinates of corners

---

### Step 4: Run Real Vision Service

```powershell
cd vision\src
python real_vision_service.py
```

You should see:
```
============================================================
🎥 REAL VISION SERVICE WITH YOLOv8
============================================================
📹 Processing real video footage
🤖 Using YOLOv8 for vehicle detection
🌐 Service: http://localhost:8001
📊 Status: http://localhost:8001/status
============================================================
✅ Camera CAM_01 initialized: videos/parking_lot_1.mp4
✅ Real Vision Service Started
```

---

## 📊 Testing the Vision Service

### Test 1: Check Status
```powershell
curl http://localhost:8001/status
```

Expected output:
```json
{
  "status": "online",
  "mode": "real_vision",
  "model": "YOLOv8",
  "cameras": 2,
  "slots_monitored": 8
}
```

### Test 2: Get Slot Status
```powershell
curl http://localhost:8001/slots/status
```

### Test 3: View Live Feed

Open browser:
```
http://localhost:8001/camera/CAM_01/frame
```

You should see:
- ✅ Video feed with parking slots highlighted
- ✅ Green boxes for FREE slots
- ✅ Red boxes for OCCUPIED slots
- ✅ Blue boxes around detected vehicles
- ✅ Confidence scores

---

## 🎯 How It Works

### 1. Video Processing Flow

```
Video Frame → YOLOv8 Detection → Vehicle Bounding Boxes
                ↓
    Check if vehicle center is in slot polygon
                ↓
    Update slot status (OCCUPIED/FREE)
                ↓
    Draw overlays and publish to frontend
```

### 2. Detection Logic

```python
# For each frame:
1. Run YOLOv8 on frame
2. Get all vehicle detections (cars, trucks)
3. Calculate center point of each vehicle
4. For each parking slot polygon:
   - Check if any vehicle center is inside
   - If yes: OCCUPIED
   - If no: FREE
5. Update database/MQTT with status
```

### 3. Polygon-based Detection

Each parking slot is defined by 4 corner points:
```
     (x1,y1) -------- (x2,y2)
        |                |
        |    SLOT A1     |
        |                |
     (x4,y4) -------- (x3,y3)
```

---

## ⚙️ Configuration Options

### `vision/config/vision_config.yaml`

```yaml
# Model Settings
model_path: "yolov8n.pt"  # nano (fastest)
# or: "yolov8s.pt"  # small
# or: "yolov8m.pt"  # medium (more accurate)
# or: "yolov8l.pt"  # large (most accurate, slower)

# Detection Confidence
detection:
  confidence_threshold: 0.5  # Min confidence (0.0-1.0)
  classes: [2, 7]  # 2=car, 7=truck

# Performance
processing:
  frame_skip: 2  # Process every Nth frame
  resize_width: 1280  # Smaller = faster
```

---

## 🎨 Visualizing Slots

### Color Coding:
- 🟢 **Green** = Slot is FREE
- 🔴 **Red** = Slot is OCCUPIED
- 🔵 **Blue** = Vehicle detected

### Live View in Frontend:

The React frontend will automatically show:
1. Live camera feeds
2. Real-time slot status
3. Occupancy changes
4. Detection confidence

---

## 📈 Training Custom Model (Advanced)

### If you want better accuracy for your specific parking lot:

#### 1. Collect Training Data

```powershell
python collect_training_data.py --video parking_lot.mp4 --frames 1000
```

#### 2. Annotate Images

Use [Roboflow](https://roboflow.com/) or [CVAT](https://cvat.org/):
- Label cars in parking slots
- Export in YOLO format

#### 3. Train YOLOv8

```python
from ultralytics import YOLO

# Load pretrained model
model = YOLO('yolov8n.pt')

# Train on your data
model.train(
    data='parking_dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16
)

# Use trained model
model = YOLO('runs/train/exp/weights/best.pt')
```

#### 4. Update Config

```yaml
model_path: "runs/train/exp/weights/best.pt"
```

---

## 🔧 Troubleshooting

### "Failed to open camera"
- Check video file path is correct
- Try absolute path: `C:/Users/.../videos/parking.mp4`
- Ensure video file is not corrupted

### "No vehicles detected"
- Lower confidence threshold in config
- Check if video shows clear vehicles
- Try different YOLOv8 model (yolov8m.pt)

### "Slots always show occupied/free"
- Check polygon coordinates are correct
- Verify polygons match actual slot positions
- Use slot picker tool to redefine slots

### "Service crashes or freezes"
- Reduce frame size in config
- Increase frame_skip value
- Use faster model (yolov8n.pt)
- Check GPU/CPU usage

### "CUDA out of memory"
```python
# In real_vision_service.py, line 137:
results = self.model(frame, conf=0.5, device='cpu')  # Force CPU
```

---

## 🚀 Performance Optimization

### For Better FPS:

1. **Use smaller model:**
   ```yaml
   model_path: "yolov8n.pt"  # Fastest
   ```

2. **Skip frames:**
   ```yaml
   frame_skip: 3  # Process every 3rd frame
   ```

3. **Resize video:**
   ```yaml
   resize_width: 960  # Smaller resolution
   ```

4. **Use GPU (if available):**
   ```python
   # Auto-uses GPU if CUDA available
   results = self.model(frame, device=0)  # GPU 0
   ```

### Expected Performance:

| Model | FPS (CPU) | FPS (GPU) | Accuracy |
|-------|-----------|-----------|----------|
| YOLOv8n | 15-20 | 60-100 | Good |
| YOLOv8s | 10-15 | 40-60 | Better |
| YOLOv8m | 5-10 | 25-40 | Best |

---

## 📦 Integration with Full System

### 1. Update Frontend to Use Real Feed

In `LiveDemo.js`, change camera feed URL:
```javascript
<img src={`http://localhost:8001/camera/CAM_01/frame`} />
```

### 2. Connect to Backend

Vision service automatically updates backend via REST API:
```
POST /api/slots/{slot_id}
Body: { "is_occupied": true/false }
```

### 3. Enable MQTT (Optional)

Publishes slot status changes to MQTT broker:
```
Topic: parking/slots/status
Payload: {"slot_id": "A1", "occupied": true, "confidence": 0.87}
```

---

## 🎉 You're Done!

Your system now has:
- ✅ Real computer vision with YOLOv8
- ✅ Actual video processing
- ✅ Live occupancy detection
- ✅ REST API for integration
- ✅ Real-time visualization

**Next:** Add your own videos and configure slots for your parking lot!

---

## 📚 Additional Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [OpenCV Python Tutorial](https://docs.opencv.org/master/d6/d00/tutorial_py_root.html)
- [Sample Parking Videos](https://www.pexels.com/search/videos/parking%20lot/)
- [Roboflow for Training](https://roboflow.com/)

---

**Built with ❤️ for real-world parking solutions**
