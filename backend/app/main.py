"""
RFID Smart Parking System - FastAPI Backend
Main Application Entry Point
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Dict
import uuid
import logging

from .database import db_instance, get_database, get_connection_string, get_database_name
from .models import (
    User, UserCreate, UserUpdate,
    ParkingSession, SessionEntry, SessionExit, SessionReceipt,
    ParkingSlot, SlotUpdate, SlotStatus,
    WalletTransaction, WalletTopup, WalletBalance,
    SystemLog, SystemStatus
)
from .services.billing import billing_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting RFID Smart Parking System Backend")
    connection_string = get_connection_string()
    database_name = get_database_name()
    await db_instance.connect_to_database(connection_string, database_name)
    logger.info("Backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down backend")
    await db_instance.close_database_connection()
    logger.info("Backend shut down complete")


# Initialize FastAPI app
app = FastAPI(
    title="RFID Smart Parking System API",
    description="Complete backend API for RFID-based smart parking with vision detection",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# UTILITY FUNCTIONS
# ============================================

async def log_event(
    log_level: str,
    component: str,
    event_type: str,
    message: str,
    details: Dict = None,
    rfid_id: str = None,
    session_id: str = None
):
    """Log system event to database"""
    try:
        db = await get_database()
        log_entry = {
            "timestamp": datetime.utcnow(),
            "log_level": log_level,
            "component": component,
            "event_type": event_type,
            "message": message,
            "details": details,
            "rfid_id": rfid_id,
            "session_id": session_id
        }
        await db.system_logs.insert_one(log_entry)
    except Exception as e:
        logger.error(f"Failed to log event: {e}")


def generate_session_id() -> str:
    """Generate unique session ID"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"SESS_{timestamp}_{unique_id}"


