import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from utils.lead_status import calculate_lead_status
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def simulate_api_response():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Simulate what the API does
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    
    print(f"Found {len(leads)} leads")
    
    # Add task_id to existing leads if missing and update status calculation
    for lead in leads:
        if not lead.get("task_id"):
            lead["task_id"] = f"LEAD-{lead.get('id', 'UNKNOWN')[:8].upper()}"
        
        # Recalculate status for existing leads
        if lead.get("stage"):
            new_status, reason = calculate_lead_status(
                lead["stage"], 
                lead.get("next_followup"),
                lead.get("lead_status")
            )
            # Always set the lead_status to ensure it's present
            lead["lead_status"] = new_status
            print(f"Lead {lead.get('id')}: stage={lead.get('stage')}, lead_status={lead['lead_status']}")
    
    print(f"\nFinal API response structure:")
    if leads:
        sample_lead = leads[0]
        for key in sorted(sample_lead.keys()):
            print(f"  {key}: {sample_lead[key]}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(simulate_api_response())
