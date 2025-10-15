"""
Database Initialization Script
"""
import asyncio
from app.database import db_instance, get_connection_string, get_database_name
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_database():
    """Initialize database with indexes"""
    connection_string = get_connection_string()
    database_name = get_database_name()
ECHO is off.
    logger.info("Connecting to MongoDB...")
    await db_instance.connect_to_database(connection_string, database_name)
ECHO is off.
    logger.info("Database initialized successfully!")
    logger.info("Indexes created.")
ECHO is off.
    await db_instance.close_database_connection()

if __name__ == "__main__":
    asyncio.run(init_database())
