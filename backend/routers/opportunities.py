from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import uuid
from typing import List
from models.opportunity import OpportunityCreate, Opportunity, OpportunityUpdate
from database import get_db
from utils.middleware import get_current_user
from utils.task_id_generator import generate_task_id

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])





@router.get("", response_model=List[Opportunity])
async def get_opportunities(current_user: dict = Depends(get_current_user)):
    db = get_db()
    opportunities = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    
    # Add task_id to existing opportunities if missing
    for opportunity in opportunities:
        if not opportunity.get("task_id"):
            opportunity["task_id"] = f"OPP-{opportunity.get('id', 'UNKNOWN')[:8].upper()}"
    
    return opportunities

@router.get("/{opportunity_id}", response_model=Opportunity)
async def get_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    opportunity = await db.opportunities.find_one({"id": opportunity_id}, {"_id": 0})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Add task_id if missing
    if not opportunity.get("task_id"):
        opportunity["task_id"] = f"OPP-{opportunity.get('id', 'UNKNOWN')[:8].upper()}"
    
    return opportunity

@router.post("", response_model=Opportunity, status_code=status.HTTP_201_CREATED)
async def create_opportunity(opportunity_data: OpportunityCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    opportunity_dict = opportunity_data.model_dump()
    
    # Generate Task ID if not provided
    if not opportunity_dict.get("task_id"):
        opportunity_dict["task_id"] = await generate_task_id(db)
    
    if "expected_closure_date" in opportunity_dict and opportunity_dict["expected_closure_date"]:
        opportunity_dict["expected_closure_date"] = opportunity_dict["expected_closure_date"].isoformat()
    
    opportunity_dict["id"] = str(uuid.uuid4())
    opportunity_dict["linked_lead_id"] = None
    opportunity_dict["linked_sow_id"] = None
    
    # Use provided created_at or default to now
    if opportunity_dict.get("created_at"):
        # If provided as string date, convert to datetime
        if isinstance(opportunity_dict["created_at"], str) and 'T' not in opportunity_dict["created_at"]:
            # It's a date string like "2025-12-11", convert to datetime
            opportunity_dict["created_at"] = opportunity_dict["created_at"] + "T00:00:00+00:00"
        elif isinstance(opportunity_dict["created_at"], datetime):
            opportunity_dict["created_at"] = opportunity_dict["created_at"].isoformat()
    else:
        opportunity_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    opportunity_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.opportunities.insert_one(opportunity_dict)
    return opportunity_dict

@router.put("/{opportunity_id}", response_model=Opportunity)
async def update_opportunity(opportunity_id: str, opportunity_data: OpportunityUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_dict = {k: v for k, v in opportunity_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Handle date fields
    for date_field in ['expected_closure_date', 'close_date', 'submission_deadline', 'target_kickoff_date']:
        if date_field in update_dict and update_dict[date_field]:
            if hasattr(update_dict[date_field], 'isoformat'):
                update_dict[date_field] = update_dict[date_field].isoformat()
    
    # Handle created_at update if provided
    if "created_at" in update_dict and update_dict["created_at"]:
        if isinstance(update_dict["created_at"], str) and 'T' not in update_dict["created_at"]:
            # It's a date string like "2025-12-11", convert to datetime
            update_dict["created_at"] = update_dict["created_at"] + "T00:00:00+00:00"
        elif hasattr(update_dict["created_at"], 'isoformat'):
            update_dict["created_at"] = update_dict["created_at"].isoformat()
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Get opportunity for workflow checks
    opportunity = await db.opportunities.find_one({"id": opportunity_id}, {"_id": 0})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Workflow 1: Auto-convert to SOW if pipeline status is Converted to SOW
    if update_dict.get("pipeline_status") == "Converted to SOW" or update_dict.get("stage") == "Closed Won":
        # Check if already converted
        if not opportunity.get("linked_sow_id"):
            # Create SOW
            sow_dict = {
                "id": str(uuid.uuid4()),
                "client_name": opportunity.get("client_name"),
                "project_name": opportunity.get("opportunity_name"),
                "sow_title": update_dict.get("sow_title") or f"{opportunity.get('opportunity_name')} - SOW",
                "sow_type": "New",
                "start_date": None,
                "end_date": opportunity.get("expected_closure_date"),
                "value": update_dict.get("contract_value") or opportunity.get("estimated_value", 0),
                "currency": opportunity.get("currency_code", "USD"),
                "billing_type": "Fixed",
                "status": "Active",
                "owner": opportunity.get("sales_owner"),
                "delivery_spoc": opportunity.get("technical_poc"),
                "milestones": None,
                "po_number": None,
                "invoice_plan": None,
                "documents_link": None,
                "notes": opportunity.get("next_steps"),
                "linked_opportunity_id": opportunity_id,
                "attachments": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.sows.insert_one(sow_dict)
            
            # Update opportunity with linked SOW
            update_dict["linked_sow_id"] = sow_dict["id"]
    
    # Workflow 2: Auto-create Project if SOW status is Signed
    if update_dict.get("sow_status") == "Signed":
        # Check if project already exists for this opportunity
        existing_project = await db.projects.count_documents({
            "linked_opportunity_id": opportunity_id
        })
        
        if existing_project == 0:
            # Create Project in Delivery module
            project_dict = {
                "id": str(uuid.uuid4()),
                "project_name": opportunity.get("opportunity_name"),
                "client_name": opportunity.get("client_name"),
                "opportunity_name": opportunity.get("opportunity_name"),
                "linked_opportunity_id": opportunity_id,
                "contract_value": update_dict.get("contract_value") or opportunity.get("estimated_value", 0),
                "currency": opportunity.get("currency_code", "USD"),
                "target_kickoff_date": update_dict.get("target_kickoff_date"),
                "status": "Planned",
                "project_type": "New",
                "priority": "Medium",
                "project_manager": opportunity.get("technical_poc"),
                "delivery_spoc": opportunity.get("technical_poc"),
                "sales_owner": opportunity.get("sales_owner"),
                "description": f"Project created from signed SOW for {opportunity.get('opportunity_name')}",
                "start_date": update_dict.get("target_kickoff_date"),
                "end_date": None,
                "budget": update_dict.get("contract_value") or opportunity.get("estimated_value", 0),
                "attachments": update_dict.get("signed_document_assets", []),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.projects.insert_one(project_dict)
    
    # Workflow 3: Auto-create Action Item if status is Completed
    if update_dict.get("status") == "Completed":
        # Check if Action Item already exists for this opportunity
        existing_action_item = await db.action_items.count_documents({
            "linked_to": opportunity_id,
            "linked_to_type": "Opportunity"
        })
        
        if existing_action_item == 0:
            # Create Action Item with SAME Task ID
            action_item_dict = {
                "id": str(uuid.uuid4()),
                "task_id": opportunity.get("task_id", "SAL0000"),
                "task_title": f"Follow-up: {opportunity['opportunity_name']}",
                "linked_to": opportunity_id,
                "linked_to_type": "Opportunity",
                "assigned_to": opportunity.get("sales_owner", ""),
                "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).date().isoformat(),
                "priority": "Medium",
                "status": "Not Started",
                "notes": f"Post-completion follow-up for {opportunity['opportunity_name']}. Next steps: {opportunity.get('next_steps', 'N/A')}",
                "completed_date": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.action_items.insert_one(action_item_dict)
    
    result = await db.opportunities.update_one({"id": opportunity_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    opportunity = await db.opportunities.find_one({"id": opportunity_id}, {"_id": 0})
    return opportunity

@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.opportunities.delete_one({"id": opportunity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return None