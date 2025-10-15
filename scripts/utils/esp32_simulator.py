"""
ESP32 Gate Controller Simulator
Simulates ESP32 hardware endpoints
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import asyncio

# Create two FastAPI apps for two gates
def create_gate_app(gate_name: str, gate_id: str):
    app = FastAPI(title=f"ESP32 {gate_name}", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Gate state
    gate_state = {
        "gate_open": False,
        "rfid_connected": True,
        "last_rfid_scan": None,
        "relay_status": "idle",
        "led_status": "green",
        "uptime_seconds": 0
    }
    
    @app.get("/")
    def root():
        return {
            "device": f"ESP32 Gate Controller - {gate_name}",
            "gate_id": gate_id,
            "version": "1.0.0",
            "status": "online"
        }
    
    @app.get("/status")
    def get_status():
        """Get gate status"""
        return {
            "gate_id": gate_id,
            "gate_name": gate_name,
            "connected": True,
            "gate_open": gate_state["gate_open"],
            "rfid_connected": gate_state["rfid_connected"],
            "relay_status": gate_state["relay_status"],
            "led_status": gate_state["led_status"],
            "last_rfid_scan": gate_state["last_rfid_scan"],
            "uptime_seconds": gate_state["uptime_seconds"],
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @app.post("/open")
    async def open_gate():
        """Open the gate"""
        gate_state["gate_open"] = True
        gate_state["relay_status"] = "opening"
        gate_state["led_status"] = "yellow"
        
        # Simulate gate opening (2 seconds)
        await asyncio.sleep(2)
        gate_state["relay_status"] = "open"
        gate_state["led_status"] = "red"
        
        return {
            "status": "success",
            "message": f"{gate_name} opened",
            "gate_open": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @app.post("/close")
    async def close_gate():
        """Close the gate"""
        gate_state["relay_status"] = "closing"
        gate_state["led_status"] = "yellow"
        
        # Simulate gate closing (2 seconds)
        await asyncio.sleep(2)
        gate_state["gate_open"] = False
        gate_state["relay_status"] = "idle"
        gate_state["led_status"] = "green"
        
        return {
            "status": "success",
            "message": f"{gate_name} closed",
            "gate_open": False,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @app.get("/rfid/scan")
    def simulate_rfid_scan():
        """Simulate RFID scan"""
        gate_state["last_rfid_scan"] = datetime.utcnow().isoformat()
        return {
            "rfid_id": "RFID001",
            "scan_time": gate_state["last_rfid_scan"],
            "reader_status": "ok"
        }
    
    @app.get("/health")
    def health_check():
        """Health check"""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    return app

# Create Entry Gate App
entry_app = create_gate_app("Entry Gate", "GATE_ENTRY")

# Create Exit Gate App  
exit_app = create_gate_app("Exit Gate", "GATE_EXIT")

async def run_multiple_servers():
    """Run both gate simulators"""
    config_entry = uvicorn.Config(entry_app, host="127.0.0.1", port=8100, log_level="info")
    config_exit = uvicorn.Config(exit_app, host="127.0.0.1", port=8101, log_level="info")
    
    server_entry = uvicorn.Server(config_entry)
    server_exit = uvicorn.Server(config_exit)
    
    print("🚪 Starting ESP32 Gate Controller Simulators...")
    print("="*50)
    print("🟢 Entry Gate: http://127.0.0.1:8100")
    print("🔴 Exit Gate:  http://127.0.0.1:8101")
    print("="*50)
    print("📊 Status endpoints:")
    print("   http://127.0.0.1:8100/status")
    print("   http://127.0.0.1:8101/status")
    print("="*50)
    
    await asyncio.gather(
        server_entry.serve(),
        server_exit.serve()
    )

if __name__ == "__main__":
    asyncio.run(run_multiple_servers())
