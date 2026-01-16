from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

_client = None
_db = None

def init_db():
    global _client, _db
    try:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
        db_name = os.environ.get('DB_NAME', 'test_database')
        
        # Configure connection options for Atlas MongoDB
        connection_options = {
            'serverSelectionTimeoutMS': 5000,
            'connectTimeoutMS': 10000,
            'socketTimeoutMS': 10000,
            'maxPoolSize': 50,
            'minPoolSize': 10
        }
        
        # Add retry writes for Atlas
        if 'mongodb+srv://' in mongo_url or 'mongodb.net' in mongo_url:
            connection_options['retryWrites'] = True
            connection_options['w'] = 'majority'
        
        _client = AsyncIOMotorClient(mongo_url, **connection_options)
        _db = _client[db_name]
        
        logger.info(f"MongoDB connection initialized for database: {db_name}")
        return _db
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB connection: {str(e)}")
        raise

def get_db():
    global _db
    if _db is None:
        init_db()
    return _db

async def check_db_connection():
    """Check if database connection is healthy"""
    try:
        db = get_db()
        await db.command('ping')
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False
