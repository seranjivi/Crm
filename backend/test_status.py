import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from utils.lead_status import calculate_lead_status
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def test_status_calculation():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get a sample lead
    lead = await db.leads.find_one({'stage': 'Qualified'})
    if lead:
        print('Sample lead before update:')
        print(f'  Stage: {lead.get("stage")}')
        print(f'  Status: {lead.get("status")}')
        print(f'  Next Followup: {lead.get("next_followup")}')
        
        # Calculate new status
        new_status, reason = calculate_lead_status(
            lead.get('stage'),
            lead.get('next_followup'),
            lead.get('status')
        )
        
        print(f'Calculated status: {new_status}')
        print(f'Reason: {reason}')
        
        # Update the lead
        await db.leads.update_one(
            {'id': lead['id']},
            {'$set': {'lead_status': new_status, 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )
        
        print('Lead updated with new lead_status field')
        
        # Check updated lead
        updated_lead = await db.leads.find_one({'id': lead['id']})
        print(f'Updated lead_status: {updated_lead.get("lead_status")}')
        
    else:
        print('No qualified leads found')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_status_calculation())
