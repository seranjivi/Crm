"""
MongoDB Routers for Opportunity Module
API endpoints for all Opportunity-related collections
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query, Body
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import os
import shutil
import uuid
from pathlib import Path

from models.opportunity_mongo_models import (
    Opportunity, OpportunityCreate, OpportunityUpdate,
    RFPDetails, RFPDetailsCreate, RFPDetailsUpdate, QALogEntry,
    RFPDocument, RFPDocumentCreate,
    SOWDetails, SOWDetailsCreate, SOWDetailsUpdate,
    SOWDocument, SOWDocumentCreate,
    OpportunityView, OpportunityType, PipelineStatus, RFPStatus, SOWStatus, DocumentType
)
from database import get_db
from utils.middleware import get_current_user

router = APIRouter(prefix="/api/opportunities", tags=["Opportunities"])

# File upload settings
UPLOAD_DIR = "uploads/opportunities"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper function to generate opportunity ID
async def generate_opportunity_id(db):
    """Generate unique opportunity ID like OPP-001"""
    last_opportunity = await db.opportunities.find_one(
        {},
        sort=[("opportunityId", -1)]
    )
    if last_opportunity and "opportunityId" in last_opportunity:
        last_num = int(last_opportunity["opportunityId"].split("-")[1])
        new_num = last_num + 1
    else:
        new_num = 1
    return f"OPP-{new_num:03d}"

# Helper function to save uploaded file
def save_upload_file(upload_file: UploadFile, opportunity_id: str, subfolder: str = "") -> str:
    """Save uploaded file and return the file path"""
    file_ext = Path(upload_file.filename).suffix
    filename = f"{uuid.uuid4()}{file_ext}"
    
    # Create directory if it doesn't exist
    save_dir = Path(UPLOAD_DIR) / str(opportunity_id) / subfolder
    save_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = save_dir / filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return str(file_path.relative_to(UPLOAD_DIR))

# ==================== OPPORTUNITY ENDPOINTS ====================

@router.get("", response_model=List[Dict[str, Any]])
async def get_opportunities(
    skip: int = 0, 
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all opportunities with basic info
    
    Returns a list of opportunities with essential fields for the opportunity list view
    """
    db = get_db()
    
    # Get basic opportunity info
    cursor = db.opportunities.find(
        {},
        {
            "opportunityId": 1,
            "opportunityName": 1,
            "clientName": 1,
            "closeDate": 1,
            "amount": 1,
            "currency": 1,
            "pipelineStatus": 1,
            "winProbability": 1,
            "type": 1,
            "triaged": 1
        }
    ).skip(skip).limit(limit)
    
    opportunities = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string for JSON serialization
    for opp in opportunities:
        opp["id"] = str(opp["_id"])
        del opp["_id"]
    
    return opportunities

