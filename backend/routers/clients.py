from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import uuid
from typing import List
from models.client import ClientCreate, Client, ClientUpdate
from database import get_db
from utils.middleware import get_current_user

router = APIRouter(prefix="/clients", tags=["Clients"])





@router.get("", response_model=List[Client])
async def get_clients(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return clients

@router.get("/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    client_doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    return client_doc

def generate_client_id(client_name: str) -> str:
    """Generate a client ID in the format: CL-{FIRST3LETTERS}-{TIMESTAMP}"""
    timestamp = int(datetime.now().timestamp())
    prefix = client_name[:3].upper() if client_name else 'CLI'
    return f"{prefix}-{timestamp}"

@router.post("", response_model=Client, status_code=status.HTTP_201_CREATED)
async def create_client(client_data: ClientCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    client_dict = client_data.model_dump()
    
    # Generate client ID
    client_dict["client_id"] = generate_client_id(client_data.client_name)
    client_dict["id"] = str(uuid.uuid4())  # Keep UUID as internal ID
    
    # Set timestamps
    now = datetime.now(timezone.utc).isoformat()
    client_dict["created_at"] = now
    client_dict["updated_at"] = now
    
    await db.clients.insert_one(client_dict)
    return client_dict

@router.put("/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_dict = {k: v for k, v in client_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.clients.update_one({"id": client_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client_doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return client_doc

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return None