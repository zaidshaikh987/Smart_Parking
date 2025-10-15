"""
Simplified Backend for Quick Testing
Works without MongoDB initially
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn

app = FastAPI(title="Smart Parking Backend", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory data
users_db = [
    {"rfid_id": "RFID001", "user_name": "John Doe", "vehicle_no": "MH-12-AB-1234", "wallet_balance": 500.0, "contact": "+91 9876543210", "email": "john@example.com", "is_active": True},
    {"rfid_id": "RFID002", "user_name": "Jane Smith", "vehicle_no": "MH-12-CD-5678", "wallet_balance": 750.0, "contact": "+91 9876543211", "email": "jane@example.com", "is_active": True},
    {"rfid_id": "RFID003", "user_name": "Bob Wilson", "vehicle_no": "MH-12-EF-9012", "wallet_balance": 300.0, "contact": "+91 9876543212", "email": "bob@example.com", "is_active": True},
]

slots_db = [
    {"slot_id": "A1", "slot_name": "A1", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_01"},
    {"slot_id": "A2", "slot_name": "A2", "is_occupied": True, "slot_type": "standard", "camera_id": "CAM_01"},
    {"slot_id": "A3", "slot_name": "A3", "is_occupied": False, "slot_type": "compact", "camera_id": "CAM_01"},
    {"slot_id": "A4", "slot_name": "A4", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_01"},
    {"slot_id": "B1", "slot_name": "B1", "is_occupied": True, "slot_type": "standard", "camera_id": "CAM_02"},
    {"slot_id": "B2", "slot_name": "B2", "is_occupied": False, "slot_type": "disabled", "camera_id": "CAM_02"},
    {"slot_id": "B3", "slot_name": "B3", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_02"},
    {"slot_id": "B4", "slot_name": "B4", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_02"},
    {"slot_id": "C1", "slot_name": "C1", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_03"},
    {"slot_id": "C2", "slot_name": "C2", "is_occupied": False, "slot_type": "standard", "camera_id": "CAM_03"},
]

sessions_db = [
    {"session_id": "SESS_001", "rfid_id": "RFID001", "user_name": "John Doe", "vehicle_no": "MH-12-AB-1234", "slot_id": "A2", "entry_time": datetime.utcnow().isoformat(), "status": "active"},
    {"session_id": "SESS_002", "rfid_id": "RFID002", "user_name": "Jane Smith", "vehicle_no": "MH-12-CD-5678", "slot_id": "B1", "entry_time": datetime.utcnow().isoformat(), "status": "active"},
]

@app.get("/")
def root():
    return {"service": "Smart Parking Backend", "version": "2.0.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/status")
def get_status():
    occupied = sum(1 for s in slots_db if s["is_occupied"])
    total = len(slots_db)
    free = total - occupied
    return {
        "total_slots": total,
        "occupied_slots": occupied,
        "free_slots": free,
        "occupancy_rate": f"{(occupied/total*100):.1f}%",
        "active_sessions": len([s for s in sessions_db if s["status"] == "active"]),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/users")
def get_users():
    return users_db

@app.get("/api/users/{rfid_id}")
def get_user(rfid_id: str):
    user = next((u for u in users_db if u["rfid_id"] == rfid_id), None)
    if user:
        return user
    return {"error": "User not found"}

@app.post("/api/users")
def create_user(user: dict):
    users_db.append({**user, "is_active": True})
    return {"message": "User created", "rfid_id": user.get("rfid_id")}

@app.get("/api/slots")
def get_slots():
    return slots_db

@app.patch("/api/slots/{slot_id}")
def update_slot(slot_id: str, update: dict):
    slot = next((s for s in slots_db if s["slot_id"] == slot_id), None)
    if slot:
        slot.update(update)
        return {"message": "Slot updated", "slot": slot}
    return {"error": "Slot not found"}

@app.get("/api/sessions/active")
def get_active_sessions():
    return [s for s in sessions_db if s["status"] == "active"]

@app.get("/api/wallet/{rfid_id}")
def get_wallet(rfid_id: str):
    user = next((u for u in users_db if u["rfid_id"] == rfid_id), None)
    if user:
        return {"balance": user["wallet_balance"], "rfid_id": rfid_id}
    return {"error": "User not found"}

@app.post("/api/wallet/topup")
def topup_wallet(data: dict):
    rfid_id = data.get("rfid_id")
    amount = data.get("amount", 0)
    user = next((u for u in users_db if u["rfid_id"] == rfid_id), None)
    if user:
        user["wallet_balance"] += amount
        return {"message": "Top-up successful", "new_balance": user["wallet_balance"]}
    return {"error": "User not found"}

if __name__ == "__main__":
    print("🔧 Starting Simplified Backend...")
    print("🌐 Available at: http://localhost:8000")
    print("📊 Status: http://localhost:8000/api/status")
    print("="*50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
