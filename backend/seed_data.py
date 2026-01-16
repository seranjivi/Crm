import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timezone
from utils.auth import get_password_hash
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
db_name = os.environ.get('DB_NAME', 'test_database')

# Configure connection options for Atlas MongoDB
connection_options = {
    'serverSelectionTimeoutMS': 5000,
    'connectTimeoutMS': 10000,
    'socketTimeoutMS': 10000
}

if 'mongodb+srv://' in mongo_url or 'mongodb.net' in mongo_url:
    connection_options['retryWrites'] = True
    connection_options['w'] = 'majority'

client = AsyncIOMotorClient(mongo_url, **connection_options)
db = client[db_name]

async def seed_database():
    print("Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.clients.delete_many({})
    await db.vendors.delete_many({})
    await db.leads.delete_many({})
    await db.opportunities.delete_many({})
    await db.sows.delete_many({})
    await db.activities.delete_many({})
    await db.settings.delete_many({})
    
    # Seed Users
    users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@sightspectrum.com",
            "password": get_password_hash("admin123"),
            "full_name": "Admin User",
            "role": "Admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "john.doe@sightspectrum.com",
            "password": get_password_hash("password123"),
            "full_name": "John Doe",
            "role": "SalesRep",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "jane.smith@sightspectrum.com",
            "password": get_password_hash("password123"),
            "full_name": "Jane Smith",
            "role": "Manager",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"Seeded {len(users)} users")
    
    # Seed Clients
    clients = [
        {
            "id": str(uuid.uuid4()),
            "name": "TechCorp Solutions",
            "industry": "Technology",
            "region": "North America",
            "country": "USA",
            "website": "https://techcorp.com",
            "address": "123 Tech Street, San Francisco, CA",
            "status": "Active",
            "account_manager": "John Doe",
            "notes": "Key enterprise client",
            "contacts": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Global Finance Inc",
            "industry": "Finance",
            "region": "Europe",
            "country": "UK",
            "website": "https://globalfinance.com",
            "address": "456 Money Lane, London",
            "status": "Active",
            "account_manager": "Jane Smith",
            "notes": "Long-term partner",
            "contacts": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.clients.insert_many(clients)
    print(f"Seeded {len(clients)} clients")
    
    # Seed Vendors
    vendors = [
        {
            "id": str(uuid.uuid4()),
            "name": "Cloud Services Ltd",
            "category": "Cloud Infrastructure",
            "region": "North America",
            "website": "https://cloudservices.com",
            "address": "789 Cloud Ave",
            "status": "Active",
            "notes": "Primary cloud provider",
            "contacts": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.vendors.insert_many(vendors)
    print(f"Seeded {len(vendors)} vendors")
    
    # Seed Leads
    leads = [
        {
            "id": str(uuid.uuid4()),
            "client_name": "Acme Corporation",
            "opportunity_name": "CRM Implementation",
            "lead_source": "Website",
            "region": "North America",
            "country": "USA",
            "industry": "Manufacturing",
            "contact_person": "Bob Wilson",
            "contact_details": "bob@acme.com",
            "solution": "Enterprise CRM",
            "estimated_value": 150000,
            "currency": "USD",
            "stage": "Qualified",
            "probability": 60,
            "expected_closure_date": "2025-06-30",
            "owner": "John Doe",
            "next_action": "Schedule demo",
            "notes": "High potential client",
            "status": "Active",
            "linked_opportunity_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_name": "Innovate Tech",
            "opportunity_name": "Data Analytics Platform",
            "lead_source": "Referral",
            "region": "Asia",
            "country": "Singapore",
            "industry": "Technology",
            "contact_person": "Sarah Lee",
            "contact_details": "sarah@innovate.com",
            "solution": "Analytics Suite",
            "estimated_value": 200000,
            "currency": "USD",
            "stage": "Proposal",
            "probability": 75,
            "expected_closure_date": "2025-05-15",
            "owner": "Jane Smith",
            "next_action": "Send proposal",
            "notes": "Decision maker identified",
            "status": "Active",
            "linked_opportunity_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.leads.insert_many(leads)
    print(f"Seeded {len(leads)} leads")
    
    # Seed Opportunities
    opportunities = [
        {
            "id": str(uuid.uuid4()),
            "client_name": "TechCorp Solutions",
            "opportunity_name": "Digital Transformation Project",
            "industry": "Technology",
            "region": "North America",
            "country": "USA",
            "solution": "Full Stack Solution",
            "estimated_value": 500000,
            "currency": "USD",
            "probability": 80,
            "stage": "Negotiation",
            "expected_closure_date": "2025-04-30",
            "sales_owner": "John Doe",
            "technical_poc": "Tech Lead",
            "presales_poc": "Jane Smith",
            "key_stakeholders": "CTO, CFO",
            "competitors": "CompetitorA",
            "next_steps": "Final contract review",
            "risks": "Budget approval pending",
            "status": "Active",
            "linked_lead_id": None,
            "linked_sow_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.opportunities.insert_many(opportunities)
    print(f"Seeded {len(opportunities)} opportunities")
    
    # Seed SOWs
    sows = [
        {
            "id": str(uuid.uuid4()),
            "client_name": "Global Finance Inc",
            "project_name": "Financial Analytics Platform",
            "sow_title": "Financial Analytics Platform - Phase 1",
            "sow_type": "New",
            "start_date": "2025-02-01",
            "end_date": "2025-08-31",
            "value": 750000,
            "currency": "USD",
            "billing_type": "Fixed",
            "status": "Active",
            "owner": "Jane Smith",
            "delivery_spoc": "Tech Lead",
            "milestones": "Phase 1: Design, Phase 2: Development, Phase 3: Testing",
            "po_number": "PO-2025-001",
            "invoice_plan": "Monthly",
            "documents_link": "https://docs.example.com/sow1",
            "notes": "Strategic project",
            "linked_opportunity_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.sows.insert_many(sows)
    print(f"Seeded {len(sows)} SOWs")
    
    # Seed Activities
    activities = [
        {
            "id": str(uuid.uuid4()),
            "activity_type": "Call",
            "title": "Follow-up call with Acme",
            "description": "Discuss CRM requirements",
            "related_to": "Lead",
            "related_id": leads[0]["id"],
            "assigned_to": "John Doe",
            "status": "Pending",
            "due_date": datetime.now(timezone.utc).isoformat(),
            "notes": "Prepare demo materials",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "activity_type": "Meeting",
            "title": "Quarterly Business Review",
            "description": "Review progress with TechCorp",
            "related_to": "Client",
            "related_id": clients[0]["id"],
            "assigned_to": "Jane Smith",
            "status": "Completed",
            "due_date": datetime.now(timezone.utc).isoformat(),
            "notes": "Positive feedback received",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.activities.insert_many(activities)
    print(f"Seeded {len(activities)} activities")
    
    # Seed Settings
    settings = [
        {
            "id": str(uuid.uuid4()),
            "setting_type": "lead_stages",
            "values": ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "setting_type": "opportunity_stages",
            "values": ["Qualified", "Proposal", "Demo", "Negotiation", "Contract", "Closed Won", "Lost"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "setting_type": "regions",
            "values": ["North America", "Europe", "Asia", "South America", "Africa", "Australia"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.settings.insert_many(settings)
    print(f"Seeded {len(settings)} settings")
    
    print("Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())
