"""
Simulated Vision Service for Testing
Mimics real vision service without requiring cameras
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import random

app = FastAPI(title="Vision Service Simulator", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated camera data
cameras = [
    {
        "camera_id": "CAM_01",
        "name": "Entry Gate Camera",
        "status": "online",
        "fps": 25,
        "resolution": "1920x1080",
        "slots_monitored": ["A1", "A2", "A3", "A4"]
    },
    {
        "camera_id": "CAM_02",
        "name": "Zone B Camera",
        "status": "online",
        "fps": 25,
        "resolution": "1920x1080",
        "slots_monitored": ["B1", "B2", "B3", "B4"]
    },
    {
        "camera_id": "CAM_03",
        "name": "Zone C Camera",
        "status": "online",
        "fps": 25,
        "resolution": "1920x1080",
        "slots_monitored": ["C1", "C2"]
    }
]

@app.get("/")
def root():
    return {
        "service": "Vision Service Simulator",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/status")
def get_status():
    """Get vision service status"""
    return {
        "status": "online",
        "mode": "simulation",
        "timestamp": datetime.utcnow().isoformat(),
        "cameras": len(cameras),
        "slots_detected": sum(len(cam["slots_monitored"]) for cam in cameras),
        "model": "YOLOv8 (Simulated)",
        "fps_avg": 25
    }

@app.get("/cameras")
def get_cameras():
    """Get list of cameras"""
    return {"cameras": cameras}

@app.get("/camera/{camera_id}")
def get_camera(camera_id: str):
    """Get specific camera details"""
    camera = next((c for c in cameras if c["camera_id"] == camera_id), None)
    if camera:
        return camera
    return {"error": "Camera not found"}

@app.get("/camera/{camera_id}/detections")
def get_detections(camera_id: str):
    """Get slot detections for a camera"""
    camera = next((c for c in cameras if c["camera_id"] == camera_id), None)
    if not camera:
        return {"error": "Camera not found"}
    
    # Simulate detections
    detections = []
    for slot_id in camera["slots_monitored"]:
        detections.append({
            "slot_id": slot_id,
            "occupied": random.choice([True, False]),
            "confidence": round(random.uniform(0.85, 0.99), 2),
            "last_updated": datetime.utcnow().isoformat()
        })
    
    return {
        "camera_id": camera_id,
        "detections": detections,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    print("🎥 Starting Vision Service Simulator...")
    print("📹 Simulating 3 cameras with YOLOv8 detection")
    print("🌐 Service available at: http://localhost:8001")
    print("📊 Status: http://localhost:8001/status")
    print("="*50)
    uvicorn.run(app, host="0.0.0.0", port=8001)
