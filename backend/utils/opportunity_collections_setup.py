"""
Setup script for Opportunity Module MongoDB Collections
Creates indexes and initializes collections for the Opportunity module
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.opportunity_collections import (
    OPPORTUNITIES_COLLECTION,
    RFP_DETAILS_COLLECTION,
    RFP_DOCUMENTS_COLLECTION,
    SOW_DETAILS_COLLECTION,
    SOW_DOCUMENTS_COLLECTION
)
import logging

logger = logging.getLogger(__name__)

async def create_opportunity_collections(db: AsyncIOMotorDatabase):
    """Create all Opportunity module collections with proper indexes"""
    
    try:
        # 1. Opportunities Collection
        opportunities = db[OPPORTUNITIES_COLLECTION]
        
        # Create indexes for opportunities collection
        await opportunities.create_index("opportunity_id", unique=True)
        await opportunities.create_index("client_id")
        await opportunities.create_index("client_name")
        await opportunities.create_index("pipeline_status")
        await opportunities.create_index("status")
        await opportunities.create_index("created_by")
        await opportunities.create_index("created_at")
        await opportunities.create_index("updated_at")
        
        logger.info(f"Created indexes for {OPPORTUNITIES_COLLECTION}")
        
        # 2. RFP Details Collection
        rfp_details = db[RFP_DETAILS_COLLECTION]
        
        # Create indexes for rfp_details collection
        await rfp_details.create_index("opportunity_id")
        await rfp_details.create_index("rfp_status")
        await rfp_details.create_index("submission_deadline")
        await rfp_details.create_index("bid_manager")
        await rfp_details.create_index("created_at")
        await rfp_details.create_index("updated_at")
        
        logger.info(f"Created indexes for {RFP_DETAILS_COLLECTION}")
        
        # 3. RFP Documents Collection
        rfp_documents = db[RFP_DOCUMENTS_COLLECTION]
        
        # Create indexes for rfp_documents collection
        await rfp_documents.create_index("opportunity_id")
        await rfp_documents.create_index("document_type")
        await rfp_documents.create_index("uploaded_by")
        await rfp_documents.create_index("uploaded_at")
        
        logger.info(f"Created indexes for {RFP_DOCUMENTS_COLLECTION}")
        
        # 4. SOW Details Collection
        sow_details = db[SOW_DETAILS_COLLECTION]
        
        # Create indexes for sow_details collection
        await sow_details.create_index("opportunity_id")
        await sow_details.create_index("sow_status")
        await sow_details.create_index("target_kickoff_date")
        await sow_details.create_index("linked_proposal_ref")
        await sow_details.create_index("created_at")
        await sow_details.create_index("updated_at")
        
        logger.info(f"Created indexes for {SOW_DETAILS_COLLECTION}")
        
        # 5. SOW Documents Collection
        sow_documents = db[SOW_DOCUMENTS_COLLECTION]
        
        # Create indexes for sow_documents collection
        await sow_documents.create_index("sow_id")
        await sow_documents.create_index("uploaded_at")
        
        logger.info(f"Created indexes for {SOW_DOCUMENTS_COLLECTION}")
        
        logger.info("All Opportunity module collections and indexes created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating Opportunity collections: {str(e)}")
        raise

async def validate_collections_exist(db: AsyncIOMotorDatabase):
    """Validate that all Opportunity collections exist and are accessible"""
    
    collections_to_check = [
        OPPORTUNITIES_COLLECTION,
        RFP_DETAILS_COLLECTION,
        RFP_DOCUMENTS_COLLECTION,
        SOW_DETAILS_COLLECTION,
        SOW_DOCUMENTS_COLLECTION
    ]
    
    existing_collections = await db.list_collection_names()
    
    for collection_name in collections_to_check:
        if collection_name not in existing_collections:
            logger.warning(f"Collection {collection_name} does not exist")
            return False
        else:
            logger.info(f"Collection {collection_name} exists")
    
    return True

async def get_collection_stats(db: AsyncIOMotorDatabase):
    """Get statistics for all Opportunity collections"""
    
    collections_stats = {}
    
    collections_to_check = [
        OPPORTUNITIES_COLLECTION,
        RFP_DETAILS_COLLECTION,
        RFP_DOCUMENTS_COLLECTION,
        SOW_DETAILS_COLLECTION,
        SOW_DOCUMENTS_COLLECTION
    ]
    
    for collection_name in collections_to_check:
        try:
            collection = db[collection_name]
            count = await collection.count_documents({})
            collections_stats[collection_name] = count
            logger.info(f"Collection {collection_name}: {count} documents")
        except Exception as e:
            logger.error(f"Error getting stats for {collection_name}: {str(e)}")
            collections_stats[collection_name] = "Error"
    
    return collections_stats
