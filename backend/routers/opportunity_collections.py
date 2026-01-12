"""
API Router for Opportunity Module Collections
Handles CRUD operations for all Opportunity-related collections
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from models.opportunity_collections import (
    OpportunityMongo, RFPDetailsMongo, RFPDocumentsMongo, 
    SOWDetailsMongo, SOWDocumentsMongo, QALogEntry,
    OPPORTUNITIES_COLLECTION, RFP_DETAILS_COLLECTION, 
    RFP_DOCUMENTS_COLLECTION, SOW_DETAILS_COLLECTION, 
    SOW_DOCUMENTS_COLLECTION
)
from database import get_db
from utils.middleware import get_current_user
from utils.opportunity_collections_setup import create_opportunity_collections, validate_collections_exist
import uuid

router = APIRouter(prefix="/opportunity-collections", tags=["Opportunity Collections"])

# Initialize collections on startup
@router.post("/init", status_code=status.HTTP_201_CREATED)
async def initialize_collections(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Initialize all Opportunity collections with indexes"""
    try:
        await create_opportunity_collections(db)
        return {"message": "Opportunity collections initialized successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize collections: {str(e)}"
        )

@router.get("/validate", status_code=status.HTTP_200_OK)
async def validate_collections(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Validate that all Opportunity collections exist"""
    try:
        is_valid = await validate_collections_exist(db)
        return {"valid": is_valid, "message": "Collections validation completed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate collections: {str(e)}"
        )

# OPPORTUNITIES COLLECTION CRUD
@router.get("/opportunities", response_model=List[OpportunityMongo])
async def get_opportunities(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    pipeline_status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get opportunities with optional filtering"""
    try:
        filter_dict = {}
        if status:
            filter_dict["status"] = status
        if pipeline_status:
            filter_dict["pipeline_status"] = pipeline_status
            
        collection = db[OPPORTUNITIES_COLLECTION]
        opportunities = await collection.find(filter_dict).skip(skip).limit(limit).to_list(limit)
        
        # Convert ObjectId to string for JSON serialization
        for opp in opportunities:
            if "_id" in opp:
                opp["id"] = str(opp["_id"])
                del opp["_id"]
        
        return opportunities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get opportunities: {str(e)}"
        )

