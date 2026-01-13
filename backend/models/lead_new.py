from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
 
class LeadStatus(str, Enum):
    NEW = "New"
    QUALIFIED = "Qualified"
    PROPOSAL_SENT = "Proposal Sent"
    NEGOTIATION = "Negotiation"
    WON = "Won"
    LOST = "Lost"
 
class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"
 
class DealType(str, Enum):
    NEW_BUSINESS = "New Business"
    EXISTING_BUSINESS = "Existing Business"
    RENEWAL = "Renewal"
    UPSELL = "Upsell"
    CROSS_SELL = "Cross-sell"
 
class StatusChangeLog(BaseModel):
    previous_status: Optional[str]
    new_status: str
    changed_at: datetime
    changed_by: str
    notes: Optional[str] = None
 
class LeadBase(BaseModel):
    # Basic Information
    lead_name: str = Field(..., description="Name of the lead")
    client_name: str = Field(..., description="Name of the client/company")
    assigned_to: Optional[str] = Field(default=None, description="ID of the assigned POC")
    description: Optional[str] = None
    stage: str = Field(default="New Lead", description="Current stage of the lead")
   
    # Contact Information
    primary_contact: Optional[str] = Field(default=None, description="Primary contact name")
    contact_phone: str
    contact_email: EmailStr
   
    # Location Information
    region: str
    country: str
   
    # Deal Information
    deal_type: DealType
    priority: Priority
    status: LeadStatus = LeadStatus.NEW
    lead_created: datetime = Field(default_factory=datetime.utcnow)
    estimated_deal_value: float = 0.0
    currency: str = "USD"
   
    # Additional Fields
    attachments: List[Dict[str, Any]] = []
    activity_history: List[Dict[str, Any]] = []
 
class LeadCreate(LeadBase):
    """Model for creating a new lead"""
    status_change_log: Optional[List[StatusChangeLog]] = None
 
class LeadUpdate(BaseModel):
    """Model for updating an existing lead"""
    # Basic Information
    lead_name: Optional[str] = None
    client_name: Optional[str] = None
    assigned_to: Optional[str] = None
    description: Optional[str] = None
   
    # Contact Information
    primary_contact: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
   
    # Location Information
    region: Optional[str] = None
    country: Optional[str] = None
   
    # Deal Information
    deal_type: Optional[DealType] = None
    priority: Optional[Priority] = None
    status: Optional[LeadStatus] = None
    lead_created: Optional[datetime] = None
    estimated_deal_value: Optional[float] = None
    currency: Optional[str] = None
   
    # Additional Fields
    attachments: Optional[List[Dict[str, Any]]] = None
    activity_history: Optional[List[Dict[str, Any]]] = None
 
class Lead(LeadBase):
    """Complete Lead model with system fields"""
    model_config = ConfigDict(extra="ignore")
   
    # System fields
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: str
    status_change_log: List[StatusChangeLog] = []
   
    def update(self, update_data: Dict[str, Any], updated_by: str):
        """Helper method to update lead fields and track changes"""
        for field, value in update_data.items():
            if hasattr(self, field) and value is not None:
                # Track status changes
                if field == 'status' and getattr(self, 'status') != value:
                    self.status_change_log.append(StatusChangeLog(
                        previous_status=getattr(self, 'status', None),
                        new_status=value,
                        changed_at=datetime.utcnow(),
                        changed_by=updated_by,
                        notes=f"Status changed from {getattr(self, 'status', 'None')} to {value}"
                    ))
                setattr(self, field, value)
       
        self.updated_at = datetime.utcnow()
        self.updated_by = updated_by
 