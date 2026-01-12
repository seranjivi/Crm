"""
Database Setup Script for Opportunity Module
Run this script to create all collections and indexes
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from setup_opportunity_collections import setup_opportunity_collections

async def setup_database():
    """Setup MongoDB collections for Opportunity module"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.sales_application
    
    try:
        print("Setting up Opportunity collections...")
        
        # Create collections and indexes
        await setup_opportunity_collections(db)
        
        print("✅ Collections created successfully!")
        
        # Insert sample data for testing
        await insert_sample_data(db)
        
        print("✅ Sample data inserted successfully!")
        print("\n📊 Collections created:")
        print("  - opportunities (core opportunity data)")
        print("  - rfpDetails (RFP-related information)")
        print("  - rfpDocuments (RFP and proposal documents)")
        print("  - sowDetails (SOW information)")
        print("  - sowDocuments (signed SOW documents)")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
    finally:
        client.close()

async def insert_sample_data(db):
    """Insert sample data for testing"""
    
    # Sample opportunity
    opportunity = {
        "opportunityId": "OPP-001",
        "opportunityName": "Enterprise Software Implementation",
        "clientId": "client_001",
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
        "createdBy": "john.doe@company.com",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T14:30:00Z"
    }
    
    await db.opportunities.insert_one(opportunity)
    
    # Sample RFP details
    rfp_details = {
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
            },
            {
                "question": "What is your implementation timeline?",
                "answer": "12-16 weeks depending on scope",
                "askedBy": "Acme Corp",
                "askedAt": "2024-02-03T09:15:00Z",
                "answeredBy": "John Smith",
                "answeredAt": "2024-02-04T11:20:00Z"
            }
        ],
        "createdAt": "2024-02-01T09:00:00Z",
        "updatedAt": "2024-02-04T11:20:00Z"
    }
    
    await db.rfpDetails.insert_one(rfp_details)
    
    # Sample RFP documents
    rfp_documents = [
        {
            "opportunityId": "OPP-001",
            "documentType": "RFP",
            "fileName": "Acme_RFP_Document.pdf",
            "fileUrl": "/uploads/rfp/OPP-001/Acme_RFP_Document.pdf",
            "uploadedBy": "john.smith@company.com",
            "uploadedAt": "2024-02-01T10:30:00Z"
        },
        {
            "opportunityId": "OPP-001",
            "documentType": "Proposal",
            "fileName": "Technical_Proposal_v1.pdf",
            "fileUrl": "/uploads/proposals/OPP-001/Technical_Proposal_v1.pdf",
            "uploadedBy": "john.smith@company.com",
            "uploadedAt": "2024-02-10T14:20:00Z"
        }
    ]
    
    for doc in rfp_documents:
        await db.rfpDocuments.insert_one(doc)
    
    # Sample SOW details
    sow_details = {
        "opportunityId": "OPP-001",
        "sowTitle": "Acme Corp - Software Implementation SOW v1.0",
        "sowStatus": "Draft",
        "contractValue": 250000,
        "currency": "USD",
        "value": 250000,
        "targetKickoffDate": "2024-04-01",
        "linkedProposalRef": "PROP-2024-001",
        "scopeOverview": "Implementation of enterprise software across 3 departments including training and support",
        "createdAt": "2024-03-01T10:00:00Z",
        "updatedAt": "2024-03-05T16:00:00Z"
    }
    
    await db.sowDetails.insert_one(sow_details)
    
    # Get SOW ID for documents
    sow = await db.sowDetails.find_one({"opportunityId": "OPP-001"})
    
    # Sample SOW documents
    sow_documents = [
        {
            "sowId": str(sow["_id"]),
            "fileName": "Signed_SOW_Acme_Corp.pdf",
            "fileUrl": "/uploads/sow/OPP-001/Signed_SOW_Acme_Corp.pdf",
            "uploadedAt": "2024-03-10T13:45:00Z"
        }
    ]
    
    for doc in sow_documents:
        await db.sowDocuments.insert_one(doc)

if __name__ == "__main__":
    asyncio.run(setup_database())
