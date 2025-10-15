"""
Real-time Vision Service with Webcam
Uses YOLOv8 for live vehicle detection
"""
import cv2
from ultralytics import YOLO
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from datetime import datetime
import numpy as np

app = FastAPI(title="Real Vision - Webcam")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model (will auto-download if not present)
print("Loading YOLOv8 model...")
model = YOLO('yolov8n.pt')  # Nano model for speed
print("✅ Model loaded!")

# Webcam
cap = cv2.VideoCapture(0)

# Define parking slots (example positions for webcam)
slots = {
    'A1': {'polygon': [[50, 100], [250, 100], [250, 300], [50, 300]], 'occupied': False},
    'A2': {'polygon': [[270, 100], [470, 100], [470, 300], [270, 300]], 'occupied': False},
    'A3': {'polygon': [[50, 320], [250, 320], [250, 450], [50, 450]], 'occupied': False},
    'A4': {'polygon': [[270, 320], [470, 320], [470, 450], [270, 450]], 'occupied': False},
}

def point_in_polygon(point, polygon):
    """Check if point is inside polygon"""
    x, y = point
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def generate_frames():
    """Generate video frames with detection"""
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Run YOLOv8 detection
        results = model(frame, conf=0.3, classes=[2, 7], verbose=False)  # car=2, truck=7
        
        # Reset slot occupancy
        for slot_id in slots:
            slots[slot_id]['occupied'] = False
        
        # Check detections
        detections = []
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0])
                
                # Center point
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)
                
                detections.append({
                    'bbox': [int(x1), int(y1), int(x2), int(y2)],
                    'center': [cx, cy],
                    'conf': conf
                })
                
                # Draw vehicle box
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
                cv2.putText(frame, f'Vehicle {conf:.2f}', (int(x1), int(y1)-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        
        # Check each parking slot
        for slot_id, slot_data in slots.items():
            polygon = slot_data['polygon']
            
            # Check if any vehicle center is in this slot
            for det in detections:
                if point_in_polygon(det['center'], polygon):
                    slot_data['occupied'] = True
                    break
            
            # Draw slot
            pts = np.array(polygon, np.int32)
            color = (0, 0, 255) if slot_data['occupied'] else (0, 255, 0)
            cv2.polylines(frame, [pts], True, color, 2)
            
            # Label
            label = f"{slot_id}: {'OCCUPIED' if slot_data['occupied'] else 'FREE'}"
            cv2.putText(frame, label, (polygon[0][0], polygon[0][1]-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # Add info overlay
        cv2.putText(frame, f'Vehicles: {len(detections)}', (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, f'Time: {datetime.now().strftime("%H:%M:%S")}', (10, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Encode frame
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/")
def root():
    return {
        "service": "Real Vision with Webcam + YOLOv8",
        "status": "running",
        "model": "YOLOv8n"
    }

@app.get("/status")
def get_status():
    return {
        "status": "online",
        "mode": "real_webcam",
        "model": "YOLOv8",
        "cameras": 1,
        "slots_monitored": len(slots)
    }

@app.get("/slots/status")
def get_slots():
    return {
        "slots": {
            slot_id: {"occupied": data['occupied']}
            for slot_id, data in slots.items()
        }
    }

@app.get("/camera/CAM_01/frame")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/cameras")
def get_cameras():
    return {
        "cameras": [{
            "camera_id": "CAM_01",
            "source": "Webcam",
            "status": "active",
            "slots_count": len(slots)
        }]
    }

if __name__ == "__main__":
    print("="*60)
    print("🎥 REAL VISION SERVICE WITH YOLOV8")
    print("="*60)
    print("📹 Using webcam for live detection")
    print("🤖 YOLOv8 nano model loaded")
    print("🌐 Service: http://localhost:8005")
    print("📺 Live feed: http://localhost:8005/camera/CAM_01/frame")
    print("="*60)
    uvicorn.run(app, host="0.0.0.0", port=8005)
