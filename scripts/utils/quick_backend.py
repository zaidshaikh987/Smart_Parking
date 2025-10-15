from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

app = FastAPI(title="Smart Parking Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample data
users = [
    {"rfid_id": "RFID001", "user_name": "John Doe", "vehicle_no": "MH-12-AB-1234", "wallet_balance": 500.0, "contact": "+91 9876543210", "email": "john@example.com", "is_active": True},
    {"rfid_id": "RFID002", "user_name": "Jane Smith", "vehicle_no": "MH-12-CD-5678", "wallet_balance": 750.0, "contact": "+91 9876543211", "email": "jane@example.com", "is_active": True},
    {"rfid_id": "RFID003", "user_name": "Bob Wilson", "vehicle_no": "MH-12-EF-9012", "wallet_balance": 300.0, "contact": "+91 9876543212", "email": "bob@example.com", "is_active": True},
]

slots = [
    {"slot_id": "A1", "slot_name": "A1", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_01"},
    {"slot_id": "A2", "slot_name": "A2", "is_occupied": True, "slot_type": "standard", "camera_id": "CAM_01"},
    {"slot_id": "A3", "slot_name": "A3", "is_occupied": False, "slot_type": "compact", "camera_id": "CAM_01"},
    {"slot_id": "B1", "slot_name": "B1", "is_occupied": True, "slot_type": "standard", "camera_id": "CAM_02"},
    {"slot_id": "B2", "slot_name": "B2", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_02"},
]

sessions = [
    {"session_id": "SESS_001", "rfid_id": "RFID001", "user_name": "John Doe", "vehicle_no": "MH-12-AB-1234", "slot_id": "A2", "entry_time": "2025-01-14T19:00:00", "status": "active"},
    {"session_id": "SESS_002", "rfid_id": "RFID002", "user_name": "Jane Smith", "vehicle_no": "MH-12-CD-5678", "slot_id": "B1", "entry_time": "2025-01-14T18:30:00", "status": "active"},
]

@app.get("/")
def root():
    return {"service": "Smart Parking Backend", "version": "2.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "database_connected": True, "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/status")
def get_status():
    occupied = sum(1 for s in slots if s["is_occupied"])
    return {
        "total_slots": len(slots),
        "occupied_slots": occupied,
        "free_slots": len(slots) - occupied,
        "occupancy_rate": f"{(occupied/len(slots)*100):.1f}%"
    }

@app.get("/api/users")
def get_users():
    return users

@app.get("/api/users/{rfid_id}")
def get_user(rfid_id: str):
    user = next((u for u in users if u["rfid_id"] == rfid_id), None)
    return user if user else {"error": "Not found"}

@app.post("/api/users")
def create_user(user: dict):
    users.append({**user, "is_active": True})
    return {"message": "User created", "rfid_id": user.get("rfid_id")}

@app.get("/api/slots")
def get_slots():
    return slots

@app.patch("/api/slots/{slot_id}")
def update_slot(slot_id: str, update: dict):
    slot = next((s for s in slots if s["slot_id"] == slot_id), None)
    if slot:
        slot.update(update)
    return slot

@app.get("/api/sessions/active")
def get_active_sessions():
    return [s for s in sessions if s.get("status") == "active"]

@app.post("/api/sessions/{session_id}/manual-exit")
def manual_exit(session_id: str):
    session = next((s for s in sessions if s["session_id"] == session_id), None)
    if session:
        session["status"] = "completed"
        session["exit_time"] = datetime.utcnow().isoformat()
        # Free the slot
        slot = next((s for s in slots if s["slot_id"] == session["slot_id"]), None)
        if slot:
            slot["is_occupied"] = False
    return {"message": "Session ended", "session_id": session_id}

@app.get("/api/wallet/{rfid_id}")
def get_wallet(rfid_id: str):
    user = next((u for u in users if u["rfid_id"] == rfid_id), None)
    return {"balance": user["wallet_balance"], "rfid_id": rfid_id} if user else {"error": "Not found"}

@app.post("/api/wallet/topup")
def topup_wallet(data: dict):
    rfid_id = data.get("rfid_id")
    amount = data.get("amount", 0)
    user = next((u for u in users if u["rfid_id"] == rfid_id), None)
    if user:
        user["wallet_balance"] += amount
        return {"message": "Topup successful", "new_balance": user["wallet_balance"]}
    return {"error": "User not found"}

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 SMART PARKING BACKEND STARTING...")
    print("=" * 60)
    print("📍 URL: http://localhost:8000")
    print("📊 Status: http://localhost:8000/api/status")
    print("👥 Users: http://localhost:8000/api/users")
    print("🅿️  Slots: http://localhost:8000/api/slots")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
