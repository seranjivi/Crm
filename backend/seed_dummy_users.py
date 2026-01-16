import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

# Dummy user data
dummy_users = [
    {
        "full_name": "John Doe",
        "email": "john.doe@sightspectrum.com",
        "role": "Sales Head",
        "status": "Active",
        "assigned_regions": ["North America", "Asia Pacific"],
        "notes": "Senior sales executive with multi-region responsibility"
    },
    {
        "full_name": "Sarah Johnson",
        "email": "sarah.johnson@sightspectrum.com",
        "role": "Presales Manager",
        "status": "Active",
        "assigned_regions": ["Europe", "Middle East"],
        "notes": "Leading presales team for EMEA region"
    },
    {
        "full_name": "Michael Chen",
        "email": "michael.chen@sightspectrum.com",
        "role": "Admin / Founder",
        "status": "Active",
        "assigned_regions": ["Asia Pacific", "North America", "Europe"],
        "notes": "Company founder with global oversight"
    },
    {
        "full_name": "Emma Wilson",
        "email": "emma.wilson@sightspectrum.com",
        "role": "Presales Consultant",
        "status": "Active",
        "assigned_regions": ["Europe"],
        "notes": "Technical presales consultant"
    },
    {
        "full_name": "Robert Garcia",
        "email": "robert.garcia@sightspectrum.com",
        "role": "Delivery Manager",
        "status": "Active",
        "assigned_regions": ["Latin America", "North America"],
        "notes": "Managing delivery operations"
    },
    {
        "full_name": "Lisa Kumar",
        "email": "lisa.kumar@sightspectrum.com",
        "role": "Presales Lead",
        "status": "Active",
        "assigned_regions": ["Asia Pacific"],
        "notes": "Leading presales efforts in APAC"
    },
    {
        "full_name": "David Brown",
        "email": "david.brown@sightspectrum.com",
        "role": "Super Admin",
        "status": "Active",
        "assigned_regions": ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa", "Atlantic", "Oceania"],
        "notes": "System administrator with full access"
    },
    {
        "full_name": "Anna Martinez",
        "email": "anna.martinez@sightspectrum.com",
        "role": "Presales Consultant",
        "status": "Inactive",
        "assigned_regions": ["Latin America"],
        "notes": "Presales consultant on leave"
    },
    {
        "full_name": "William Taylor",
        "email": "william.taylor@sightspectrum.com",
        "role": "Delivery Manager",
        "status": "Active",
        "assigned_regions": ["Europe", "Africa"],
        "notes": "Senior delivery manager"
    },
    {
        "full_name": "Maria Rodriguez",
        "email": "maria.rodriguez@sightspectrum.com",
        "role": "Sales Head",
        "status": "Active",
        "assigned_regions": ["Latin America", "North America"],
        "notes": "Regional sales head for Americas"
    }
]

async def seed_dummy_users():
    """Seed database with dummy user data"""
    client = AsyncIOMotorClient('mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
    db = client['test_database']
    
    print("Seeding dummy users...")
    
    # Import password hashing
    from utils.auth import get_password_hash
    
    for user_data in dummy_users:
        # Add required fields
        user_data["id"] = str(uuid.uuid4())
        user_data["password"] = get_password_hash("ss@123")  # Default temp password
        user_data["created_at"] = datetime.now(timezone.utc).isoformat()
        user_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        user_data["is_temp_password"] = True
        user_data["password_changed_at"] = None
        user_data["last_login"] = None
        
        # Insert into database
        await db.users.insert_one(user_data)
        print(f"Created user: {user_data['full_name']} ({user_data['role']})")
    
    print(f"\nSuccessfully seeded {len(dummy_users)} dummy users!")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_dummy_users())
