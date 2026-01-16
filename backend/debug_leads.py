import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def debug_leads():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    leads = await db.leads.find({}).to_list(10)
    
    print(f'Found {len(leads)} leads')
    for i, lead in enumerate(leads):
        print(f'\nLead {i+1}:')
        print(f'  ID: {lead.get("id")}')
        print(f'  Stage: {lead.get("stage")}')
        print(f'  Status: {lead.get("status")}')
        print(f'  Lead Status: {lead.get("lead_status")}')
        print(f'  Has lead_status field: {"lead_status" in lead}')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_leads())
