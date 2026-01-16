import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def check_users():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    users = await db.users.find({}).to_list(20)
    print(f'Found {len(users)} users')
    
    sales_roles = ['Sales Head', 'Presales Consultant', 'Presales Lead', 'Presales Manager', 'Account Manager']
    
    for user in users:
        print(f'  {user.get("full_name", "Unknown")} - Role: {user.get("role", "No role")} - Status: {user.get("status", "No status")}')
        if user.get('role') in sales_roles and user.get('status') == 'Active':
            print(f'    -> This user should appear in Lead Assignee dropdown')
    
    print(f'\nUsers with sales roles and active status:')
    qualified_users = [u for u in users if u.get('role') in sales_roles and u.get('status') == 'Active']
    for user in qualified_users:
        print(f'  - {user.get("full_name")} ({user.get("role")})')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
