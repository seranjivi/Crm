"""
Seed script for new CRM modules (Action Items, Sales Activities, Forecasts)
Populates sample data with Task IDs
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import os
import uuid

MONGO_URL = os.environ.get("MONGO_URL", "mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/")
DB_NAME = os.environ.get("DB_NAME", "test_database")

async def seed_data():
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
    
    print("🌱 Seeding new modules with sample data...")
    
    # Get existing leads and opportunities to link data
    leads = await db.leads.find({}, {"_id": 0}).to_list(10)
    opportunities = await db.opportunities.find({}, {"_id": 0}).to_list(10)
    
    # Sample Action Items
    action_items = [
        {
            "id": str(uuid.uuid4()),
            "task_id": leads[0].get("task_id", "SAL0001") if leads else "SAL0001",
            "task_title": "Follow up on proposal submission",
            "linked_to": leads[0]["id"] if leads else None,
            "linked_to_type": "Lead",
            "assigned_to": "john.doe@sightspectrum.com",
            "due_date": (datetime.now(timezone.utc) + timedelta(days=3)).date().isoformat(),
            "priority": "High",
            "status": "In Progress",
            "notes": "Client requested additional pricing details",
            "completed_date": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": opportunities[0].get("task_id", "SAL0000") if opportunities else "SAL0002",
            "task_title": "Schedule demo with stakeholders",
            "linked_to": opportunities[0]["id"] if opportunities else None,
            "linked_to_type": "Opportunity",
            "assigned_to": "jane.smith@sightspectrum.com",
            "due_date": (datetime.now(timezone.utc) + timedelta(days=5)).date().isoformat(),
            "priority": "High",
            "status": "Not Started",
            "notes": "Demo for enterprise features required",
            "completed_date": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": "SAL0003",
            "task_title": "Prepare quarterly forecast report",
            "linked_to": None,
            "linked_to_type": None,
            "assigned_to": "admin@sightspectrum.com",
            "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).date().isoformat(),
            "priority": "Medium",
            "status": "Not Started",
            "notes": "Compile Q1 forecast data for board meeting",
            "completed_date": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": leads[1].get("task_id", "SAL0000") if len(leads) > 1 else "SAL0004",
            "task_title": "Send contract for review",
            "linked_to": leads[1]["id"] if len(leads) > 1 else None,
            "linked_to_type": "Lead",
            "assigned_to": "john.doe@sightspectrum.com",
            "due_date": (datetime.now(timezone.utc) + timedelta(days=2)).date().isoformat(),
            "priority": "High",
            "status": "In Progress",
            "notes": "Legal review completed, ready to send",
            "completed_date": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": "SAL0005",
            "task_title": "Update CRM documentation",
            "linked_to": None,
            "linked_to_type": None,
            "assigned_to": "jane.smith@sightspectrum.com",
            "due_date": (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat(),
            "priority": "Low",
            "status": "Overdue",
            "notes": "Documentation needs to be updated with new features",
            "completed_date": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        }
    ]
    
    # Sample Sales Activities
    sales_activities = [
        {
            "id": str(uuid.uuid4()),
            "task_id": leads[0].get("task_id", "SAL0000") if leads else "SAL0001",
            "activity_type": "Call",
            "activity_owner": "john.doe@sightspectrum.com",
            "activity_date": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "linked_account": leads[0]["client_name"] if leads else "Acme Corporation",
            "linked_lead": leads[0]["id"] if leads else None,
            "linked_opportunity": None,
            "summary": "Discovery call to understand client requirements",
            "outcome": "Client interested in enterprise plan, needs pricing details",
            "next_step": "Send detailed proposal by end of week",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": opportunities[0].get("task_id", "SAL0000") if opportunities else "SAL0002",
            "activity_type": "Meeting",
            "activity_owner": "jane.smith@sightspectrum.com",
            "activity_date": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "linked_account": opportunities[0]["client_name"] if opportunities else "TechCorp Solutions",
            "linked_lead": None,
            "linked_opportunity": opportunities[0]["id"] if opportunities else None,
            "summary": "Product demo with technical team",
            "outcome": "Demo went well, technical team impressed with features",
            "next_step": "Schedule follow-up with decision makers",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": "SAL0006",
            "activity_type": "Email",
            "activity_owner": "admin@sightspectrum.com",
            "activity_date": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
            "linked_account": "Global Finance Inc",
            "linked_lead": None,
            "linked_opportunity": None,
            "summary": "Sent quarterly business review",
            "outcome": "Client acknowledged receipt, scheduled review meeting",
            "next_step": "Prepare presentation for next week's meeting",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": leads[1].get("task_id", "SAL0000") if len(leads) > 1 else "SAL0007",
            "activity_type": "Call",
            "activity_owner": "john.doe@sightspectrum.com",
            "activity_date": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
            "linked_account": leads[1]["client_name"] if len(leads) > 1 else "Innovate Tech",
            "linked_lead": leads[1]["id"] if len(leads) > 1 else None,
            "linked_opportunity": None,
            "summary": "Initial outreach call",
            "outcome": "Left voicemail, sent follow-up email",
            "next_step": "Retry call tomorrow morning",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": opportunities[1].get("task_id", "SAL0000") if len(opportunities) > 1 else "SAL0008",
            "activity_type": "Meeting",
            "activity_owner": "jane.smith@sightspectrum.com",
            "activity_date": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "linked_account": opportunities[1]["client_name"] if len(opportunities) > 1 else "Enterprise Corp",
            "linked_lead": None,
            "linked_opportunity": opportunities[1]["id"] if len(opportunities) > 1 else None,
            "summary": "Negotiation meeting with procurement team",
            "outcome": "Agreed on pricing, pending legal review",
            "next_step": "Send contract for signature",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        }
    ]
    
    # Sample Forecasts
    forecasts = [
        {
            "id": str(uuid.uuid4()),
            "task_id": opportunities[0].get("task_id", "SAL0000") if opportunities else "SAL0001",
            "opportunity_name": opportunities[0]["opportunity_name"] if opportunities else "Enterprise Cloud Migration",
            "opportunity_id": opportunities[0]["id"] if opportunities else None,
            "deal_value": 250000,
            "probability_percent": 75,
            "forecast_amount": 187500,  # 250000 * 75 / 100
            "salesperson": "jane.smith@sightspectrum.com",
            "stage": "Proposal",
            "forecast_month": "2025-01",
            "forecast_quarter": "Q1 2025",
            "expected_closure_date": "2025-01-31",
            "notes": "Strong opportunity, client committed to Q1 decision",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": opportunities[1].get("task_id", "SAL0000") if len(opportunities) > 1 else "SAL0002",
            "opportunity_name": opportunities[1]["opportunity_name"] if len(opportunities) > 1 else "Digital Transformation Project",
            "opportunity_id": opportunities[1]["id"] if len(opportunities) > 1 else None,
            "deal_value": 500000,
            "probability_percent": 60,
            "forecast_amount": 300000,  # 500000 * 60 / 100
            "salesperson": "john.doe@sightspectrum.com",
            "stage": "Negotiation",
            "forecast_month": "2025-02",
            "forecast_quarter": "Q1 2025",
            "expected_closure_date": "2025-02-15",
            "notes": "Negotiating final terms, budget approved",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": "SAL0009",
            "opportunity_name": "AI Analytics Platform",
            "opportunity_id": None,
            "deal_value": 150000,
            "probability_percent": 40,
            "forecast_amount": 60000,  # 150000 * 40 / 100
            "salesperson": "admin@sightspectrum.com",
            "stage": "Prospecting",
            "forecast_month": "2025-03",
            "forecast_quarter": "Q1 2025",
            "expected_closure_date": "2025-03-30",
            "notes": "Early stage, initial discussions positive",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": "SAL0010",
            "opportunity_name": "Global Expansion Project",
            "opportunity_id": None,
            "deal_value": 800000,
            "probability_percent": 90,
            "forecast_amount": 720000,  # 800000 * 90 / 100
            "salesperson": "jane.smith@sightspectrum.com",
            "stage": "Negotiation",
            "forecast_month": "2025-01",
            "forecast_quarter": "Q1 2025",
            "expected_closure_date": "2025-01-15",
            "notes": "Near close, awaiting final executive approval",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "task_id": "SAL0011",
            "opportunity_name": "Security Compliance Suite",
            "opportunity_id": None,
            "deal_value": 120000,
            "probability_percent": 50,
            "forecast_amount": 60000,  # 120000 * 50 / 100
            "salesperson": "john.doe@sightspectrum.com",
            "stage": "Needs Analysis",
            "forecast_month": "2025-02",
            "forecast_quarter": "Q1 2025",
            "expected_closure_date": "2025-02-28",
            "notes": "Client evaluating multiple vendors",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        }
    ]
    
    # Clear existing data
    print("📦 Clearing existing sample data...")
    await db.action_items.delete_many({})
    await db.sales_activities.delete_many({})
    await db.forecasts.delete_many({})
    
    # Insert new data
    print("✨ Inserting Action Items...")
    await db.action_items.insert_many(action_items)
    print(f"   ✓ Created {len(action_items)} action items")
    
    print("✨ Inserting Sales Activities...")
    await db.sales_activities.insert_many(sales_activities)
    print(f"   ✓ Created {len(sales_activities)} sales activities")
    
    print("✨ Inserting Forecasts...")
    await db.forecasts.insert_many(forecasts)
    print(f"   ✓ Created {len(forecasts)} forecasts")
    
    print("\n🎉 Sample data seeding completed successfully!")
    print(f"   Total Action Items: {len(action_items)}")
    print(f"   Total Sales Activities: {len(sales_activities)}")
    print(f"   Total Forecasts: {len(forecasts)}")
    print(f"   Total Forecast Amount: ${sum(f['forecast_amount'] for f in forecasts):,.0f}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
