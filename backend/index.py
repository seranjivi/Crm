# create_indexes.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from database import MONGODB_URL, DATABASE_NAME

async def create_opportunity_indexes():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Create unique index on opportunity_id
    await db.opportunities.create