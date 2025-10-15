"""
MongoDB Models for RFID Smart Parking System
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2"""
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ],
        serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x)
        ))

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


# ============================================
# USER / VEHICLE MODEL
# ============================================

class User(BaseModel):
    """User/Vehicle model for parking system"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    rfid_id: str = Field(..., description="Unique RFID tag ID")
    user_name: str = Field(..., description="User's full name")
    vehicle_no: str = Field(..., description="Vehicle registration number")
    wallet_balance: float = Field(default=0.0, description="Prepaid wallet balance")
    contact: Optional[str] = Field(None, description="Contact number")
    email: Optional[str] = Field(None, description="Email address")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "rfid_id": "ABC123DEF456",
                "user_name": "John Doe",
                "vehicle_no": "MH12AB1234",
                "wallet_balance": 500.0,
                "contact": "+919876543210",
                "email": "john@example.com"
            }
        }


class UserCreate(BaseModel):
    """Schema for creating new user"""
    rfid_id: str
    user_name: str
    vehicle_no: str
    contact: Optional[str] = None
    email: Optional[str] = None
    initial_balance: float = 0.0


class UserUpdate(BaseModel):
    """Schema for updating user details"""
    user_name: Optional[str] = None
    vehicle_no: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None


# ============================================
# PARKING SESSION MODEL
# ============================================

class ParkingSession(BaseModel):
    """Parking session model tracking entry and exit"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    session_id: str = Field(..., description="Unique session identifier")
    rfid_id: str = Field(..., description="User's RFID tag")
    vehicle_no: str = Field(..., description="Vehicle number")
    entry_time: datetime = Field(default_factory=datetime.utcnow)
    entry_camera_id: Optional[str] = Field(None, description="Entry camera ID")
    entry_slot_id: Optional[str] = Field(None, description="Assigned slot ID")
    exit_time: Optional[datetime] = Field(None, description="Exit timestamp")
    exit_camera_id: Optional[str] = Field(None, description="Exit camera ID")
    duration_minutes: Optional[int] = Field(None, description="Total parking duration")
    amount_charged: Optional[float] = Field(None, description="Total fee charged")
    wallet_balance_before: float = Field(..., description="Balance before deduction")
    wallet_balance_after: Optional[float] = Field(None, description="Balance after deduction")
    status: str = Field(default="active", description="Session status: active, completed, cancelled")
    notes: Optional[str] = Field(None, description="Additional notes")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
        json_schema_extra = {
            "example": {
                "session_id": "SESS_20250115_001",
                "rfid_id": "ABC123DEF456",
                "vehicle_no": "MH12AB1234",
                "entry_camera_id": "CAM_01",
                "entry_slot_id": "SLOT_A1",
                "status": "active",
                "wallet_balance_before": 500.0
            }
        }


class SessionEntry(BaseModel):
    """Schema for recording entry"""
    rfid_id: str
    camera_id: Optional[str] = None
    slot_id: Optional[str] = None


class SessionExit(BaseModel):
    """Schema for recording exit"""
    rfid_id: str
    camera_id: Optional[str] = None


class SessionReceipt(BaseModel):
    """E-Receipt for completed session"""
    session_id: str
    rfid_id: str
    vehicle_no: str
    entry_time: datetime
    exit_time: datetime
    duration_minutes: int
    duration_display: str  # "2 hours 30 minutes"
    amount_charged: float
    wallet_balance_before: float
    wallet_balance_after: float
    tariff_rate: float
    transaction_id: str


# ============================================
# PARKING SLOT MODEL
# ============================================

class SlotPolygon(BaseModel):
    """Polygon coordinates for slot detection"""
    points: List[List[int]] = Field(..., description="List of [x, y] coordinates")


