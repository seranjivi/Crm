"""
MongoDB Collections Setup for Opportunity Module
Creates collections with proper indexes and relationships
"""

async def setup_opportunity_collections(db):
    """Create all Opportunity-related collections with indexes"""
    
    # 1. opportunities Collection
    await db.create_collection("opportunities")
    await db.opportunities.create_index("opportunityId", unique=True)
    await db.opportunities.create_index("clientId")
    await db.opportunities.create_index("pipelineStatus")
    await db.opportunities.create_index("status")
    await db.opportunities.create_index("createdAt")
    
    # 2. rfpDetails Collection
    await db.create_collection("rfpDetails")
    await db.rfpDetails.create_index("opportunityId", unique=True)
    await db.rfpDetails.create_index("rfpStatus")
    await db.rfpDetails.create_index("submissionDeadline")
    
    # 3. rfpDocuments Collection
    await db.create_collection("rfpDocuments")
    await db.rfpDocuments.create_index("opportunityId")
    await db.rfpDocuments.create_index("documentType")
    await db.rfpDocuments.create_index("uploadedAt")
    
    # 4. sowDetails Collection
    await db.create_collection("sowDetails")
    await db.sowDetails.create_index("opportunityId", unique=True)
    await db.sowDetails.create_index("sowStatus")
    await db.sowDetails.create_index("targetKickoffDate")
    
    # 5. sowDocuments Collection
    await db.create_collection("sowDocuments")
    await db.sowDocuments.create_index("sowId")
    await db.sowDocuments.create_index("uploadedAt")

# Sample document structures for reference
OPPORTUNITY_SAMPLE = {
    "opportunityId": "OPP-001",
    "opportunityName": "Enterprise Software Implementation",
    "clientId": "client_123",
    "clientName": "Acme Corporation",
    "leadSource": "Partner",
    "closeDate": "2024-03-31",
    "type": "New Business",
    "amount": 250000,
    "currency": "USD",
    "value": 250000,
    "internalRecommendation": "Triaged - High Priority",
    "pipelineStatus": "Proposal",
    "winProbability": 60,
    "nextSteps": "Submit technical proposal by March 15",
    "status": "Active",
    "createdBy": "user_123",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-20T14:30:00Z"
}

RFP_DETAILS_SAMPLE = {
    "opportunityId": "OPP-001",
    "rfpTitle": "Q1 2024 Enterprise Software RFP",
    "rfpStatus": "In Progress",
    "submissionDeadline": "2024-03-15T23:59:59Z",
    "bidManager": "John Smith",
    "submissionMode": "Portal",
    "portalUrl": "https://procurement.acme.com/rfp/123",
    "qaLogs": [
        {
            "question": "What is your SLA guarantee?",
            "answer": "99.9% uptime guarantee",
            "askedBy": "Acme Corp",
            "askedAt": "2024-02-01T10:00:00Z",
            "answeredBy": "John Smith",
            "answeredAt": "2024-02-02T15:30:00Z"
        }
    ],
    "createdAt": "2024-02-01T09:00:00Z",
    "updatedAt": "2024-02-02T15:30:00Z"
}

SOW_DETAILS_SAMPLE = {
    "opportunityId": "OPP-001",
    "sowTitle": "Acme Corp - Software Implementation SOW v1.0",
    "sowStatus": "Draft",
    "contractValue": 250000,
    "currency": "USD",
    "value": 250000,
    "targetKickoffDate": "2024-04-01T09:00:00Z",
    "linkedProposalRef": "PROP-2024-001",
    "scopeOverview": "Implementation of enterprise software across 3 departments",
    "createdAt": "2024-03-01T10:00:00Z",
    "updatedAt": "2024-03-05T16:00:00Z"
}
