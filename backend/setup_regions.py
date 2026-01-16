import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

async def setup_sample_regions():
    """Setup sample regions data in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/")
    db = client.test_database
    
    # Sample regions data
    regions_data = [
        {"id": "1", "name": "North America", "displayName": "North America"},
        {"id": "2", "name": "Europe", "displayName": "Europe"},
        {"id": "3", "name": "Asia Pacific", "displayName": "Asia Pacific"},
        {"id": "4", "name": "Latin America", "displayName": "Latin America"},
        {"id": "5", "name": "Middle East", "displayName": "Middle East"},
        {"id": "6", "name": "Africa", "displayName": "Africa"}
    ]
    
    # Create or update regions setting
    regions_setting = {
        "id": str(uuid.uuid4()),
        "setting_type": "regions",
        "data": regions_data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if regions setting already exists
    existing = await db.settings.find_one({"setting_type": "regions"})
    if existing:
        # Update existing
        await db.settings.update_one(
            {"setting_type": "regions"},
            {"$set": {"data": regions_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        print("Updated existing regions setting")
    else:
        # Create new
        await db.settings.insert_one(regions_setting)
        print("Created new regions setting")
    
    print(f"Setup complete with {len(regions_data)} regions")
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_sample_regions())