@router.post("/opportunities", response_model=OpportunityMongo, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    opportunity: OpportunityMongo,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new opportunity"""
    try:
        # Generate opportunity_id if not provided
        if not opportunity.opportunity_id:
            # Get the highest existing opportunity_id and increment
            collection = db[OPPORTUNITIES_COLLECTION]
            last_opp = await collection.find_one(
                sort=[("opportunity_id", -1)]
            )
            
            if last_opp and last_opp.get("opportunity_id"):
                last_num = int(last_opp["opportunity_id"].split("-")[1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            opportunity.opportunity_id = f"OPP-{new_num:03d}"
        
        # Set created_by and timestamps
        opportunity.created_by = current_user.get("email", "unknown")
        opportunity.created_at = datetime.utcnow()
        opportunity.updated_at = datetime.utcnow()
        
        collection = db[OPPORTUNITIES_COLLECTION]
        result = await collection.insert_one(opportunity.model_dump(by_alias=True))
        
        # Return the created opportunity
        created_opp = await collection.find_one({"_id": result.inserted_id})
        created_opp["id"] = str(created_opp["_id"])
        del created_opp["_id"]
        
        return created_opp
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create opportunity: {str(e)}"
        )

@router.put("/opportunities/{opportunity_id}", response_model=OpportunityMongo)
async def update_opportunity(
    opportunity_id: str,
    opportunity_update: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update an existing opportunity"""
    try:
        collection = db[OPPORTUNITIES_COLLECTION]
        
        # Find the opportunity
        existing = await collection.find_one({"id": opportunity_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Opportunity not found"
            )
        
        # Update timestamp
        opportunity_update["updated_at"] = datetime.utcnow()
        
        # Update the opportunity
        result = await collection.update_one(
            {"id": opportunity_id},
            {"$set": opportunity_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Opportunity not found"
            )
        
        # Return updated opportunity
        updated_opp = await collection.find_one({"id": opportunity_id})
        updated_opp["id"] = str(updated_opp["_id"])
        del updated_opp["_id"]
        
        return updated_opp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update opportunity: {str(e)}"
        )

# RFP DETAILS COLLECTION CRUD
@router.get("/rfp-details", response_model=List[RFPDetailsMongo])
async def get_rfp_details(
    opportunity_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get RFP details, optionally filtered by opportunity_id"""
    try:
        filter_dict = {}
        if opportunity_id:
            filter_dict["opportunity_id"] = opportunity_id
            
        collection = db[RFP_DETAILS_COLLECTION]
        rfp_details = await collection.find(filter_dict).to_list(1000)
        
        # Convert ObjectId to string
        for rfp in rfp_details:
            if "_id" in rfp:
                rfp["id"] = str(rfp["_id"])
                del rfp["_id"]
        
        return rfp_details
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get RFP details: {str(e)}"
        )

@router.post("/rfp-details", response_model=RFPDetailsMongo, status_code=status.HTTP_201_CREATED)
async def create_rfp_details(
    rfp_details: RFPDetailsMongo,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create RFP details for an opportunity"""
    try:
        rfp_details.created_at = datetime.utcnow()
        rfp_details.updated_at = datetime.utcnow()
        
        collection = db[RFP_DETAILS_COLLECTION]
        result = await collection.insert_one(rfp_details.model_dump(by_alias=True))
        
        created_rfp = await collection.find_one({"_id": result.inserted_id})
        created_rfp["id"] = str(created_rfp["_id"])
        del created_rfp["_id"]
        
        return created_rfp
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create RFP details: {str(e)}"
        )

# DOCUMENTS COLLECTIONS CRUD
@router.post("/rfp-documents", response_model=RFPDocumentsMongo, status_code=status.HTTP_201_CREATED)
async def upload_rfp_document(
    document: RFPDocumentsMongo,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Upload an RFP document"""
    try:
        document.uploaded_at = datetime.utcnow()
        
        collection = db[RFP_DOCUMENTS_COLLECTION]
        result = await collection.insert_one(document.model_dump(by_alias=True))
        
        created_doc = await collection.find_one({"_id": result.inserted_id})
        created_doc["id"] = str(created_doc["_id"])
        del created_doc["_id"]
        
        return created_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload RFP document: {str(e)}"
        )

@router.get("/rfp-documents", response_model=List[RFPDocumentsMongo])
async def get_rfp_documents(
    opportunity_id: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get RFP documents with optional filtering"""
    try:
        filter_dict = {}
        if opportunity_id:
            filter_dict["opportunity_id"] = opportunity_id
        if document_type:
            filter_dict["document_type"] = document_type
            
        collection = db[RFP_DOCUMENTS_COLLECTION]
        documents = await collection.find(filter_dict).to_list(1000)
        
        for doc in documents:
            if "_id" in doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
        
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get RFP documents: {str(e)}"
        )

# SOW DETAILS COLLECTION CRUD
@router.post("/sow-details", response_model=SOWDetailsMongo, status_code=status.HTTP_201_CREATED)
async def create_sow_details(
    sow_details: SOWDetailsMongo,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create SOW details for an opportunity"""
    try:
        sow_details.created_at = datetime.utcnow()
        sow_details.updated_at = datetime.utcnow()
        
        collection = db[SOW_DETAILS_COLLECTION]
        result = await collection.insert_one(sow_details.model_dump(by_alias=True))
        
        created_sow = await collection.find_one({"_id": result.inserted_id})
        created_sow["id"] = str(created_sow["_id"])
        del created_sow["_id"]
        
        return created_sow
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create SOW details: {str(e)}"
        )

@router.get("/sow-details", response_model=List[SOWDetailsMongo])
async def get_sow_details(
    opportunity_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get SOW details, optionally filtered by opportunity_id"""
    try:
        filter_dict = {}
        if opportunity_id:
            filter_dict["opportunity_id"] = opportunity_id
            
        collection = db[SOW_DETAILS_COLLECTION]
        sow_details = await collection.find(filter_dict).to_list(1000)
        
        for sow in sow_details:
            if "_id" in sow:
                sow["id"] = str(sow["_id"])
                del sow["_id"]
        
        return sow_details
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get SOW details: {str(e)}"
        )

# SOW DOCUMENTS COLLECTION CRUD
@router.post("/sow-documents", response_model=SOWDocumentsMongo, status_code=status.HTTP_201_CREATED)
async def upload_sow_document(
    document: SOWDocumentsMongo,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Upload an SOW document"""
    try:
        document.uploaded_at = datetime.utcnow()
        
        collection = db[SOW_DOCUMENTS_COLLECTION]
        result = await collection.insert_one(document.model_dump(by_alias=True))
        
        created_doc = await collection.find_one({"_id": result.inserted_id})
        created_doc["id"] = str(created_doc["_id"])
        del created_doc["_id"]
        
        return created_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload SOW document: {str(e)}"
        )

@router.get("/sow-documents", response_model=List[SOWDocumentsMongo])
async def get_sow_documents(
    sow_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get SOW documents, optionally filtered by sow_id"""
    try:
        filter_dict = {}
        if sow_id:
            filter_dict["sow_id"] = sow_id
            
        collection = db[SOW_DOCUMENTS_COLLECTION]
        documents = await collection.find(filter_dict).to_list(1000)
        
        for doc in documents:
            if "_id" in doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
        
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get SOW documents: {str(e)}"
        )

# Get complete opportunity data with all related collections
@router.get("/opportunity/{opportunity_id}/complete", response_model=Dict[str, Any])
async def get_complete_opportunity(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get complete opportunity data including all related collections"""
    try:
        # Get main opportunity
        opportunities_coll = db[OPPORTUNITIES_COLLECTION]
        opportunity = await opportunities_coll.find_one({"opportunity_id": opportunity_id})
        
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Opportunity not found"
            )
        
        # Get RFP details
        rfp_coll = db[RFP_DETAILS_COLLECTION]
        rfp_details = await rfp_coll.find_one({"opportunity_id": opportunity_id})
        
        # Get RFP documents
        rfp_docs_coll = db[RFP_DOCUMENTS_COLLECTION]
        rfp_documents = await rfp_docs_coll.find({"opportunity_id": opportunity_id}).to_list(100)
        
        # Get SOW details
        sow_coll = db[SOW_DETAILS_COLLECTION]
        sow_details = await sow_coll.find_one({"opportunity_id": opportunity_id})
        
        # Get SOW documents if SOW exists
        sow_documents = []
        if sow_details:
            sow_docs_coll = db[SOW_DOCUMENTS_COLLECTION]
            sow_documents = await sow_docs_coll.find({"sow_id": str(sow_details.get("_id"))}).to_list(100)
        
        # Convert ObjectIds to strings
        if "_id" in opportunity:
            opportunity["id"] = str(opportunity["_id"])
            del opportunity["_id"]
        
        if rfp_details and "_id" in rfp_details:
            rfp_details["id"] = str(rfp_details["_id"])
            del rfp_details["_id"]
        
        for doc in rfp_documents:
            if "_id" in doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
        
        if sow_details and "_id" in sow_details:
            sow_details["id"] = str(sow_details["_id"])
            del sow_details["_id"]
        
        for doc in sow_documents:
            if "_id" in doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
        
        return {
            "opportunity": opportunity,
            "rfp_details": rfp_details,
            "rfp_documents": rfp_documents,
            "sow_details": sow_details,
            "sow_documents": sow_documents
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get complete opportunity: {str(e)}"
        )
