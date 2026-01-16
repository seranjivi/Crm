import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

# Dummy client data
dummy_clients = [
    {
        "client_name": "TechCorp Solutions",
        "contact_email": "john.doe@techcorp.com",
        "region": "North America",
        "country": "United States",
        "service_type": ["Projects"],
        "client_tier": "Strategic",
        "client_status": "Active",
        "website": "https://techcorp.com",
        "notes": "Major enterprise client with ongoing projects"
    },
    {
        "client_name": "Global Innovations Ltd",
        "contact_email": "sarah.smith@globalinnovations.com",
        "region": "Europe",
        "country": "Germany",
        "service_type": ["Consulting"],
        "client_tier": "Key Client",
        "client_status": "Active",
        "website": "https://globalinnovations.de",
        "notes": "Consulting retainer client"
    },
    {
        "client_name": "Digital Dynamics",
        "contact_email": "mike.wilson@digitaldynamics.io",
        "region": "Asia Pacific",
        "country": "Singapore",
        "service_type": ["Product Professional Services"],
        "client_tier": "Normal",
        "client_status": "Active",
        "website": "https://digitaldynamics.io",
        "notes": "Startup with high growth potential"
    },
    {
        "client_name": "Enterprise Systems Co",
        "contact_email": "lisa.chen@enterprisesys.com",
        "region": "Asia Pacific",
        "country": "China",
        "service_type": ["Staffing"],
        "client_tier": "Normal",
        "client_status": "Prospect",
        "website": "https://enterprisesys.cn",
        "notes": "Large staffing requirements"
    },
    {
        "client_name": "CloudTech Partners",
        "contact_email": "david.brown@cloudtechpartners.com",
        "region": "North America",
        "country": "Canada",
        "service_type": ["Training"],
        "client_tier": "Key Client",
        "client_status": "Active",
        "website": "https://cloudtechpartners.ca",
        "notes": "Regular training contracts"
    },
    {
        "client_name": "DataFlow Systems",
        "contact_email": "emma.johnson@dataflow.com",
        "region": "Europe",
        "country": "United Kingdom",
        "service_type": ["Projects", "Consulting"],
        "client_tier": "Strategic",
        "client_status": "Active",
        "website": "https://dataflow.co.uk",
        "notes": "Multi-service engagement"
    },
    {
        "client_name": "Smart Solutions Inc",
        "contact_email": "robert.garcia@smartsolutions.com",
        "region": "Latin America",
        "country": "Brazil",
        "service_type": ["Partners"],
        "client_tier": "Normal",
        "client_status": "Inactive",
        "website": "https://smartsolutions.com.br",
        "notes": "Partnership program participant"
    },
    {
        "client_name": "NextGen Technologies",
        "contact_email": "anna.kumar@nextgen.tech",
        "region": "Asia Pacific",
        "country": "India",
        "service_type": ["Product Professional Services", "Training"],
        "client_tier": "Key Client",
        "client_status": "Active",
        "website": "https://nextgen.tech",
        "notes": "Emerging technology leader"
    },
    {
        "client_name": "MegaCorp Industries",
        "contact_email": "william.taylor@megacorp.com",
        "region": "North America",
        "country": "United States",
        "service_type": ["Projects", "Staffing"],
        "client_tier": "Strategic",
        "client_status": "Active",
        "website": "https://megacorp.com",
        "notes": "Fortune 500 client"
    },
    {
        "client_name": "Innovation Hub",
        "contact_email": "maria.romero@innovationhub.es",
        "region": "Europe",
        "country": "Spain",
        "service_type": ["Consulting", "Training"],
        "client_tier": "Normal",
        "client_status": "Prospect",
        "website": "https://innovationhub.es",
        "notes": "Potential strategic partnership"
    }
]

async def seed_dummy_clients():
    """Seed the database with dummy client data"""
    client = AsyncIOMotorClient('mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
    db = client['sales_crm']
    
    print("Seeding dummy clients...")
    
    for client_data in dummy_clients:
        # Add required fields
        client_data["id"] = str(uuid.uuid4())
        client_data["created_at"] = datetime.now(timezone.utc).isoformat()
        client_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Insert into database
        await db.clients.insert_one(client_data)
        print(f"Created client: {client_data['client_name']}")
    
    print(f"\nSuccessfully seeded {len(dummy_clients)} dummy clients!")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_dummy_clients())
