from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Union
from datetime import datetime, date

class AttachmentMetadata(BaseModel):
    id: str
    name: str
    originalName: str
    storedName: str
    size: int
    type: str
    path: str
    url: str
    uploadedAt: str

class QAClarification(BaseModel):
    id: str
    question: str
    answer: Optional[str] = None
    asked_by: Optional[str] = None
    asked_date: Optional[datetime] = None
    answered_by: Optional[str] = None
    answered_date: Optional[datetime] = None
    status: str = "Pending"  # Pending, Answered

class OpportunityBase(BaseModel):
    # Details Tab Fields
    client_name: str  # Customer/Account
    opportunity_name: str
    lead_source: Optional[str] = None
    close_date: Optional[Union[datetime, date, str]] = None
    type: Optional[str] = "New Business"  # New Business, Existing, Renewal
    amount: Optional[float] = 0
    currency_code: str = "USD"
    internal_recommendation: Optional[str] = None
    pipeline_status: str = "Prospecting"  # Pipeline Status controlling tabs
    win_probability: int = 10  # Win Probability % based on pipeline status
    next_steps: Optional[str] = None
    
    # Legacy Fields (for backward compatibility)
    task_id: Optional[str] = None  # Shared Task ID from Lead (SAL0001)
    deal_value: Optional[float] = 0  # Alias for estimated_value
    probability_percent: Optional[int] = 0  # Probability %
    win_loss_reason: Optional[str] = None  # Win/Loss Reason
    last_interaction: Optional[Union[datetime, date, str]] = None  # Last Interaction date
    next_action: Optional[str] = None  # Next Action
    partner_org: Optional[str] = None  # Partner Organization
    partner_org_contact: Optional[str] = None  # Partner Organization Contact
    
    @field_validator('last_interaction', mode='before')
    @classmethod
    def parse_last_interaction(cls, v):
        if not v or v == '':
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            if 'T' not in v and len(v) == 10:
                return datetime.strptime(v, '%Y-%m-%d')
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v
    
    # RFP Details Tab Fields
    rfp_title: Optional[str] = None
    rfp_status: Optional[str] = None  # Won, Lost
    submission_deadline: Optional[Union[datetime, date, str]] = None
    bid_manager: Optional[str] = None
    submission_mode: Optional[str] = None  # Email, Portal, Manual
    portal_url: Optional[str] = None
    rfp_document: Optional[AttachmentMetadata] = None
    proposal_document: Optional[AttachmentMetadata] = None
    presentation_document: Optional[AttachmentMetadata] = None
    commercial_document: Optional[AttachmentMetadata] = None
    other_documents: Optional[List[AttachmentMetadata]] = []
    qa_clarifications: Optional[List[QAClarification]] = []
    
    # SOW Details Tab Fields
    sow_title: Optional[str] = None
    sow_release_version: Optional[str] = None
    sow_status: Optional[str] = None  # Draft, Review, Signed
    contract_value: Optional[float] = None
    target_kickoff_date: Optional[Union[datetime, date, str]] = None
    linked_proposal_reference: Optional[str] = None
    signed_document_assets: Optional[List[AttachmentMetadata]] = []
    
    # Existing Fields (KEEP ALL)
    industry: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    solution: Optional[str] = None
    estimated_value: Optional[float] = 0
    currency: str = "USD"
    probability: Optional[int] = 0
    stage: str = "Prospecting"  # Prospecting, Needs Analysis, Proposal, Negotiation, Closed
    expected_closure_date: Optional[Union[date, str]] = None
    
    @field_validator('expected_closure_date', mode='before')
    @classmethod
    def parse_expected_closure_date(cls, v):
        if not v or v == '':
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            if len(v) == 10:
                return datetime.strptime(v, '%Y-%m-%d').date()
        return v
    sales_owner: Optional[str] = None  # Assigned Salesperson
    technical_poc: Optional[str] = None
    presales_poc: Optional[str] = None
    key_stakeholders: Optional[str] = None
    competitors: Optional[str] = None
    next_steps: Optional[str] = None
    risks: Optional[str] = None
    status: str = "Active"  # Active, Completed, Lost
    attachments: Optional[List[AttachmentMetadata]] = []

class OpportunityCreate(OpportunityBase):
    created_at: Optional[Union[datetime, date, str]] = None  # Allow custom creation date
    
    @field_validator('created_at', mode='before')
    @classmethod
    def parse_created_at(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            # Handle date string "2025-12-25"
            if 'T' not in v and len(v) == 10:
                return datetime.strptime(v, '%Y-%m-%d')
            # Handle datetime string
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v

class OpportunityUpdate(BaseModel):
    # Details Tab Fields
    client_name: Optional[str] = None
    opportunity_name: Optional[str] = None
    lead_source: Optional[str] = None
    close_date: Optional[Union[datetime, date, str]] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    currency_code: Optional[str] = None
    internal_recommendation: Optional[str] = None
    pipeline_status: Optional[str] = None
    win_probability: Optional[int] = None
    next_steps: Optional[str] = None
    
    # Legacy Fields (for backward compatibility)
    created_at: Optional[Union[datetime, date, str]] = None  # Allow updating creation date
    
    @field_validator('created_at', mode='before')
    @classmethod
    def parse_created_at(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            # Handle date string "2025-12-25"
            if 'T' not in v and len(v) == 10:
                return datetime.strptime(v, '%Y-%m-%d')
            # Handle datetime string
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v
    deal_value: Optional[float] = None
    probability_percent: Optional[int] = None
    win_loss_reason: Optional[str] = None
    last_interaction: Optional[Union[datetime, date, str]] = None
    next_action: Optional[str] = None
    partner_org: Optional[str] = None
    partner_org_contact: Optional[str] = None
    
    # RFP Details Tab Fields
    rfp_title: Optional[str] = None
    rfp_status: Optional[str] = None
    submission_deadline: Optional[Union[datetime, date, str]] = None
    bid_manager: Optional[str] = None
    submission_mode: Optional[str] = None
    portal_url: Optional[str] = None
    rfp_document: Optional[AttachmentMetadata] = None
    proposal_document: Optional[AttachmentMetadata] = None
    presentation_document: Optional[AttachmentMetadata] = None
    commercial_document: Optional[AttachmentMetadata] = None
    other_documents: Optional[List[AttachmentMetadata]] = None
    qa_clarifications: Optional[List[QAClarification]] = None
    
    # SOW Details Tab Fields
    sow_title: Optional[str] = None
    sow_release_version: Optional[str] = None
    sow_status: Optional[str] = None
    contract_value: Optional[float] = None
    target_kickoff_date: Optional[Union[datetime, date, str]] = None
    linked_proposal_reference: Optional[str] = None
    signed_document_assets: Optional[List[AttachmentMetadata]] = None
    
    # Existing Fields
    industry: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    solution: Optional[str] = None
    estimated_value: Optional[float] = None
    currency: Optional[str] = None
    probability: Optional[int] = None
    stage: Optional[str] = None
    expected_closure_date: Optional[date] = None
    sales_owner: Optional[str] = None
    technical_poc: Optional[str] = None
    presales_poc: Optional[str] = None
    key_stakeholders: Optional[str] = None
    competitors: Optional[str] = None
    next_steps: Optional[str] = None
    risks: Optional[str] = None
    status: Optional[str] = None

class Opportunity(OpportunityBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    task_id: str  # Required - shared from Lead
    linked_lead_id: Optional[str] = None
    linked_sow_id: Optional[str] = None
    attachments: List[AttachmentMetadata] = []
    created_at: datetime
    updated_at: datetime