def generate_transaction_id() -> str:
    """Generate unique transaction ID"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"TXN_{timestamp}_{unique_id}"


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - Health check"""
    return {
        "service": "RFID Smart Parking System",
        "version": "2.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    try:
        db = await get_database()
        # Test database connection
        await db.command('ping')
        db_connected = True
    except:
        db_connected = False
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database_connected": db_connected,
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================
# USER MANAGEMENT ENDPOINTS
# ============================================

@app.post("/api/users", response_model=Dict, tags=["Users"], status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create new user/vehicle registration"""
    try:
        db = await get_database()
        
        # Check if RFID already exists
        existing_user = await db.users.find_one({"rfid_id": user.rfid_id})
        if existing_user:
            raise HTTPException(status_code=400, detail="RFID tag already registered")
        
        # Create user document
        user_doc = {
            "rfid_id": user.rfid_id,
            "user_name": user.user_name,
            "vehicle_no": user.vehicle_no,
            "wallet_balance": user.initial_balance,
            "contact": user.contact,
            "email": user.email,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        
        result = await db.users.insert_one(user_doc)
        
        await log_event("INFO", "backend", "user_created", 
                       f"New user created: {user.rfid_id}", rfid_id=user.rfid_id)
        
        return {
            "message": "User created successfully",
            "rfid_id": user.rfid_id,
            "user_id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{rfid_id}", response_model=Dict, tags=["Users"])
async def get_user(rfid_id: str):
    """Get user details by RFID"""
    try:
        db = await get_database()
        user = await db.users.find_one({"rfid_id": rfid_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user['_id'] = str(user['_id'])
        return user
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENTRY/EXIT ENDPOINTS
# ============================================

@app.post("/api/entry", response_model=Dict, tags=["Entry/Exit"])
async def record_entry(entry: SessionEntry):
    """Record vehicle entry and start parking session"""
    try:
        db = await get_database()
        
        # Get user details
        user = await db.users.find_one({"rfid_id": entry.rfid_id})
        if not user:
            raise HTTPException(status_code=404, detail="RFID not registered. Please register first.")
        
        # Check for active session
        active_session = await db.sessions.find_one({
            "rfid_id": entry.rfid_id,
            "status": "active"
        })
        
        if active_session:
            raise HTTPException(status_code=400, detail="User already has an active parking session")
        
        # Check slot availability
        if entry.slot_id:
            slot = await db.slots.find_one({"slot_id": entry.slot_id})
            if slot and slot.get("is_occupied"):
                raise HTTPException(status_code=400, detail="Selected slot is occupied")
        
        # Create new session
        session_id = generate_session_id()
        entry_time = datetime.utcnow()
        
        session_doc = {
            "session_id": session_id,
            "rfid_id": entry.rfid_id,
            "vehicle_no": user["vehicle_no"],
            "entry_time": entry_time,
            "entry_camera_id": entry.camera_id,
            "entry_slot_id": entry.slot_id,
            "exit_time": None,
            "duration_minutes": None,
            "amount_charged": None,
            "wallet_balance_before": user["wallet_balance"],
            "wallet_balance_after": None,
            "status": "active",
            "notes": None
        }
        
        await db.sessions.insert_one(session_doc)
        
        # Update slot if specified
        if entry.slot_id:
            await db.slots.update_one(
                {"slot_id": entry.slot_id},
                {
                    "$set": {
                        "is_occupied": True,
                        "last_occupied_time": entry_time
                    },
                    "$push": {
                        "occupancy_history": {
                            "timestamp": entry_time,
                            "occupied": True,
                            "session_id": session_id
                        }
                    }
                }
            )
        
        await log_event("INFO", "backend", "entry_recorded",
                       f"Entry recorded for {entry.rfid_id}",
                       details={"session_id": session_id},
                       rfid_id=entry.rfid_id,
                       session_id=session_id)
        
        return {
            "message": "Entry recorded successfully",
            "session_id": session_id,
            "rfid_id": entry.rfid_id,
            "vehicle_no": user["vehicle_no"],
            "entry_time": entry_time.isoformat(),
            "wallet_balance": user["wallet_balance"],
            "status": "active"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/exit", response_model=SessionReceipt, tags=["Entry/Exit"])
async def record_exit(exit_data: SessionExit):
    """Record vehicle exit, calculate fee, and generate receipt"""
    try:
        db = await get_database()
        
        # Find active session
        session = await db.sessions.find_one({
            "rfid_id": exit_data.rfid_id,
            "status": "active"
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="No active parking session found")
        
        # Get user
        user = await db.users.find_one({"rfid_id": exit_data.rfid_id})
        
        # Calculate fee
        exit_time = datetime.utcnow()
        fee_details = billing_service.calculate_fee(session["entry_time"], exit_time)
        amount_charged = fee_details["amount"]
        duration_minutes = fee_details["duration_minutes"]
        
        # Check wallet balance
        wallet_balance = user["wallet_balance"]
        if wallet_balance < amount_charged:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Required: ₹{amount_charged}, Available: ₹{wallet_balance}"
            )
        
        # Deduct from wallet
        new_balance = wallet_balance - amount_charged
        
        # Generate transaction
        transaction_id = generate_transaction_id()
        transaction_doc = {
            "transaction_id": transaction_id,
            "rfid_id": exit_data.rfid_id,
            "amount": -amount_charged,
            "transaction_type": "deduction",
            "balance_before": wallet_balance,
            "balance_after": new_balance,
            "timestamp": exit_time,
            "session_id": session["session_id"],
            "payment_method": "wallet",
            "status": "completed"
        }
        
        await db.transactions.insert_one(transaction_doc)
        
        # Update user wallet
        await db.users.update_one(
            {"rfid_id": exit_data.rfid_id},
            {
                "$set": {
                    "wallet_balance": new_balance,
                    "updated_at": exit_time
                }
            }
        )
        
        # Update session
        await db.sessions.update_one(
            {"session_id": session["session_id"]},
            {
                "$set": {
                    "exit_time": exit_time,
                    "exit_camera_id": exit_data.camera_id,
                    "duration_minutes": duration_minutes,
                    "amount_charged": amount_charged,
                    "wallet_balance_after": new_balance,
                    "status": "completed"
                }
            }
        )
        
        # Update slot if specified
        if session.get("entry_slot_id"):
            await db.slots.update_one(
                {"slot_id": session["entry_slot_id"]},
                {
                    "$set": {
                        "is_occupied": False,
                        "last_freed_time": exit_time
                    },
                    "$push": {
                        "occupancy_history": {
                            "timestamp": exit_time,
                            "occupied": False,
                            "session_id": session["session_id"]
                        }
                    }
                }
            )
        
        await log_event("INFO", "backend", "exit_recorded",
                       f"Exit recorded for {exit_data.rfid_id}, charged ₹{amount_charged}",
                       details={"transaction_id": transaction_id},
                       rfid_id=exit_data.rfid_id,
                       session_id=session["session_id"])
        
        # Generate receipt
        receipt = SessionReceipt(
            session_id=session["session_id"],
            rfid_id=exit_data.rfid_id,
            vehicle_no=session["vehicle_no"],
            entry_time=session["entry_time"],
            exit_time=exit_time,
            duration_minutes=duration_minutes,
            duration_display=billing_service.format_duration(duration_minutes),
            amount_charged=amount_charged,
            wallet_balance_before=wallet_balance,
            wallet_balance_after=new_balance,
            tariff_rate=billing_service.tariff_per_hour,
            transaction_id=transaction_id
        )
        
        return receipt
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording exit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# WALLET ENDPOINTS
# ============================================

@app.get("/api/wallet/{rfid_id}", response_model=WalletBalance, tags=["Wallet"])
async def get_wallet_balance(rfid_id: str):
    """Get wallet balance for user"""
    try:
        db = await get_database()
        user = await db.users.find_one({"rfid_id": rfid_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return WalletBalance(
            rfid_id=user["rfid_id"],
            user_name=user["user_name"],
            vehicle_no=user["vehicle_no"],
            wallet_balance=user["wallet_balance"],
            last_updated=user.get("updated_at", user["created_at"])
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching wallet balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/wallet/topup", response_model=Dict, tags=["Wallet"])
async def topup_wallet(topup: WalletTopup):
    """Top-up user wallet"""
    try:
        db = await get_database()
        
        # Get user
        user = await db.users.find_one({"rfid_id": topup.rfid_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate new balance
        current_balance = user["wallet_balance"]
        new_balance = current_balance + topup.amount
        
        # Create transaction
        transaction_id = generate_transaction_id()
        transaction_doc = {
            "transaction_id": transaction_id,
            "rfid_id": topup.rfid_id,
            "amount": topup.amount,
            "transaction_type": "topup",
            "balance_before": current_balance,
            "balance_after": new_balance,
            "timestamp": datetime.utcnow(),
            "payment_method": topup.payment_method,
            "payment_reference": topup.payment_reference,
            "status": "completed"
        }
        
        await db.transactions.insert_one(transaction_doc)
        
        # Update user wallet
        await db.users.update_one(
            {"rfid_id": topup.rfid_id},
            {
                "$set": {
                    "wallet_balance": new_balance,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        await log_event("INFO", "backend", "wallet_topup",
                       f"Wallet topped up: {topup.rfid_id}, amount: ₹{topup.amount}",
                       details={"transaction_id": transaction_id},
                       rfid_id=topup.rfid_id)
        
        return {
            "message": "Wallet topped up successfully",
            "transaction_id": transaction_id,
            "rfid_id": topup.rfid_id,
            "amount_added": topup.amount,
            "previous_balance": current_balance,
            "new_balance": new_balance
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error topping up wallet: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/wallet/history/{rfid_id}", response_model=List[Dict], tags=["Wallet"])
async def get_transaction_history(rfid_id: str, limit: int = 20):
    """Get transaction history for user"""
    try:
        db = await get_database()
        
        transactions = await db.transactions.find(
            {"rfid_id": rfid_id}
        ).sort("timestamp", -1).limit(limit).to_list(length=limit)
        
        # Convert ObjectId to string
        for txn in transactions:
            txn['_id'] = str(txn['_id'])
            txn['timestamp'] = txn['timestamp'].isoformat()
        
        return transactions
    
    except Exception as e:
        logger.error(f"Error fetching transaction history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SLOT MANAGEMENT ENDPOINTS
# ============================================

@app.post("/api/slots/update", response_model=Dict, tags=["Slots"])
async def update_slot_occupancy(slot_update: SlotUpdate):
    """Update slot occupancy status (called by vision service)"""
    try:
        db = await get_database()
        
        update_time = slot_update.timestamp or datetime.utcnow()
        
        # Update or create slot
        update_doc = {
            "$set": {
                "is_occupied": slot_update.is_occupied,
                "last_occupied_time" if slot_update.is_occupied else "last_freed_time": update_time
            },
            "$setOnInsert": {
                "slot_id": slot_update.slot_id,
                "camera_id": slot_update.camera_id,
                "slot_name": slot_update.slot_id,
                "is_active": True
            }
        }
        
        result = await db.slots.update_one(
            {"slot_id": slot_update.slot_id},
            update_doc,
            upsert=True
        )
        
        await log_event("DEBUG", "vision", "slot_update",
                       f"Slot {slot_update.slot_id} updated: {'occupied' if slot_update.is_occupied else 'free'}",
                       details={"camera_id": slot_update.camera_id})
        
        return {
            "message": "Slot updated successfully",
            "slot_id": slot_update.slot_id,
            "is_occupied": slot_update.is_occupied
        }
    
    except Exception as e:
        logger.error(f"Error updating slot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/slots", response_model=List[SlotStatus], tags=["Slots"])
async def get_all_slots():
    """Get all slot statuses"""
    try:
        db = await get_database()
        
        slots = await db.slots.find({"is_active": True}).to_list(length=100)
        
        slot_statuses = []
        for slot in slots:
            slot_statuses.append(SlotStatus(
                slot_id=slot["slot_id"],
                slot_name=slot.get("slot_name", slot["slot_id"]),
                camera_id=slot["camera_id"],
                is_occupied=slot.get("is_occupied", False),
                last_update=slot.get("last_occupied_time") or slot.get("last_freed_time"),
                slot_type=slot.get("slot_type", "standard")
            ))
        
        return slot_statuses
    
    except Exception as e:
        logger.error(f"Error fetching slots: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# STATUS ENDPOINTS
# ============================================

@app.get("/api/status", response_model=SystemStatus, tags=["Status"])
async def get_system_status():
    """Get overall system status"""
    try:
        db = await get_database()
        
        # Count slots
        total_slots = await db.slots.count_documents({"is_active": True})
        occupied_slots = await db.slots.count_documents({"is_active": True, "is_occupied": True})
        free_slots = total_slots - occupied_slots
        
        # Count active sessions
        active_sessions = await db.sessions.count_documents({"status": "active"})
        
        # Get unique cameras
        cameras = await db.slots.distinct("camera_id")
        
        return SystemStatus(
            any_slot_available=free_slots > 0,
            total_slots=total_slots,
            occupied_slots=occupied_slots,
            free_slots=free_slots,
            active_sessions=active_sessions,
            cameras_online=cameras,
            mqtt_connected=True,  # Will be updated by aggregator
            database_connected=True,
            last_updated=datetime.utcnow()
        )
    
    except Exception as e:
        logger.error(f"Error fetching system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions/active", response_model=List[Dict], tags=["Sessions"])
async def get_active_sessions():
    """Get all active parking sessions"""
    try:
        db = await get_database()
        
        sessions = await db.sessions.find(
            {"status": "active"}
        ).sort("entry_time", -1).to_list(length=100)
        
        for session in sessions:
            session['_id'] = str(session['_id'])
            session['entry_time'] = session['entry_time'].isoformat()
        
        return sessions
    
    except Exception as e:
        logger.error(f"Error fetching active sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/billing/info", response_model=Dict, tags=["Billing"])
async def get_billing_info():
    """Get current billing configuration"""
    return billing_service.get_billing_info()


# ============================================
# PAYMENT ENDPOINTS
# ============================================

from .services.payment import payment_service

@app.post("/api/payment/create-order", response_model=Dict, tags=["Payment"])
async def create_payment_order(data: Dict):
    """Create Razorpay order for wallet top-up"""
    try:
        rfid_id = data.get('rfid_id')
        amount = data.get('amount')
        
        if not rfid_id or not amount:
            raise HTTPException(status_code=400, detail="RFID and amount required")
        
        # Generate receipt ID
        receipt_id = generate_transaction_id()
        
        # Create order
        order = payment_service.create_order(
            amount=float(amount),
            receipt_id=receipt_id,
            notes={'rfid_id': rfid_id}
        )
        
        if not order:
            raise HTTPException(status_code=500, detail="Failed to create payment order")
        
        return order
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payment/verify", response_model=Dict, tags=["Payment"])
async def verify_payment(data: Dict):
    """Verify Razorpay payment signature"""
    try:
        order_id = data.get('razorpay_order_id')
        payment_id = data.get('razorpay_payment_id')
        signature = data.get('razorpay_signature')
        
        if not all([order_id, payment_id, signature]):
            raise HTTPException(status_code=400, detail="Missing payment details")
        
        is_valid = payment_service.verify_payment(order_id, payment_id, signature)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        return {"verified": True, "payment_id": payment_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
