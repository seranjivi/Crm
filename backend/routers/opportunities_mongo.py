"""
MongoDB Routers for Opportunity Module
API endpoints for all Opportunity-related collections
"""

from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
from typing import List, Optional
from models.opportunity_mongo_models import (
    Opportunity, OpportunityCreate, OpportunityUpdate,
    RFPDetails, RFPDetailsCreate, RFPDetailsUpdate,
    RFPDocument, RFPDocumentCreate,
    SOWDetails, SOWDetailsCreate, SOWDetailsUpdate,
    SOWDocument, SOWDocumentCreate,
    OpportunityView, QALogEntry
)
from database import get_db
from utils.middleware import get_current_user

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

# Helper function to generate opportunity ID
async def generate_opportunity_id(db):
    """Generate unique opportunity ID like OPP-001"""
    last_opportunity = await db.opportunities.find_one(
        sort=[("opportunityId", -1)]
    )
    if last_opportunity and "opportunityId" in last_opportunity:
        last_num = int(last_opportunity["opportunityId"].split("-")[1])
        new_num = last_num + 1
    else:
        new_num = 1
    return f"OPP-{new_num:03d}"

# ==================== OPPORTUNITY ENDPOINTS ====================

@router.get("", response_model=List[Opportunity])
async def get_opportunities(current_user: dict = Depends(get_current_user)):
    """Get all opportunities"""
    db = get_db()
    opportunities = await db.opportunities.find({}).to_list(1000)
    return opportunities

@router.get("/{opportunity_id}", response_model=OpportunityView)
async def get_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """Get opportunity with all related data"""
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
    
    return OpportunityView(
        opportunity=opportunity,
        rfpDetails=rfp_details,
        rfpDocuments=rfp_documents,
        sowDetails=sow_details,
        sowDocuments=sow_documents
    )

@router.post("", response_model=Opportunity, status_code=status.HTTP_201_CREATED)
async def create_opportunity(opportunity_data: OpportunityCreate, current_user: dict = Depends(get_current_user)):
    """Create new opportunity"""
    db = get_db()
    opportunity_dict = opportunity_data.model_dump()
    
    # Generate opportunity ID
    opportunity_dict["opportunityId"] = await generate_opportunity_id(db)
    
    # Set timestamps
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
