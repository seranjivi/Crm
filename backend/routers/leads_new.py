from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import uuid
from typing import List, Optional
from models.lead_new import LeadCreate, Lead, LeadUpdate, StatusChangeLog
from database import get_db
from models.opportunity import OpportunityCreate
from utils.middleware import get_current_user
from utils.task_id_generator import generate_task_id
from utils.lead_status import calculate_lead_status, create_status_change_log

router = APIRouter(prefix="/leads", tags=["Leads"])

@router.get("", response_model=List[Lead])
async def get_leads(current_user: dict = Depends(get_current_user)):
    db = get_db()
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    
    # Add task_id to existing leads if missing and update status calculation
    for lead in leads:
        if not lead.get("task_id"):
            lead["task_id"] = f"LEAD-{lead.get('id', 'UNKNOWN')[:8].upper()}"
        
        # Recalculate status for existing leads
        if lead.get("stage"):
            new_status, reason = calculate_lead_status(
                lead["stage"], 
                lead.get("next_followup"),
                lead.get("lead_status")
            )
            # Always set the lead_status to ensure it's present
            lead["lead_status"] = new_status
            if new_status != lead.get("lead_status"):
                # Update in database
                await db.leads.update_one(
                    {"id": lead["id"]},
                    {"$set": {"lead_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
    
    return leads

@router.get("/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Add task_id if missing
    if not lead.get("task_id"):
        lead["task_id"] = f"LEAD-{lead.get('id', 'UNKNOWN')[:8].upper()}"
    
    # Recalculate status if needed
    if lead.get("next_followup") and lead.get("stage"):
        new_status, reason = calculate_lead_status(
            lead["stage"], 
            lead["next_followup"],
            lead.get("lead_status")
        )
        if new_status != lead.get("lead_status"):
            lead["lead_status"] = new_status
            # Update in database
            await db.leads.update_one(
                {"id": lead["id"]},
                {"$set": {"lead_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return lead

@router.post("", response_model=Lead, status_code=status.HTTP_201_CREATED)
async def create_lead(lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    lead_dict = lead_data.model_dump()
    
    # Generate Task ID
    task_id = await generate_task_id(db)
    
    # Set lead_owner to current user (system-controlled)
    lead_dict["lead_owner"] = current_user["full_name"]
    
    # Set default stage if not provided
    if "stage" not in lead_dict:
        lead_dict["stage"] = "New Lead"  # Default stage
    
    # Calculate initial lead status
    initial_status, reason = calculate_lead_status(
        lead_dict["stage"], 
        lead_dict.get("next_followup")
    )
    
    # Create initial status change log
    status_log = create_status_change_log(
        lead_id="",  # Will be set after ID generation
        previous_status=None,
        new_status=initial_status,
        reason="Lead created",
        user_id=current_user["id"],
        user_name=current_user["full_name"]
    )
    
    # Add required fields
    lead_dict["id"] = str(uuid.uuid4())
    lead_dict["lead_status"] = initial_status
    lead_dict["status_change_log"] = [status_log]
    lead_dict["task_id"] = task_id
    lead_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    lead_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    lead_dict["attachments"] = []
    
    # Update the status log with the lead ID
    status_log["lead_id"] = lead_dict["id"]
    
    await db.leads.insert_one(lead_dict)
    
    # Convert datetime objects to strings for response
    for log in lead_dict["status_change_log"]:
        if isinstance(log.get("changed_at"), datetime):
            log["changed_at"] = log["changed_at"].isoformat()
    
    return lead_dict

@router.put("/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str, 
    lead_data: LeadUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    # Find existing lead
    existing_lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Prepare update data
    update_dict = {k: v for k, v in lead_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # Calculate new status based on changes
    stage = update_dict.get("stage", existing_lead.get("stage"))
    next_followup = update_dict.get("next_followup", existing_lead.get("next_followup"))
    
    new_status, reason = calculate_lead_status(
        stage, 
        next_followup,
        existing_lead.get("lead_status")
    )
    
    # Create status change log if status changed
    status_logs = existing_lead.get("status_change_log", [])
    if new_status != existing_lead.get("lead_status"):
        status_log = create_status_change_log(
            lead_id=lead_id,
            previous_status=existing_lead.get("lead_status"),
            new_status=new_status,
            reason=reason,
            user_id=current_user["id"],
            user_name=current_user["full_name"]
        )
        status_logs.append(status_log)
    
    # Update the lead
    update_dict.update({
        "lead_status": new_status,
        "status_change_log": status_logs,
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    
    result = await db.leads.update_one({"id": lead_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Return updated lead
    updated_lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    
    # Convert datetime objects to strings for response
    for log in updated_lead["status_change_log"]:
        if isinstance(log.get("changed_at"), datetime):
            log["changed_at"] = log["changed_at"].isoformat()
    
    return updated_lead

@router.get("/{lead_id}/status-history")
async def get_lead_status_history(lead_id: str, current_user: dict = Depends(get_current_user)):
    """Get the complete status change history for a lead."""
    db = get_db()
    
    lead = await db.leads.find_one(
        {"id": lead_id}, 
        {"_id": 0, "status_change_log": 1}
    )
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {
        "lead_id": lead_id,
        "status_history": lead.get("status_change_log", [])
    }

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")

@router.get("/status/config")
async def get_status_config(current_user: dict = Depends(get_current_user)):
    """Get lead status configuration for UI."""
    from utils.lead_status import get_status_rules_config
    
    return get_status_rules_config()
