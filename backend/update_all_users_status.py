import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def update_all_users_to_active():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all users
    users = await db.users.find({}).to_list(50)
    print(f'Found {len(users)} users')
    
    # Update all users to have status "Active"
    result = await db.users.update_many(
        {},  # Empty filter to match all documents
        {"$set": {"status": "Active"}}
    )
    
    print(f'Updated {result.modified_count} users to Active status')
    
    # Verify the update
    updated_users = await db.users.find({}).to_list(50)
    print(f'\nUpdated users:')
    for user in updated_users:
        print(f'  {user.get("full_name", "Unknown")} - Status: {user.get("status", "No status")}')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_all_users_to_active())
