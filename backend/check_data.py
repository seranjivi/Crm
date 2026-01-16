import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def check_current_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    leads = await db.leads.find({}).to_list(10)
    
    for lead in leads:
        print(f'Lead ID: {lead.get("id")}')
        print(f'  Stage: {lead.get("stage")}')
        print(f'  Status: {lead.get("status")}')
        print(f'  Lead Status: {lead.get("lead_status")}')
        print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_current_data())
