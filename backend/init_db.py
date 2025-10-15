"""
Initialize database with sample data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import sys

async def init_database():
    """Initialize MongoDB with sample data"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.smart_parking
    
    print("🔄 Initializing Smart Parking Database...")
    
    # Clear existing data (optional - comment out to preserve data)
    # await db.users.delete_many({})
    # await db.slots.delete_many({})
    # await db.sessions.delete_many({})
    
    # Create sample users
    users = [
        {
            "rfid_id": "RFID001",
            "user_name": "John Doe",
            "vehicle_no": "MH-12-AB-1234",
            "wallet_balance": 500.0,
            "contact": "+91 9876543210",
            "email": "john@example.com",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "rfid_id": "RFID002",
            "user_name": "Jane Smith",
            "vehicle_no": "MH-12-CD-5678",
            "wallet_balance": 750.0,
            "contact": "+91 9876543211",
            "email": "jane@example.com",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "rfid_id": "RFID003",
            "user_name": "Bob Wilson",
            "vehicle_no": "MH-12-EF-9012",
            "wallet_balance": 300.0,
            "contact": "+91 9876543212",
            "email": "bob@example.com",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    for user in users:
        try:
            await db.users.update_one(
                {"rfid_id": user["rfid_id"]},
                {"$set": user},
                upsert=True
            )
            print(f"✅ User created: {user['user_name']} ({user['rfid_id']})")
        except Exception as e:
            print(f"⚠️  User {user['rfid_id']} already exists or error: {e}")
    
    # Create sample parking slots
    slots = [
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
    
    for slot in slots:
        try:
            await db.slots.update_one(
                {"slot_id": slot["slot_id"]},
                {"$set": {**slot, "last_updated": datetime.utcnow()}},
                upsert=True
            )
            print(f"✅ Slot created: {slot['slot_name']} - {'Occupied' if slot['is_occupied'] else 'Available'}")
        except Exception as e:
            print(f"⚠️  Slot {slot['slot_id']} already exists or error: {e}")
    
    # Create active sessions for occupied slots
    if await db.sessions.count_documents({"status": "active"}) == 0:
        session1 = {
            "session_id": "SESS_20250614_001",
            "rfid_id": "RFID001",
            "user_name": "John Doe",
            "vehicle_no": "MH-12-AB-1234",
            "slot_id": "A2",
            "entry_time": datetime.utcnow(),
            "exit_time": None,
            "status": "active",
            "entry_gate": "GATE_ENTRY",
            "exit_gate": None
        }
        await db.sessions.insert_one(session1)
        print(f"✅ Active session created: {session1['session_id']}")
        
        session2 = {
            "session_id": "SESS_20250614_002",
            "rfid_id": "RFID002",
            "user_name": "Jane Smith",
            "vehicle_no": "MH-12-CD-5678",
            "slot_id": "B1",
            "entry_time": datetime.utcnow(),
            "exit_time": None,
            "status": "active",
            "entry_gate": "GATE_ENTRY",
            "exit_gate": None
        }
        await db.sessions.insert_one(session2)
        print(f"✅ Active session created: {session2['session_id']}")
    
    # Create indexes
    print("🔄 Creating database indexes...")
    await db.users.create_index("rfid_id", unique=True)
    await db.slots.create_index("slot_id", unique=True)
    await db.sessions.create_index("session_id", unique=True)
    print("✅ Indexes created")
    
    # Show summary
    user_count = await db.users.count_documents({})
    slot_count = await db.slots.count_documents({})
    occupied_count = await db.slots.count_documents({"is_occupied": True})
    session_count = await db.sessions.count_documents({"status": "active"})
    
    print("\n" + "="*50)
    print("📊 DATABASE SUMMARY")
    print("="*50)
    print(f"👥 Total Users: {user_count}")
    print(f"🅿️  Total Slots: {slot_count}")
    print(f"🔴 Occupied Slots: {occupied_count}")
    print(f"🟢 Available Slots: {slot_count - occupied_count}")
    print(f"🚗 Active Sessions: {session_count}")
    print("="*50)
    print("✅ Database initialization complete!")
    print("\n🚀 You can now start the backend server:")
    print("   uvicorn app.main:app --reload --port 8000")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
