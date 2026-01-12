"""
MongoDB Schema Models for Opportunity Module
Pydantic models for data validation and API responses
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Union
from datetime import datetime, date
from bson import ObjectId

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

# Q&A Log Entry Model
class QALogEntry(BaseModel):
    question: str
    answer: Optional[str] = None
    askedBy: Optional[str] = None
    askedAt: Optional[datetime] = None
    answeredBy: Optional[str] = None
    answeredAt: Optional[datetime] = None

# 1. Opportunity Model (Details Tab)
class OpportunityBase(MongoBaseModel):
    opportunityId: Optional[str] = None
    opportunityName: str
    clientId: Optional[str] = None
    clientName: str
    leadSource: Optional[str] = None
    closeDate: Optional[Union[date, str]] = None
    type: str = "New Business"  # New Business, Existing Business
    amount: Optional[float] = 0
    currency: str = "USD"
    value: Optional[float] = 0
    internalRecommendation: Optional[str] = None
    pipelineStatus: str = "Prospecting"
    winProbability: int = 10
    nextSteps: Optional[str] = None
    status: str = "Active"
    createdBy: Optional[str] = None

    @field_validator('closeDate', mode='before')
    @classmethod
    def parse_close_date(cls, v):
        if not v or v == '':
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            if len(v) == 10:
                return datetime.strptime(v, '%Y-%m-%d').date()
        return v

class OpportunityCreate(OpportunityBase):
    createdAt: Optional[datetime] = None

class OpportunityUpdate(BaseModel):
    opportunityName: Optional[str] = None
    clientId: Optional[str] = None
    clientName: Optional[str] = None
    leadSource: Optional[str] = None
    closeDate: Optional[date] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    value: Optional[float] = None
    internalRecommendation: Optional[str] = None
    pipelineStatus: Optional[str] = None
    winProbability: Optional[int] = None
    nextSteps: Optional[str] = None
    status: Optional[str] = None

class Opportunity(OpportunityBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    createdAt: datetime
    updatedAt: datetime

# 2. RFP Details Model
class RFPDetailsBase(MongoBaseModel):
    opportunityId: str
    rfpTitle: Optional[str] = None
    rfpStatus: Optional[str] = None  # Won, Lost, In Progress
    submissionDeadline: Optional[Union[datetime, str]] = None
    bidManager: Optional[str] = None
    submissionMode: Optional[str] = None  # Portal, Email, Manual
    portalUrl: Optional[str] = None
    qaLogs: Optional[List[QALogEntry]] = []

    @field_validator('submissionDeadline', mode='before')
    @classmethod
    def parse_submission_deadline(cls, v):
        if not v or v == '':
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            if 'T' in v:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v

class RFPDetailsCreate(RFPDetailsBase):
    createdAt: Optional[datetime] = None

class RFPDetailsUpdate(BaseModel):
    rfpTitle: Optional[str] = None
    rfpStatus: Optional[str] = None
    submissionDeadline: Optional[datetime] = None
    bidManager: Optional[str] = None
    submissionMode: Optional[str] = None
    portalUrl: Optional[str] = None
    qaLogs: Optional[List[QALogEntry]] = None

class RFPDetails(RFPDetailsBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    createdAt: datetime
    updatedAt: datetime

# 3. RFP Documents Model
class RFPDocumentBase(MongoBaseModel):
    opportunityId: str
    documentType: str  # RFP, Proposal, Presentation, Commercial, Other
    fileName: str
    fileUrl: str
    uploadedBy: Optional[str] = None
    uploadedAt: Optional[datetime] = None

class RFPDocumentCreate(RFPDocumentBase):
    pass

class RFPDocument(RFPDocumentBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

# 4. SOW Details Model
class SOWDetailsBase(MongoBaseModel):
    opportunityId: str
    sowTitle: Optional[str] = None
    sowStatus: Optional[str] = None  # Draft, Signed
    contractValue: Optional[float] = 0
    currency: str = "USD"
    value: Optional[float] = 0
    targetKickoffDate: Optional[Union[date, str]] = None
    linkedProposalRef: Optional[str] = None
    scopeOverview: Optional[str] = None

    @field_validator('targetKickoffDate', mode='before')
    @classmethod
    def parse_target_kickoff_date(cls, v):
        if not v or v == '':
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            if len(v) == 10:
                return datetime.strptime(v, '%Y-%m-%d').date()
        return v

class SOWDetailsCreate(SOWDetailsBase):
    createdAt: Optional[datetime] = None

class SOWDetailsUpdate(BaseModel):
    sowTitle: Optional[str] = None
    sowStatus: Optional[str] = None
    contractValue: Optional[float] = None
    currency: Optional[str] = None
    value: Optional[float] = None
    targetKickoffDate: Optional[date] = None
    linkedProposalRef: Optional[str] = None
    scopeOverview: Optional[str] = None

class SOWDetails(SOWDetailsBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    createdAt: datetime
    updatedAt: datetime

# 5. SOW Documents Model
class SOWDocumentBase(MongoBaseModel):
    sowId: str
    fileName: str
    fileUrl: str
    uploadedAt: Optional[datetime] = None

class SOWDocumentCreate(SOWDocumentBase):
    pass

class SOWDocument(SOWDocumentBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

# Aggregated Opportunity View Model
class OpportunityView(MongoBaseModel):
    """Combined view of Opportunity with all related data"""
    opportunity: Opportunity
    rfpDetails: Optional[RFPDetails] = None
    rfpDocuments: Optional[List[RFPDocument]] = []
    sowDetails: Optional[SOWDetails] = None
    sowDocuments: Optional[List[SOWDocument]] = []
