import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def test_users_api():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    users = await db.users.find({}).to_list(20)
    print(f'Found {len(users)} users')
    
    sales_roles = ['Sales Head', 'Presales Consultant', 'Presales Lead', 'Presales Manager', 'Account Manager']
    
    print(f'\nTesting sales roles filter:')
    for user in users:
        role = user.get('role', 'No role')
        status = user.get('status', 'No status')
        is_sales_role = role in sales_roles
        is_active = status == 'Active'
        
        if is_sales_role and is_active:
            print(f'  YES {user.get("full_name", "Unknown")} - Role: {role} - Status: {status}')
        elif is_sales_role:
            print(f'  NO {user.get("full_name", "Unknown")} - Role: {role} - Status: {status} (Inactive)')
        else:
            print(f'    {user.get("full_name", "Unknown")} - Role: {role} - Status: {status} (Not sales role)')
    
    qualified_users = [u for u in users if u.get('role') in sales_roles and u.get('status') == 'Active']
    print(f'\nQualified users for Lead Assignee: {len(qualified_users)}')
    
    for user in qualified_users:
        print(f'  - {user.get("full_name")} ({user.get("role")})')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_users_api())
