from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime

class ClientContactBase(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_primary: bool = False

class ClientBase(BaseModel):
    client_id: Optional[str] = None  # Will be auto-generated
    client_name: str
    contact_email: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    service_type: Optional[List[str]] = []
    client_tier: str = "Normal"
    client_status: str = "Active"
    website: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    contacts: Optional[List[ClientContactBase]] = []

class ClientUpdate(BaseModel):
    client_name: Optional[str] = None
    contact_email: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    service_type: Optional[List[str]] = None
    client_tier: Optional[str] = None
    client_status: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    contacts: Optional[List[ClientContactBase]] = None

class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    contacts: List[ClientContactBase] = []
    created_at: datetime
    updated_at: datetime