class ParkingSlot(BaseModel):
    """Parking slot model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    slot_id: str = Field(..., description="Unique slot identifier")
    camera_id: str = Field(..., description="Camera monitoring this slot")
    slot_name: str = Field(..., description="Human-readable slot name")
    polygon_coords: Optional[List[List[int]]] = Field(None, description="Polygon coordinates [[x,y],...]")
    is_occupied: bool = Field(default=False, description="Current occupancy status")
    last_occupied_time: Optional[datetime] = Field(None, description="Last time slot was occupied")
    last_freed_time: Optional[datetime] = Field(None, description="Last time slot became free")
    occupancy_history: List[dict] = Field(default_factory=list, description="Historical occupancy data")
    slot_type: str = Field(default="standard", description="Slot type: standard, compact, disabled, etc.")
    is_active: bool = Field(default=True, description="Whether slot is active/available")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
        json_schema_extra = {
            "example": {
                "slot_id": "SLOT_A1",
                "camera_id": "CAM_01",
                "slot_name": "A1",
                "polygon_coords": [[100, 100], [200, 100], [200, 200], [100, 200]],
                "is_occupied": False,
                "slot_type": "standard"
            }
        }


class SlotUpdate(BaseModel):
    """Schema for updating slot occupancy"""
    slot_id: str
    camera_id: str
    is_occupied: bool
    timestamp: Optional[datetime] = None
    confidence: Optional[float] = None


# ============================================
# WALLET TRANSACTION MODEL
# ============================================

class WalletTransaction(BaseModel):
    """Wallet transaction model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    transaction_id: str = Field(..., description="Unique transaction ID")
    rfid_id: str = Field(..., description="User's RFID tag")
    amount: float = Field(..., description="Transaction amount (positive for credit, negative for debit)")
    transaction_type: str = Field(..., description="Type: topup, deduction, refund, admin_adjustment")
    balance_before: float = Field(..., description="Balance before transaction")
    balance_after: float = Field(..., description="Balance after transaction")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = Field(None, description="Associated session ID if applicable")
    payment_method: Optional[str] = Field(None, description="Payment method: cash, card, upi, etc.")
    payment_reference: Optional[str] = Field(None, description="External payment reference")
    notes: Optional[str] = Field(None, description="Transaction notes")
    status: str = Field(default="completed", description="Status: pending, completed, failed, reversed")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
        json_schema_extra = {
            "example": {
                "transaction_id": "TXN_20250115_001",
                "rfid_id": "ABC123DEF456",
                "amount": 100.0,
                "transaction_type": "topup",
                "balance_before": 500.0,
                "balance_after": 600.0,
                "payment_method": "upi"
            }
        }


class WalletTopup(BaseModel):
    """Schema for wallet top-up"""
    rfid_id: str
    amount: float = Field(..., gt=0, description="Amount to add (must be positive)")
    payment_method: Optional[str] = Field("cash", description="Payment method")
    payment_reference: Optional[str] = Field(None, description="Payment reference/transaction ID")


class WalletBalance(BaseModel):
    """Schema for wallet balance response"""
    rfid_id: str
    user_name: str
    vehicle_no: str
    wallet_balance: float
    last_updated: datetime


# ============================================
# SYSTEM LOG MODEL
# ============================================

class SystemLog(BaseModel):
    """System log model for events and debugging"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    log_level: str = Field(..., description="Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL")
    component: str = Field(..., description="Component: vision, backend, aggregator, esp32")
    event_type: str = Field(..., description="Event type: slot_update, session_start, gate_open, etc.")
    message: str = Field(..., description="Log message")
    details: Optional[dict] = Field(None, description="Additional details as JSON")
    rfid_id: Optional[str] = Field(None, description="Associated RFID if applicable")
    session_id: Optional[str] = Field(None, description="Associated session if applicable")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


# ============================================
# SYSTEM STATUS MODEL
# ============================================

class SystemStatus(BaseModel):
    """System status response"""
    any_slot_available: bool
    total_slots: int
    occupied_slots: int
    free_slots: int
    active_sessions: int
    cameras_online: List[str]
    mqtt_connected: bool
    database_connected: bool
    last_updated: datetime


class SlotStatus(BaseModel):
    """Individual slot status"""
    slot_id: str
    slot_name: str
    camera_id: str
    is_occupied: bool
    last_update: Optional[datetime] = None
    slot_type: str
