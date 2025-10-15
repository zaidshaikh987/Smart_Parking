"""
Simulated Aggregator Service for Testing
Mimics MQTT coordination without requiring broker
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

app = FastAPI(title="Aggregator Service Simulator", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated state
system_state = {
    "mqtt_connected": True,
    "vision_connected": True,
    "backend_connected": True,
    "last_mqtt_message": datetime.utcnow().isoformat(),
    "messages_processed": 247,
    "uptime_seconds": 3600
}

@app.get("/")
def root():
    return {
        "service": "Aggregator Service Simulator",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/status")
def get_status():
    """Get aggregator status"""
    return {
        "status": "online",
        "mode": "simulation",
        "mqtt_connected": system_state["mqtt_connected"],
        "vision_connected": system_state["vision_connected"],
        "backend_connected": system_state["backend_connected"],
        "mqtt_broker": "localhost:1883 (simulated)",
        "messages_processed": system_state["messages_processed"],
        "last_update": system_state["last_mqtt_message"],
        "uptime_seconds": system_state["uptime_seconds"],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/slots")
def get_slot_state():
    """Get current slot state from aggregator"""
    return {
        "slots": {
            "A1": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
            "A2": {"occupied": True, "last_update": datetime.utcnow().isoformat()},
            "A3": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
            "A4": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
            "B1": {"occupied": True, "last_update": datetime.utcnow().isoformat()},
            "B2": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
            "B3": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
            "B4": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
            "C1": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
            "C2": {"occupied": False, "last_update": datetime.utcnow().isoformat()},
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/sync")
def force_sync():
    """Force synchronization"""
    system_state["messages_processed"] += 1
    return {
        "status": "success",
        "message": "Synchronization complete",
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
    print("🔄 Starting Aggregator Service Simulator...")
    print("📡 Simulating MQTT coordination")
    print("🌐 Service available at: http://localhost:8002")
    print("📊 Status: http://localhost:8002/status")
    print("="*50)
    uvicorn.run(app, host="0.0.0.0", port=8002)
