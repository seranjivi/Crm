import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from utils.lead_status import calculate_lead_status
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def update_all_lead_statuses():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all leads
    leads = await db.leads.find({}).to_list(1000)
    
    print(f'Found {len(leads)} leads to update')
    
    updated_count = 0
    for lead in leads:
        # Calculate new status
        new_status, reason = calculate_lead_status(
            lead.get('stage'),
            lead.get('next_followup'),
            lead.get('status')
        )
        
        # Update the lead if status is different
        if new_status != lead.get('lead_status'):
            await db.leads.update_one(
                {'id': lead['id']},
                {'$set': {'lead_status': new_status, 'updated_at': datetime.now(timezone.utc).isoformat()}}
            )
            updated_count += 1
            print(f'Updated lead {lead["id"]}: {lead.get("stage")} -> {new_status}')
    
    print(f'Updated {updated_count} leads with correct lead_status')
    client.close()

if __name__ == "__main__":
    asyncio.run(update_all_lead_statuses())
