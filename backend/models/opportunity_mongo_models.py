"""
MongoDB Schema Models for Opportunity Module
Pydantic models for data validation and API responses
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Union, Dict, Any
from datetime import datetime, date
from bson import ObjectId
from enum import Enum

# Helper for MongoDB ObjectId handling
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

# Base models with MongoDB support
class MongoBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# Enums for fixed values
class OpportunityType(str, Enum):
    NEW_BUSINESS = "New Business"
    EXISTING_BUSINESS = "Existing Business"
    UPSELL = "Upsell"
    RENEWAL = "Renewal"
    CROSS_SELL = "Cross-sell"
    REFERRAL = "Referral"

class PipelineStatus(str, Enum):
    PROSPECTING = "Prospecting"
    QUALIFICATION = "Qualification"
    NEEDS_ANALYSIS = "Needs Analysis"
    PROPOSAL = "Proposal"
    NEGOTIATION = "Negotiation"
    CLOSED_WON = "Closed Won"
    CLOSED_LOST = "Closed Lost"

class RFPStatus(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    WON = "Won"
    LOST = "Lost"
    IN_PROGRESS = "In Progress"

class SOWStatus(str, Enum):
    DRAFT = "Draft"
    IN_REVIEW = "In Review"
    SIGNED = "Signed"
    REJECTED = "Rejected"

class DocumentType(str, Enum):
    RFP = "RFP"
    PROPOSAL = "Proposal"
    PRESENTATION = "Presentation"
    COMMERCIAL = "Commercial"
    OTHER = "Other"

# 1. Opportunity Model (Details Tab)
class OpportunityBase(MongoBaseModel):
    opportunityId: Optional[str] = Field(None, description="Auto-generated opportunity ID")
    opportunityName: str = Field(..., description="Name of the opportunity")
    clientId: str = Field(..., description="Reference to Client ID")
    clientName: str = Field(..., description="Name of the client")
    closeDate: date = Field(..., description="Expected close date")
    amount: float = Field(0.0, description="Opportunity amount")
    currency: str = Field("USD", description="Currency code (e.g., USD, INR)")
    leadSource: Optional[str] = Field(None, description="Source of the lead")
    type: OpportunityType = Field(OpportunityType.NEW_BUSINESS, description="Type of opportunity")
    triaged: bool = Field(False, description="Whether the opportunity has been triaged")
    pipelineStatus: PipelineStatus = Field(PipelineStatus.PROSPECTING, description="Current pipeline status")
    winProbability: int = Field(10, ge=0, le=100, description="Win probability percentage")
    nextSteps: List[Dict[str, Any]] = Field(default_factory=list, description="List of next steps with user and timestamp")
    createdBy: Optional[str] = Field(None, description="User who created the opportunity")

    @field_validator('closeDate', mode='before')
    @classmethod
    def parse_close_date(cls, v):
        if not v:
            raise ValueError("Close date is required")
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            if len(v) == 10:  # YYYY-MM-DD format
                return datetime.strptime(v, '%Y-%m-%d').date()
            return datetime.fromisoformat(v.replace('Z', '+00:00')).date()
        return v

class OpportunityCreate(OpportunityBase):
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class OpportunityUpdate(MongoBaseModel):
    opportunityName: Optional[str] = None
    clientId: Optional[str] = None
    clientName: Optional[str] = None
    closeDate: Optional[date] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    leadSource: Optional[str] = None
    type: Optional[OpportunityType] = None
    triaged: Optional[bool] = None
    pipelineStatus: Optional[PipelineStatus] = None
    winProbability: Optional[int] = None
    nextSteps: Optional[List[Dict[str, Any]]] = None

class Opportunity(OpportunityBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# 2. RFP Details Model
class QALogEntry(MongoBaseModel):
    question: str
    answer: Optional[str] = None
    askedBy: Optional[str] = None
    askedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    answeredBy: Optional[str] = None
    answeredAt: Optional[datetime] = None

class RFPDetailsBase(MongoBaseModel):
    opportunityId: str = Field(..., description="Reference to opportunity")
    rfpTitle: str = Field(..., description="Title of the RFP")
    rfpStatus: RFPStatus = Field(RFPStatus.DRAFT, description="Current status of the RFP")
    submissionDeadline: Optional[datetime] = Field(None, description="Deadline for RFP submission")
    bidManager: Optional[str] = Field(None, description="Person responsible for bid management")
    submissionMode: Optional[str] = Field(None, description="Mode of submission (Portal, Email, etc.)")
    portalUrl: Optional[str] = Field(None, description="URL of the portal if submission is via portal")
    qaLogs: List[QALogEntry] = Field(default_factory=list, description="List of Q&A entries")

class RFPDetailsCreate(RFPDetailsBase):
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class RFPDetailsUpdate(MongoBaseModel):
    rfpTitle: Optional[str] = None
    rfpStatus: Optional[RFPStatus] = None
    submissionDeadline: Optional[datetime] = None
    bidManager: Optional[str] = None
    submissionMode: Optional[str] = None
    portalUrl: Optional[str] = None
    qaLogs: Optional[List[QALogEntry]] = None

class RFPDetails(RFPDetailsBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# 3. RFP Documents Model
class RFPDocumentBase(MongoBaseModel):
    opportunityId: str = Field(..., description="Reference to opportunity")
    documentType: DocumentType = Field(..., description="Type of document")
    fileName: str = Field(..., description="Name of the file")
    fileUrl: str = Field(..., description="URL to access the file")
    uploadedBy: str = Field(..., description="User who uploaded the document")

class RFPDocumentCreate(RFPDocumentBase):
    pass

class RFPDocument(RFPDocumentBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)

# 4. SOW Details Model
class SOWDetailsBase(MongoBaseModel):
    opportunityId: str = Field(..., description="Reference to opportunity")
    sowTitle: str = Field(..., description="Title of the SOW")
    sowStatus: SOWStatus = Field(SOWStatus.DRAFT, description="Current status of the SOW")
    contractValue: float = Field(0.0, description="Value of the contract")
    currency: str = Field("USD", description="Currency code")
    targetKickoffDate: Optional[date] = Field(None, description="Planned kickoff date")
    linkedProposalRef: Optional[str] = Field(None, description="Reference to linked proposal")
    scopeOverview: Optional[str] = Field(None, description="Brief overview of the scope")

    @field_validator('targetKickoffDate', mode='before')
    @classmethod
    def parse_target_kickoff_date(cls, v):
        if not v:
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            if len(v) == 10:  # YYYY-MM-DD format
                return datetime.strptime(v, '%Y-%m-%d').date()
            return datetime.fromisoformat(v.replace('Z', '+00:00')).date()
        return v

class SOWDetailsCreate(SOWDetailsBase):
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class SOWDetailsUpdate(MongoBaseModel):
    sowTitle: Optional[str] = None
    sowStatus: Optional[SOWStatus] = None
    contractValue: Optional[float] = None
    currency: Optional[str] = None
    targetKickoffDate: Optional[date] = None
    linkedProposalRef: Optional[str] = None
    scopeOverview: Optional[str] = None

class SOWDetails(SOWDetailsBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# 5. SOW Documents Model
class SOWDocumentBase(MongoBaseModel):
    sowId: str = Field(..., description="Reference to SOW details")
    fileName: str = Field(..., description="Name of the file")
    fileUrl: str = Field(..., description="URL to access the file")
    uploadedBy: str = Field(..., description="User who uploaded the document")

class SOWDocumentCreate(SOWDocumentBase):
    pass

class SOWDocument(SOWDocumentBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)

# Aggregated Opportunity View Model
class OpportunityView(MongoBaseModel):
    """Combined view of Opportunity with all related data"""
    opportunity: Opportunity
    rfpDetails: Optional[RFPDetails] = None
    rfpDocuments: List[RFPDocument] = []
    sowDetails: Optional[SOWDetails] = None
    sowDocuments: List[SOWDocument] = []
