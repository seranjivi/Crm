"""
Standalone script to initialize Opportunity module collections
Run this script to create all necessary collections and indexes
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database import init_db
from utils.opportunity_collections_setup import create_opportunity_collections, validate_collections_exist, get_collection_stats

async def main():
    """Main setup function"""
    print("🚀 Setting up Opportunity Module Collections...")
    
    try:
        # Initialize database connection
        print("📡 Connecting to database...")
        db = init_db()
        
        # Test connection
        await db.command('ping')
        print("✅ Database connection successful")
        
        # Create collections and indexes
        print("📋 Creating collections and indexes...")
        await create_opportunity_collections(db)
        print("✅ Collections and indexes created successfully")
        
        # Validate collections
        print("🔍 Validating collections...")
        is_valid = await validate_collections_exist(db)
        if is_valid:
            print("✅ All collections validated successfully")
        else:
            print("⚠️  Some collections may be missing")
        
        # Get collection statistics
        print("📊 Getting collection statistics...")
        stats = await get_collection_stats(db)
        
        print("\n📈 Collection Statistics:")
        print("-" * 40)
        for collection_name, count in stats.items():
            print(f"{collection_name}: {count} documents")
        
        print("\n🎉 Opportunity module setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Setup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
