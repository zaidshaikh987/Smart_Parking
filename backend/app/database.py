"""
MongoDB Database Connection and Configuration
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Database:
    """MongoDB Database Manager"""
    client: Optional[AsyncIOMotorClient] = None
    database = None

    def __init__(self):
        self.client = None
        self.database = None

    async def connect_to_database(self, connection_string: str, database_name: str):
        """
        Connect to MongoDB database
        
        Args:
            connection_string: MongoDB connection URI
            database_name: Name of the database
        """
        try:
            logger.info(f"Connecting to MongoDB at {connection_string}")
            self.client = AsyncIOMotorClient(connection_string)
            self.database = self.client[database_name]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB database: {database_name}")
            
            # Create indexes
            await self.create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    async def close_database_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

    async def create_indexes(self):
        """Create database indexes for optimal performance"""
        try:
            # Users collection indexes
            await self.database.users.create_index("rfid_id", unique=True)
            await self.database.users.create_index("vehicle_no")
            
            # Sessions collection indexes
            await self.database.sessions.create_index("session_id", unique=True)
            await self.database.sessions.create_index("rfid_id")
            await self.database.sessions.create_index("status")
            await self.database.sessions.create_index([("entry_time", -1)])
            
            # Slots collection indexes
            await self.database.slots.create_index("slot_id", unique=True)
            await self.database.slots.create_index("camera_id")
            await self.database.slots.create_index("is_occupied")
            
            # Transactions collection indexes
            await self.database.transactions.create_index("transaction_id", unique=True)
            await self.database.transactions.create_index("rfid_id")
            await self.database.transactions.create_index([("timestamp", -1)])
            
            # System logs collection indexes
            await self.database.system_logs.create_index([("timestamp", -1)])
            await self.database.system_logs.create_index("component")
            await self.database.system_logs.create_index("log_level")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Error creating indexes: {e}")

    def get_collection(self, collection_name: str):
        """Get a collection from the database"""
        if not self.database:
            raise Exception("Database not connected")
        return self.database[collection_name]


# Global database instance
db_instance = Database()


async def get_database():
    """Dependency to get database instance"""
    if not db_instance.database:
        raise Exception("Database not initialized")
    return db_instance.database


def get_connection_string() -> str:
    """
    Get MongoDB connection string from environment or config
    Priority: ENV variable > config file > default
    """
    # Try environment variable first
    connection_string = os.getenv("MONGODB_URI")
    
    if connection_string:
        return connection_string
    
    # Try loading from config file
    try:
        import yaml
        config_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "config",
            "database.yaml"
        )
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                return config.get("mongodb", {}).get("uri", "mongodb://localhost:27017")
    except Exception as e:
        logger.warning(f"Could not load config file: {e}")
    
    # Default to localhost
    return "mongodb://localhost:27017"


def get_database_name() -> str:
    """Get database name from environment or config"""
    db_name = os.getenv("MONGODB_DATABASE")
    
    if db_name:
        return db_name
    
    try:
        import yaml
        config_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "config",
            "database.yaml"
        )
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                return config.get("mongodb", {}).get("database", "smart_parking")
    except Exception:
        pass
    
    return "smart_parking"