@router.get("/{opportunity_id}", response_model=OpportunityView)
async def get_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get opportunity with all related data including RFP and SOW details
    
    Returns a complete view of the opportunity with all related data in a single response
    """
    db = get_db()
    
    # Get main opportunity
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Get RFP details
    rfp_details = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    
    # Get RFP documents
    rfp_documents = await db.rfpDocuments.find({"opportunityId": opportunity_id}).to_list(50)
    
    # Get SOW details
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    
    # Get SOW documents
    sow_documents = []
    if sow_details:
        sow_documents = await db.sowDocuments.find({"sowId": str(sow_details["_id"])}).to_list(50)
    
    # Helper function to convert ObjectId to string for JSON serialization
    def convert_object_ids(doc):
        if doc and "_id" in doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return doc
    
    return OpportunityView(
        opportunity=convert_object_ids(opportunity),
        rfpDetails=convert_object_ids(rfp_details) if rfp_details else None,
        rfpDocuments=[convert_object_ids(doc) for doc in rfp_documents],
        sowDetails=convert_object_ids(sow_details) if sow_details else None,
        sowDocuments=[convert_object_ids(doc) for doc in sow_documents]
    )

@router.post("/", response_model=Opportunity)
async def create_opportunity(
    opportunity: OpportunityCreate, 
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Generate a new opportunity_id if not provided
    opportunity_dict = opportunity.dict()
    
    # Add required fields
    opportunity_dict['opportunity_id'] = str(uuid.uuid4())  # Generate a new UUID
    opportunity_dict['created_at'] = datetime.utcnow()
    opportunity_dict['updated_at'] = datetime.utcnow()
    
    try:
        # Insert the new opportunity
        result = await db.opportunities.insert_one(opportunity_dict)
        
        # Fetch the created opportunity
        created_opportunity = await db.opportunities.find_one(
            {"_id": result.inserted_id}
        )
        return created_opportunity
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating opportunity: {str(e)}"
        )

@router.put("/{opportunity_id}", response_model=Dict[str, Any])
async def update_opportunity(
    opportunity_id: str, 
    opportunity_data: OpportunityUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Update opportunity details
    
    Only updates the fields provided in the request. Will not modify RFP or SOW details.
    """
    db = get_db()
    
    # Check if opportunity exists
    existing_opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not existing_opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Prepare update data (exclude unset fields)
    update_data = opportunity_data.model_dump(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    # Update the opportunity
    result = await db.opportunities.update_one(
        {"opportunityId": opportunity_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Return the updated opportunity
    updated_opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    updated_opportunity["id"] = str(updated_opportunity["_id"])
    del updated_opportunity["_id"]
    
    return updated_opportunity

@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(
    opportunity_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an opportunity and all its related data
    
    This will permanently delete the opportunity and all associated RFP and SOW data.
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Start a transaction to ensure data consistency
    async with await db.client.start_session() as session:
        async with session.start_transaction():
            # Delete opportunity
            await db.opportunities.delete_one(
                {"opportunityId": opportunity_id},
                session=session
            )
            
            # Delete RFP details and documents
            rfp_details = await db.rfpDetails.find_one(
                {"opportunityId": opportunity_id},
                session=session
            )
            
            if rfp_details:
                await db.rfpDetails.delete_many(
                    {"opportunityId": opportunity_id},
                    session=session
                )
                
                await db.rfpDocuments.delete_many(
                    {"opportunityId": opportunity_id},
                    session=session
                )
            
            # Delete SOW details and documents
            sow_details = await db.sowDetails.find_one(
                {"opportunityId": opportunity_id},
                session=session
            )
            
            if sow_details:
                await db.sowDetails.delete_many(
                    {"opportunityId": opportunity_id},
                    session=session
                )
                
                await db.sowDocuments.delete_many(
                    {"sowId": str(sow_details["_id"])},
                    session=session
                )
            
            # Commit the transaction
            await session.commit_transaction()
    
    return None

# ==================== RFP DETAILS ENDPOINTS ====================

@router.get("/{opportunity_id}/rfp", response_model=RFPDetails)
async def get_rfp_details(
    opportunity_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Get RFP details for an opportunity
    
    Returns the RFP details including Q&A log and basic information
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Get RFP details
    rfp_details = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    
    if not rfp_details:
        raise HTTPException(status_code=404, detail="RFP details not found for this opportunity")
    
    # Convert ObjectId to string for JSON serialization
    rfp_details["id"] = str(rfp_details["_id"])
    del rfp_details["_id"]
    
    return rfp_details

@router.post("/{opportunity_id}/rfp", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_rfp_details(
    opportunity_id: str,
    rfp_data: RFPDetailsCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create RFP details for an opportunity
    
    This creates the RFP details including submission deadline, bid manager, etc.
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if RFP details already exist
    existing_rfp = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    if existing_rfp:
        raise HTTPException(status_code=400, detail="RFP details already exist for this opportunity")
    
    # Prepare RFP details
    rfp_dict = rfp_data.model_dump()
    rfp_dict["opportunityId"] = opportunity_id
    rfp_dict["createdAt"] = datetime.utcnow()
    rfp_dict["updatedAt"] = datetime.utcnow()
    
    # Insert RFP details
    result = await db.rfpDetails.insert_one(rfp_dict)
    
    # Return the created RFP details
    created_rfp = await db.rfpDetails.find_one({"_id": result.inserted_id})
    created_rfp["id"] = str(created_rfp["_id"])
    del created_rfp["_id"]
    
    return created_rfp

@router.put("/{opportunity_id}/rfp", response_model=Dict[str, Any])
async def update_rfp_details(
    opportunity_id: str,
    rfp_data: RFPDetailsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update RFP details for an opportunity
    
    Only updates the fields provided in the request.
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if RFP details exist
    existing_rfp = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    if not existing_rfp:
        raise HTTPException(status_code=404, detail="RFP details not found for this opportunity")
    
    # Prepare update data (exclude unset fields)
    update_data = rfp_data.model_dump(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    # Update RFP details
    result = await db.rfpDetails.update_one(
        {"opportunityId": opportunity_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Failed to update RFP details")
    
    # Return the updated RFP details
    updated_rfp = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    updated_rfp["id"] = str(updated_rfp["_id"])
    del updated_rfp["_id"]
    
    return updated_rfp

# ==================== RFP DOCUMENTS ENDPOINTS ====================

@router.get("/{opportunity_id}/rfp/documents", response_model=List[Dict[str, Any]])
async def get_rfp_documents(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all RFP documents for an opportunity
    
    Returns a list of documents associated with the RFP
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Get RFP documents
    documents = await db.rfpDocuments.find({"opportunityId": opportunity_id}).to_list(100)
    
    # Convert ObjectId to string for JSON serialization
    for doc in documents:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    
    return documents

@router.post(
    "/{opportunity_id}/rfp/documents", 
    response_model=Dict[str, Any], 
    status_code=status.HTTP_201_CREATED
)
async def upload_rfp_document(
    opportunity_id: str,
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a document for an RFP
    
    Supports uploading various document types like RFP, Proposal, Presentation, etc.
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if RFP details exist
    rfp_details = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    if not rfp_details:
        raise HTTPException(status_code=400, detail="RFP details not found. Please create RFP details first.")
    
    # Save the uploaded file
    file_path = save_upload_file(file, opportunity_id, "rfp")
    
    # Prepare document data
    document_data = {
        "opportunityId": opportunity_id,
        "documentType": document_type,
        "fileName": file.filename,
        "filePath": file_path,
        "fileSize": file.size,
        "mimeType": file.content_type,
        "uploadedBy": current_user.get("email", "system"),
        "uploadedAt": datetime.utcnow()
    }
    
    # Insert document record
    result = await db.rfpDocuments.insert_one(document_data)
    
    # Return the created document
    created_doc = await db.rfpDocuments.find_one({"_id": result.inserted_id})
    created_doc["id"] = str(created_doc["_id"])
    del created_doc["_id"]
    
    return created_doc

@router.delete(
    "/{opportunity_id}/rfp/documents/{document_id}", 
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_rfp_document(
    opportunity_id: str,
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an RFP document
    
    This will remove the document record and delete the associated file
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if document exists
    document = await db.rfpDocuments.find_one({
        "_id": ObjectId(document_id),
        "opportunityId": opportunity_id
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the file from storage
    try:
        file_path = Path(UPLOAD_DIR) / document["filePath"]
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Delete the document record
    await db.rfpDocuments.delete_one({"_id": ObjectId(document_id)})
    
    return None

# ==================== SOW DETAILS ENDPOINTS ====================

@router.get("/{opportunity_id}/sow", response_model=SOWDetails)
async def get_sow_details(
    opportunity_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Get SOW details for an opportunity
    
    Returns the SOW details including contract value, target kickoff date, etc.
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Get SOW details
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    
    if not sow_details:
        raise HTTPException(status_code=404, detail="SOW details not found for this opportunity")
    
    # Convert ObjectId to string for JSON serialization
    sow_details["id"] = str(sow_details["_id"])
    del sow_details["_id"]
    
    return sow_details

@router.post("/{opportunity_id}/sow", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_sow_details(
    opportunity_id: str,
    sow_data: SOWDetailsCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create SOW details for an opportunity
    
    This creates the SOW details including contract value, target kickoff date, etc.
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if SOW details already exist
    existing_sow = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if existing_sow:
        raise HTTPException(status_code=400, detail="SOW details already exist for this opportunity")
    
    # Prepare SOW details
    sow_dict = sow_data.model_dump()
    sow_dict["opportunityId"] = opportunity_id
    sow_dict["createdAt"] = datetime.utcnow()
    sow_dict["updatedAt"] = datetime.utcnow()
    
    # Insert SOW details
    result = await db.sowDetails.insert_one(sow_dict)
    
    # Return the created SOW details
    created_sow = await db.sowDetails.find_one({"_id": result.inserted_id})
    created_sow["id"] = str(created_sow["_id"])
    del created_sow["_id"]
    
    return created_sow

@router.put("/{opportunity_id}/sow", response_model=Dict[str, Any])
async def update_sow_details(
    opportunity_id: str,
    sow_data: SOWDetailsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update SOW details for an opportunity
    
    Only updates the fields provided in the request.
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if SOW details exist
    existing_sow = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not existing_sow:
        raise HTTPException(status_code=404, detail="SOW details not found for this opportunity")
    
    # Prepare update data (exclude unset fields)
    update_data = sow_data.model_dump(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    # Update SOW details
    result = await db.sowDetails.update_one(
        {"opportunityId": opportunity_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Failed to update SOW details")
    
    # Return the updated SOW details
    updated_sow = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    updated_sow["id"] = str(updated_sow["_id"])
    del updated_sow["_id"]
    
    return updated_sow

# ==================== SOW DOCUMENTS ENDPOINTS ====================

@router.get("/{opportunity_id}/sow/documents", response_model=List[Dict[str, Any]])
async def get_sow_documents(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all SOW documents for an opportunity
    
    Returns a list of documents associated with the SOW
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if SOW exists
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not sow_details:
        return []
    
    # Get SOW documents
    documents = await db.sowDocuments.find({"sowId": str(sow_details["_id"])}).to_list(100)
    
    # Convert ObjectId to string for JSON serialization
    for doc in documents:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    
    return documents

@router.post(
    "/{opportunity_id}/sow/documents", 
    response_model=Dict[str, Any], 
    status_code=status.HTTP_201_CREATED
)
async def upload_sow_document(
    opportunity_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a document for an SOW
    
    Used for uploading signed SOWs and related documents
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if SOW details exist
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not sow_details:
        raise HTTPException(status_code=400, detail="SOW details not found. Please create SOW details first.")
    
    # Save the uploaded file
    file_path = save_upload_file(file, opportunity_id, "sow")
    
    # Prepare document data
    document_data = {
        "sowId": str(sow_details["_id"]),
        "opportunityId": opportunity_id,
        "fileName": file.filename,
        "filePath": file_path,
        "fileSize": file.size,
        "mimeType": file.content_type,
        "uploadedBy": current_user.get("email", "system"),
        "uploadedAt": datetime.utcnow()
    }
    
    # Insert document record
    result = await db.sowDocuments.insert_one(document_data)
    
    # Return the created document
    created_doc = await db.sowDocuments.find_one({"_id": result.inserted_id})
    created_doc["id"] = str(created_doc["_id"])
    del created_doc["_id"]
    
    return created_doc

@router.delete(
    "/{opportunity_id}/sow/documents/{document_id}", 
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_sow_document(
    opportunity_id: str,
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an SOW document
    
    This will remove the document record and delete the associated file
    """
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if SOW exists
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not sow_details:
        raise HTTPException(status_code=404, detail="SOW details not found")
    
    # Check if document exists and belongs to this SOW
    document = await db.sowDocuments.find_one({
        "_id": ObjectId(document_id),
        "sowId": str(sow_details["_id"])
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the file from storage
    try:
        file_path = Path(UPLOAD_DIR) / document["filePath"]
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Delete the document record
    await db.sowDocuments.delete_one({"_id": ObjectId(document_id)})
    
    return None
    opportunity_dict["createdAt"] = datetime.now(timezone.utc)
    opportunity_dict["updatedAt"] = datetime.now(timezone.utc)
    
    # Set created by if not provided
    if not opportunity_dict.get("createdBy"):
        opportunity_dict["createdBy"] = current_user.get("email", "system")
    
    await db.opportunities.insert_one(opportunity_dict)
    return opportunity_dict

@router.put("/{opportunity_id}", response_model=Opportunity)
async def update_opportunity(opportunity_id: str, opportunity_data: OpportunityUpdate, current_user: dict = Depends(get_current_user)):
    """Update opportunity"""
    db = get_db()
    update_dict = {k: v for k, v in opportunity_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updatedAt"] = datetime.now(timezone.utc)
    
    # Check for workflow triggers
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Auto-create SOW details if pipeline status is Converted to SOW
    if update_dict.get("pipelineStatus") == "Converted to SOW":
        existing_sow = await db.sowDetails.find_one({"opportunityId": opportunity_id})
        if not existing_sow:
            sow_dict = {
                "opportunityId": opportunity_id,
                "sowTitle": f"{opportunity['opportunityName']} - SOW",
                "sowStatus": "Draft",
                "contractValue": opportunity.get("amount", 0),
                "currency": opportunity.get("currency", "USD"),
                "value": opportunity.get("value", 0),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc)
            }
            await db.sowDetails.insert_one(sow_dict)
    
    result = await db.opportunities.update_one(
        {"opportunityId": opportunity_id}, 
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    updated_opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    return updated_opportunity

@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """Delete opportunity and all related data"""
    db = get_db()
    
    # Delete opportunity
    result = await db.opportunities.delete_one({"opportunityId": opportunity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Delete related data
    await db.rfpDetails.delete_many({"opportunityId": opportunity_id})
    await db.rfpDocuments.delete_many({"opportunityId": opportunity_id})
    
    # Get SOW details to delete SOW documents
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if sow_details:
        await db.sowDocuments.delete_many({"sowId": str(sow_details["_id"])})
        await db.sowDetails.delete_one({"opportunityId": opportunity_id})

# ==================== RFP DETAILS ENDPOINTS ====================

@router.get("/{opportunity_id}/rfp-details", response_model=RFPDetails)
async def get_rfp_details(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """Get RFP details for opportunity"""
    db = get_db()
    rfp_details = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    if not rfp_details:
        raise HTTPException(status_code=404, detail="RFP details not found")
    return rfp_details

@router.post("/{opportunity_id}/rfp-details", response_model=RFPDetails, status_code=status.HTTP_201_CREATED)
async def create_rfp_details(opportunity_id: str, rfp_data: RFPDetailsCreate, current_user: dict = Depends(get_current_user)):
    """Create RFP details for opportunity"""
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if RFP details already exist
    existing = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    if existing:
        raise HTTPException(status_code=400, detail="RFP details already exist")
    
    rfp_dict = rfp_data.model_dump()
    rfp_dict["opportunityId"] = opportunity_id
    rfp_dict["createdAt"] = datetime.now(timezone.utc)
    rfp_dict["updatedAt"] = datetime.now(timezone.utc)
    
    await db.rfpDetails.insert_one(rfp_dict)
    return rfp_dict

@router.put("/{opportunity_id}/rfp-details", response_model=RFPDetails)
async def update_rfp_details(opportunity_id: str, rfp_data: RFPDetailsUpdate, current_user: dict = Depends(get_current_user)):
    """Update RFP details"""
    db = get_db()
    update_dict = {k: v for k, v in rfp_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updatedAt"] = datetime.now(timezone.utc)
    
    result = await db.rfpDetails.update_one(
        {"opportunityId": opportunity_id}, 
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="RFP details not found")
    
    updated_rfp = await db.rfpDetails.find_one({"opportunityId": opportunity_id})
    return updated_rfp

# ==================== RFP DOCUMENTS ENDPOINTS ====================

@router.get("/{opportunity_id}/rfp-documents", response_model=List[RFPDocument])
async def get_rfp_documents(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """Get RFP documents for opportunity"""
    db = get_db()
    documents = await db.rfpDocuments.find({"opportunityId": opportunity_id}).to_list(50)
    return documents

@router.post("/{opportunity_id}/rfp-documents", response_model=RFPDocument, status_code=status.HTTP_201_CREATED)
async def upload_rfp_document(opportunity_id: str, document_data: RFPDocumentCreate, current_user: dict = Depends(get_current_user)):
    """Upload RFP document"""
    db = get_db()
    
    doc_dict = document_data.model_dump()
    doc_dict["opportunityId"] = opportunity_id
    doc_dict["uploadedBy"] = current_user.get("email", "system")
    doc_dict["uploadedAt"] = datetime.now(timezone.utc)
    
    await db.rfpDocuments.insert_one(doc_dict)
    return doc_dict

@router.delete("/{opportunity_id}/rfp-documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rfp_document(opportunity_id: str, document_id: str, current_user: dict = Depends(get_current_user)):
    """Delete RFP document"""
    db = get_db()
    result = await db.rfpDocuments.delete_one({
        "opportunityId": opportunity_id,
        "_id": document_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

# ==================== SOW DETAILS ENDPOINTS ====================

@router.get("/{opportunity_id}/sow-details", response_model=SOWDetails)
async def get_sow_details(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """Get SOW details for opportunity"""
    db = get_db()
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not sow_details:
        raise HTTPException(status_code=404, detail="SOW details not found")
    return sow_details

@router.post("/{opportunity_id}/sow-details", response_model=SOWDetails, status_code=status.HTTP_201_CREATED)
async def create_sow_details(opportunity_id: str, sow_data: SOWDetailsCreate, current_user: dict = Depends(get_current_user)):
    """Create SOW details for opportunity"""
    db = get_db()
    
    # Check if opportunity exists
    opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if SOW details already exist
    existing = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if existing:
        raise HTTPException(status_code=400, detail="SOW details already exist")
    
    sow_dict = sow_data.model_dump()
    sow_dict["opportunityId"] = opportunity_id
    sow_dict["createdAt"] = datetime.now(timezone.utc)
    sow_dict["updatedAt"] = datetime.now(timezone.utc)
    
    await db.sowDetails.insert_one(sow_dict)
    return sow_dict

@router.put("/{opportunity_id}/sow-details", response_model=SOWDetails)
async def update_sow_details(opportunity_id: str, sow_data: SOWDetailsUpdate, current_user: dict = Depends(get_current_user)):
    """Update SOW details"""
    db = get_db()
    update_dict = {k: v for k, v in sow_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updatedAt"] = datetime.now(timezone.utc)
    
    # Check for project creation workflow
    if update_dict.get("sowStatus") == "Signed":
        # Create project in delivery module
        opportunity = await db.opportunities.find_one({"opportunityId": opportunity_id})
        if opportunity:
            existing_project = await db.projects.count_documents({
                "linked_opportunity_id": opportunity_id
            })
            
            if existing_project == 0:
                project_dict = {
                    "project_name": opportunity["opportunityName"],
                    "client_name": opportunity["clientName"],
                    "linked_opportunity_id": opportunity_id,
                    "contract_value": update_dict.get("contractValue", 0),
                    "currency": opportunity.get("currency", "USD"),
                    "target_kickoff_date": update_dict.get("targetKickoffDate"),
                    "status": "Planned",
                    "project_type": "New",
                    "priority": "Medium",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.projects.insert_one(project_dict)
    
    result = await db.sowDetails.update_one(
        {"opportunityId": opportunity_id}, 
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="SOW details not found")
    
    updated_sow = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    return updated_sow

# ==================== SOW DOCUMENTS ENDPOINTS ====================

@router.get("/{opportunity_id}/sow-documents", response_model=List[SOWDocument])
async def get_sow_documents(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """Get SOW documents for opportunity"""
    db = get_db()
    
    # First get SOW details to get sowId
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not sow_details:
        raise HTTPException(status_code=404, detail="SOW details not found")
    
    documents = await db.sowDocuments.find({"sowId": str(sow_details["_id"])}).to_list(50)
    return documents

@router.post("/{opportunity_id}/sow-documents", response_model=SOWDocument, status_code=status.HTTP_201_CREATED)
async def upload_sow_document(opportunity_id: str, document_data: SOWDocumentCreate, current_user: dict = Depends(get_current_user)):
    """Upload SOW document"""
    db = get_db()
    
    # Get SOW details to get sowId
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not sow_details:
        raise HTTPException(status_code=404, detail="SOW details not found")
    
    doc_dict = document_data.model_dump()
    doc_dict["sowId"] = str(sow_details["_id"])
    doc_dict["uploadedAt"] = datetime.now(timezone.utc)
    
    await db.sowDocuments.insert_one(doc_dict)
    return doc_dict

@router.delete("/{opportunity_id}/sow-documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sow_document(opportunity_id: str, document_id: str, current_user: dict = Depends(get_current_user)):
    """Delete SOW document"""
    db = get_db()
    
    # Get SOW details to verify ownership
    sow_details = await db.sowDetails.find_one({"opportunityId": opportunity_id})
    if not sow_details:
        raise HTTPException(status_code=404, detail="SOW details not found")
    
    result = await db.sowDocuments.delete_one({
        "sowId": str(sow_details["_id"]),
        "_id": document_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
