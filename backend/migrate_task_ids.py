"""
Migration script to add task_id to existing Leads and Opportunities
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
sys.path.append('/app/backend')
from utils.task_id_generator import generate_task_id

MONGO_URL = os.environ.get("MONGO_URL", "mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/")
DB_NAME = os.environ.get("DB_NAME", "test_database")

async def migrate_task_ids():
    # Configure connection options for Atlas MongoDB
    connection_options = {
        'serverSelectionTimeoutMS': 5000,
        'connectTimeoutMS': 10000,
        'socketTimeoutMS': 10000
    }
    
    if 'mongodb+srv://' in MONGO_URL or 'mongodb.net' in MONGO_URL:
        connection_options['retryWrites'] = True
        connection_options['w'] = 'majority'
    
    client = AsyncIOMotorClient(MONGO_URL, **connection_options)
    db = client[DB_NAME]
    
    print("🔄 Starting migration to add task_id to existing records...")
    
    # Migrate Leads
    print("\n📋 Processing Leads...")
    leads_without_task_id = await db.leads.find({"task_id": {"$exists": False}}, {"_id": 0, "id": 1}).to_list(1000)
    
    if leads_without_task_id:
        print(f"   Found {len(leads_without_task_id)} leads without task_id")
        for lead in leads_without_task_id:
            task_id = await generate_task_id(db)
            await db.leads.update_one(
                {"id": lead["id"]},
                {"$set": {"task_id": task_id}}
            )
            print(f"   ✓ Updated lead {lead['id'][:8]}... with task_id: {task_id}")
    else:
        print("   ✓ All leads already have task_id")
    
    # Migrate Opportunities
    print("\n📋 Processing Opportunities...")
    opps_without_task_id = await db.opportunities.find({"task_id": {"$exists": False}}, {"_id": 0, "id": 1}).to_list(1000)
    
    if opps_without_task_id:
        print(f"   Found {len(opps_without_task_id)} opportunities without task_id")
        for opp in opps_without_task_id:
            task_id = await generate_task_id(db)
            await db.opportunities.update_one(
                {"id": opp["id"]},
                {"$set": {"task_id": task_id}}
            )
            print(f"   ✓ Updated opportunity {opp['id'][:8]}... with task_id: {task_id}")
    else:
        print("   ✓ All opportunities already have task_id")
    
    # Verify migration
    print("\n📊 Verification:")
    total_leads = await db.leads.count_documents({})
    leads_with_task_id = await db.leads.count_documents({"task_id": {"$exists": True}})
    total_opps = await db.opportunities.count_documents({})
    opps_with_task_id = await db.opportunities.count_documents({"task_id": {"$exists": True}})
    
    print(f"   Leads: {leads_with_task_id}/{total_leads} have task_id")
    print(f"   Opportunities: {opps_with_task_id}/{total_opps} have task_id")
    
    if leads_with_task_id == total_leads and opps_with_task_id == total_opps:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n⚠️  Some records still missing task_id")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_task_ids())
