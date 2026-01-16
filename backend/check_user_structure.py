import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def check_user_structure():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    users = await db.users.find({}).to_list(5)
    print(f'Found {len(users)} users')
    
    if users:
        print('\nFirst user structure:')
        for key, value in users[0].items():
            print(f'  {key}: {value} ({type(value).__name__})')
        
        print('\nStatus field check:')
        for user in users:
            status = user.get('status', 'MISSING')
            print(f'  {user.get("full_name", "Unknown")}: status="{status}"')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_user_structure())
