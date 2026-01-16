import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb+srv://siranjeevi9597536779_db_user:s8QGUkDvEBrzrltR@sales-crm.2ssnunp.mongodb.net/')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def check_client_tiers():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    clients = await db.clients.find({}).to_list(50)
    print(f'Found {len(clients)} clients')
    
    tiers = {}
    for client in clients:
        tier = client.get('client_tier', 'No tier')
        if tier not in tiers:
            tiers[tier] = 0
        tiers[tier] += 1
        print(f'  {client.get("client_name", "Unknown")}: {tier}')
    
    print(f'\nClient tiers summary:')
    for tier, count in tiers.items():
        print(f'  {tier}: {count}')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_client_tiers())
