# MongoDB Collections for Opportunity Module

## Overview
This document describes the MongoDB collections created for the Opportunity module to support the complete Opportunity lifecycle with Details, RFP Details, and SOW Details tabs.

## Collections Created

### 1. opportunities Collection
Stores core Opportunity data from the Details tab.

**Fields:**
- `_id` (ObjectId) - Auto-generated primary key
- `opportunityId` (String) - Auto-generated readable ID (e.g., "OPP-001")
- `opportunityName` (String) - Name of the opportunity
- `clientId` (String) - Reference to Clients collection
- `clientName` (String) - Client name for display
- `leadSource` (String) - Source of the lead
- `closeDate` (Date) - Expected close date
- `type` (String) - New Business / Existing Business / Renewal
- `amount` (Number) - Opportunity amount
- `currency` (String) - Currency code (USD, EUR, etc.)
- `value` (Number) - Opportunity value (same as amount)
- `internalRecommendation` (String) - Internal recommendation/triage status
- `pipelineStatus` (String) - Pipeline status controlling tab visibility
- `winProbability` (Number) - Win probability percentage
- `nextSteps` (String) - Next steps for the opportunity
- `status` (String) - Active / Closed status
- `createdBy` (String) - User who created the opportunity
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `opportunityId` (unique)
- `clientId`
- `pipelineStatus`
- `status`
- `createdAt`

### 2. rfpDetails Collection
Stores RFP-related data linked to Opportunity.

**Fields:**
- `_id` (ObjectId) - Auto-generated primary key
- `opportunityId` (String) - Reference to opportunities collection
- `rfpTitle` (String) - RFP title
- `rfpStatus` (String) - Won / Lost / In Progress
- `submissionDeadline` (DateTime) - RFP submission deadline
- `bidManager` (String) - Assigned bid manager
- `submissionMode` (String) - Portal / Email / Manual
- `portalUrl` (String) - Portal URL for submission
- `qaLogs` (Array) - Array of Q&A entries with questions, answers, timestamps
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `opportunityId` (unique)
- `rfpStatus`
- `submissionDeadline`

### 3. rfpDocuments Collection
Stores RFP and proposal documents.

**Fields:**
- `_id` (ObjectId) - Auto-generated primary key
- `opportunityId` (String) - Reference to opportunities collection
- `documentType` (String) - RFP / Proposal / Presentation / Commercial / Other
- `fileName` (String) - Original filename
- `fileUrl` (String) - URL or path to stored file
- `uploadedBy` (String) - User who uploaded the document
- `uploadedAt` (DateTime) - Upload timestamp

**Indexes:**
- `opportunityId`
- `documentType`
- `uploadedAt`

### 4. sowDetails Collection
Stores SOW information after conversion from Opportunity.

**Fields:**
- `_id` (ObjectId) - Auto-generated primary key
- `opportunityId` (String) - Reference to opportunities collection
- `sowTitle` (String) - SOW title
- `sowStatus` (String) - Draft / Signed
- `contractValue` (Number) - Contract value
- `currency` (String) - Currency code
- `value` (Number) - SOW value
- `targetKickoffDate` (Date) - Target kickoff date
- `linkedProposalRef` (String) - Reference to linked proposal
- `scopeOverview` (String) - Scope overview/description
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `opportunityId` (unique)
- `sowStatus`
- `targetKickoffDate`

### 5. sowDocuments Collection
Stores signed SOW and agreement files.

**Fields:**
- `_id` (ObjectId) - Auto-generated primary key
- `sowId` (String) - Reference to sowDetails collection
- `fileName` (String) - Original filename
- `fileUrl` (String) - URL or path to stored file
- `uploadedAt` (DateTime) - Upload timestamp

**Indexes:**
- `sowId`
- `uploadedAt`

## Relationships

```
opportunities (1) ──── (1) rfpDetails
     │                     │
     │                     └─── (N) rfpDocuments
     │
     └─── (1) sowDetails
               │
               └─── (N) sowDocuments
```

## Pipeline Status Flow

The `pipelineStatus` field in the opportunities collection controls the Opportunity lifecycle:

1. **Prospecting** (10% win probability) - Only Details tab available
2. **Qualified** (25% win probability) - Details + RFP tabs available
3. **Needs Analysis** (40% win probability) - Details + RFP tabs available
4. **Proposal** (60% win probability) - Details + RFP tabs available
5. **Negotiation** (80% win probability) - Details + RFP tabs available
6. **Converted to SOW** (100% win probability) - All tabs available, auto-creates SOW details
7. **Closed Won** (100% win probability) - Final status
8. **Closed Lost** (0% win probability) - Final status

## Automation Workflows

### 1. SOW Creation
When `pipelineStatus` is set to "Converted to SOW":
- Automatically creates entry in `sowDetails` collection
- Copies relevant data from opportunity

### 2. Project Creation
When `sowStatus` is set to "Signed":
- Automatically creates project in delivery module
- Passes client, opportunity, contract value, and kickoff date

### 3. Action Item Creation
When opportunity status is "Completed":
- Creates follow-up action item
- Links to original opportunity

## API Endpoints

### Opportunity Management
- `GET /opportunities` - List all opportunities
- `GET /opportunities/{id}` - Get opportunity with all related data
- `POST /opportunities` - Create new opportunity
- `PUT /opportunities/{id}` - Update opportunity
- `DELETE /opportunities/{id}` - Delete opportunity and related data

### RFP Management
- `GET /opportunities/{id}/rfp-details` - Get RFP details
- `POST /opportunities/{id}/rfp-details` - Create RFP details
- `PUT /opportunities/{id}/rfp-details` - Update RFP details
- `GET /opportunities/{id}/rfp-documents` - List RFP documents
- `POST /opportunities/{id}/rfp-documents` - Upload RFP document
- `DELETE /opportunities/{id}/rfp-documents/{doc_id}` - Delete RFP document

### SOW Management
- `GET /opportunities/{id}/sow-details` - Get SOW details
- `POST /opportunities/{id}/sow-details` - Create SOW details
- `PUT /opportunities/{id}/sow-details` - Update SOW details
- `GET /opportunities/{id}/sow-documents` - List SOW documents
- `POST /opportunities/{id}/sow-documents` - Upload SOW document
- `DELETE /opportunities/{id}/sow-documents/{doc_id}` - Delete SOW document

## Setup Instructions

1. Run the setup script to create collections:
```bash
cd backend
python setup_opportunity_db.py
```

2. This will:
   - Create all 5 collections
   - Set up proper indexes
   - Insert sample data for testing

3. Update the main server to include the new router:
```python
from routers.opportunities_mongo import router as opportunities_mongo_router
app.include_router(opportunities_mongo_router)
```

## Sample Data Structure

The setup script creates sample data including:
- Opportunity "OPP-001" for Acme Corporation
- RFP details with Q&A logs
- RFP documents (RFP file and proposal)
- SOW details in draft status
- SOW document (signed SOW)

This structure supports the complete Opportunity lifecycle from initial creation through RFP process to SOW conversion and project creation.
