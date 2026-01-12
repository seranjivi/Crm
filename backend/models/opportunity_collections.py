from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Union
from datetime import datetime, date
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class BaseMongoModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

# 1. Opportunities Collection
class OpportunityMongo(BaseMongoModel):
    """Core Opportunity Details Collection"""
    opportunity_id: str = Field(..., description="Auto-generated readable ID, e.g., OPP-001")
    opportunity_name: str
    client_id: Optional[str] = Field(None, description="Reference to Clients collection")
    client_name: str
    lead_source: Optional[str] = None
    close_date: Optional[Union[datetime, date, str]] = None
    type: str = Field(default="New Business", description="New Business / Existing Business")
    amount: Optional[float] = 0
    currency: str = "USD"
    value: Optional[float] = 0
    internal_recommendation: Optional[str] = Field(None, description="Triaged status")
    pipeline_status: str
    win_probability: int = 10
    next_steps: Optional[str] = None
    status: str = "Active"  # Active / Closed
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# 2. RFP Details Collection
class QALogEntry(BaseModel):
    question: str
    answer: Optional[str] = None
    asked_by: Optional[str] = None
    asked_date: Optional[datetime] = None
    answered_by: Optional[str] = None
    answered_date: Optional[datetime] = None
    status: str = "Pending"  # Pending, Answered

class RFPDetailsMongo(BaseMongoModel):
    """RFP-related data linked to Opportunity"""
    opportunity_id: str = Field(..., description="Reference to opportunities collection")
    rfp_title: Optional[str] = None
    rfp_status: Optional[str] = Field(None, description="Won / Lost")
    submission_deadline: Optional[Union[datetime, date, str]] = None
    bid_manager: Optional[str] = None
    submission_mode: Optional[str] = None
    portal_url: Optional[str] = None
    qa_logs: Optional[List[QALogEntry]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# 3. RFP Documents Collection
class RFPDocumentsMongo(BaseMongoModel):
    """Store RFP and proposal documents"""
    opportunity_id: str = Field(..., description="Reference to opportunities collection")
    document_type: str = Field(..., description="RFP / Proposal / Presentation / Commercial / Other")
    file_name: str
    file_url: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

# 4. SOW Details Collection
class SOWDetailsMongo(BaseMongoModel):
    """Store SOW information after conversion"""
    opportunity_id: str = Field(..., description="Reference to opportunities collection")
    sow_title: Optional[str] = None
    sow_status: Optional[str] = Field(None, description="Draft / Signed")
    contract_value: Optional[float] = None
    currency: str = "USD"
    value: Optional[float] = None
    target_kickoff_date: Optional[Union[datetime, date, str]] = None
    linked_proposal_ref: Optional[str] = None
    scope_overview: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# 5. SOW Documents Collection
class SOWDocumentsMongo(BaseMongoModel):
    """Store signed SOW and agreement files"""
    sow_id: str = Field(..., description="Reference to sow_details collection")
    file_name: str
    file_url: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

# Collection names mapping
OPPORTUNITIES_COLLECTION = "opportunities"
RFP_DETAILS_COLLECTION = "rfp_details"
RFP_DOCUMENTS_COLLECTION = "rfp_documents"
SOW_DETAILS_COLLECTION = "sow_details"
SOW_DOCUMENTS_COLLECTION = "sow_documents"
