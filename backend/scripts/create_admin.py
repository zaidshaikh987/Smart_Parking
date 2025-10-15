"""
Create Admin User for Dashboard
"""
import asyncio
from app.database import db_instance, get_connection_string, get_database_name
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_admin():
    """Create admin RFID user"""
    connection_string = get_connection_string()
    database_name = get_database_name()
ECHO is off.
    await db_instance.connect_to_database(connection_string, database_name)
    db = db_instance.database
ECHO is off.
    # Check if admin exists
    admin = await db.users.find_one({"rfid_id": "ADMIN001"})
ECHO is off.
    if admin:
        logger.info("Admin user already exists")
    else:
        admin_doc = {
            "rfid_id": "ADMIN001",
            "user_name": "Admin User",
            "vehicle_no": "ADMIN-CAR-001",
            "wallet_balance": 10000.0,
            "contact": "+919999999999",
            "email": "admin@parking.com",
            "is_active": True
        }
ECHO is off.
        await db.users.insert_one(admin_doc)
        logger.info("✓ Admin user created: ADMIN001")
        logger.info("  Email: admin@parking.com")
        logger.info("  Initial Balance: ₹10,000")
ECHO is off.
    await db_instance.close_database_connection()

if __name__ == "__main__":
    asyncio.run(create_admin())
