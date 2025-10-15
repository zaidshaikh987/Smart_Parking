"""
Real Vision Service with YOLOv8 for Parking Slot Detection
Processes actual video footage and detects parking occupancy
"""
import cv2
import numpy as np
from ultralytics import YOLO
import yaml
import json
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import asyncio
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Real Vision Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ParkingDetector:
    def __init__(self, config_path: str):
        """Initialize parking detector with YOLOv8"""
        self.config = self.load_config(config_path)
        
        # Load YOLOv8 model
        model_path = self.config.get('model_path', 'yolov8n.pt')
        logger.info(f"Loading YOLOv8 model: {model_path}")
        self.model = YOLO(model_path)
        
        # Camera configurations
        self.cameras = self.config.get('cameras', [])
        self.video_captures = {}
        self.slot_polygons = {}
        self.slot_status = {}
        
        # Initialize cameras
        self.initialize_cameras()
        
    def load_config(self, config_path: str) -> dict:
        """Load configuration from YAML"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self.get_default_config()
    
    def get_default_config(self) -> dict:
        """Default configuration with sample video"""
        return {
            'model_path': 'yolov8n.pt',
            'cameras': [
                {
                    'camera_id': 'CAM_01',
                    'source': 'parking_video.mp4',  # Replace with your video
                    'slots': [
                        {
                            'slot_id': 'A1',
                            'polygon': [[100, 200], [300, 200], [300, 400], [100, 400]]
                        },
                        {
                            'slot_id': 'A2',
                            'polygon': [[320, 200], [520, 200], [520, 400], [320, 400]]
                        }
                    ]
                }
            ]
        }
    
    def initialize_cameras(self):
        """Initialize video captures for all cameras"""
        for camera in self.cameras:
            camera_id = camera['camera_id']
            source = camera['source']
            
            # Try to open video source
            try:
                cap = cv2.VideoCapture(source)
                if cap.isOpened():
                    self.video_captures[camera_id] = cap
                    self.slot_polygons[camera_id] = camera['slots']
                    
                    # Initialize slot status
                    for slot in camera['slots']:
                        self.slot_status[slot['slot_id']] = {
                            'occupied': False,
                            'confidence': 0.0,
                            'last_updated': datetime.now().isoformat()
                        }
                    
                    logger.info(f"✅ Camera {camera_id} initialized: {source}")
                else:
                    logger.warning(f"❌ Failed to open camera {camera_id}: {source}")
            except Exception as e:
                logger.error(f"Error initializing camera {camera_id}: {e}")
    
    def point_in_polygon(self, point, polygon):
        """Check if a point is inside a polygon"""
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
    
    def detect_occupancy(self, frame, camera_id: str):
        """Detect parking slot occupancy using YOLOv8"""
        if camera_id not in self.slot_polygons:
            return frame
        
        # Run YOLOv8 detection
        results = self.model(frame, conf=0.5, classes=[2, 7])  # car=2, truck=7
        
        # Get detections
        detections = []
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                
                # Calculate center point
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)
                
                detections.append({
                    'bbox': [int(x1), int(y1), int(x2), int(y2)],
                    'center': [cx, cy],
                    'confidence': conf,
                    'class': cls
                })
        
        # Check each parking slot
        for slot in self.slot_polygons[camera_id]:
            slot_id = slot['slot_id']
            polygon = slot['polygon']
            
            # Check if any vehicle center is in this slot
            occupied = False
            max_conf = 0.0
            
            for det in detections:
                if self.point_in_polygon(det['center'], polygon):
                    occupied = True
                    max_conf = max(max_conf, det['confidence'])
            
            # Update slot status
            self.slot_status[slot_id] = {
                'occupied': occupied,
                'confidence': max_conf,
                'last_updated': datetime.now().isoformat()
            }
            
            # Draw polygon
            pts = np.array(polygon, np.int32)
            color = (0, 0, 255) if occupied else (0, 255, 0)  # Red if occupied, Green if free
            cv2.polylines(frame, [pts], True, color, 3)
            
            # Draw slot label
            label = f"{slot_id}: {'OCCUPIED' if occupied else 'FREE'}"
            if occupied:
                label += f" ({max_conf:.2f})"
            
            cv2.putText(frame, label, (polygon[0][0], polygon[0][1] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # Draw vehicle bounding boxes
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, f"Vehicle {det['confidence']:.2f}", 
                       (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        
        return frame
    
    def get_frame(self, camera_id: str):
        """Get processed frame from camera"""
        if camera_id not in self.video_captures:
            return None
        
        cap = self.video_captures[camera_id]
        ret, frame = cap.read()
        
        if not ret:
            # Loop video
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                return None
        
        # Process frame
        processed_frame = self.detect_occupancy(frame, camera_id)
        return processed_frame
    
    def get_all_slots_status(self) -> Dict:
        """Get status of all parking slots"""
        return self.slot_status
    
    def cleanup(self):
        """Release all video captures"""
        for cap in self.video_captures.values():
            cap.release()


# Global detector instance
detector = None

@app.on_event("startup")
async def startup_event():
    """Initialize detector on startup"""
    global detector
    config_path = Path(__file__).parent.parent / "config" / "vision_config.yaml"
    detector = ParkingDetector(str(config_path))
    logger.info("✅ Real Vision Service Started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if detector:
        detector.cleanup()
    logger.info("Vision Service Stopped")

@app.get("/")
def root():
    return {
        "service": "Real Vision Service with YOLOv8",
        "version": "2.0.0",
        "status": "running",
        "model": "YOLOv8"
    }

@app.get("/status")
def get_status():
    """Get vision service status"""
    return {
        "status": "online",
        "mode": "real_vision",
        "model": "YOLOv8",
        "cameras": len(detector.cameras) if detector else 0,
        "slots_monitored": len(detector.slot_status) if detector else 0,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/cameras")
def get_cameras():
    """Get list of cameras"""
    if not detector:
        return {"cameras": []}
    
    cameras_info = []
    for camera in detector.cameras:
        cameras_info.append({
            "camera_id": camera['camera_id'],
            "source": camera['source'],
            "status": "active" if camera['camera_id'] in detector.video_captures else "inactive",
            "slots_count": len(camera['slots'])
        })
    
    return {"cameras": cameras_info}

@app.get("/slots/status")
def get_slots_status():
    """Get current status of all parking slots"""
    if not detector:
        return {"slots": {}}
    
    return {"slots": detector.get_all_slots_status()}

@app.get("/camera/{camera_id}/frame")
def get_camera_frame(camera_id: str):
    """Get current frame from camera as MJPEG stream"""
    def generate():
        while True:
            frame = detector.get_frame(camera_id)
            if frame is None:
                break
            
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("="*60)
    print("🎥 REAL VISION SERVICE WITH YOLOv8")
    print("="*60)
    print("📹 Processing real video footage")
    print("🤖 Using YOLOv8 for vehicle detection")
    print("🌐 Service: http://localhost:8001")
    print("📊 Status: http://localhost:8001/status")
    print("="*60)
    uvicorn.run(app, host="0.0.0.0", port=8001)
