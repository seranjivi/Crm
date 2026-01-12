# Opportunity Module MongoDB Collections

This document describes the MongoDB collections created for the Opportunity module to support the complete Opportunity lifecycle and relationships.

## Collections Overview

The Opportunity module is organized into 5 main collections that support the Details, RFP Details, and SOW Details tabs in the UI:

1. **opportunities** - Core opportunity data
2. **rfp_details** - RFP-related information
3. **rfp_documents** - RFP and proposal documents
4. **sow_details** - SOW information after conversion
5. **sow_documents** - Signed SOW and agreement files

## Collection Schemas

### 1. opportunities Collection

Stores core Opportunity (Details tab) information.

**Fields:**
- `_id` (ObjectId) - Auto-generated MongoDB ID
- `opportunity_id` (string) - Auto-generated readable ID (e.g., OPP-001)
- `opportunity_name` (string) - Opportunity name
- `client_id` (string, optional) - Reference to Clients collection
- `client_name` (string) - Client name
- `lead_source` (string, optional) - Lead source
- `close_date` (datetime, optional) - Expected close date
- `type` (string) - New Business / Existing Business
- `amount` (float) - Opportunity amount
- `currency` (string) - Currency code (default: USD)
- `value` (float, optional) - Opportunity value
- `internal_recommendation` (string, optional) - Triaged status
- `pipeline_status` (string) - Pipeline status
- `win_probability` (int) - Win probability percentage
- `next_steps` (string, optional) - Next steps
- `status` (string) - Active / Closed
- `created_by` (string) - User who created the opportunity
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**Indexes:**
- Unique index on `opportunity_id`
- Indexes on `client_id`, `client_name`, `pipeline_status`, `status`, `created_by`, `created_at`, `updated_at`

### 2. rfp_details Collection

Stores RFP-related data linked to Opportunity.

**Fields:**
- `_id` (ObjectId) - Auto-generated MongoDB ID
- `opportunity_id` (string) - Reference to opportunities collection
- `rfp_title` (string, optional) - RFP title
- `rfp_status` (string, optional) - Won / Lost
- `submission_deadline` (datetime, optional) - Submission deadline
- `bid_manager` (string, optional) - Bid manager name
- `submission_mode` (string, optional) - Email / Portal / Manual
- `portal_url` (string, optional) - Portal URL
- `qa_logs` (array) - Array of Q&A entries
  - `question` (string) - Question text
  - `answer` (string, optional) - Answer text
  - `asked_by` (string, optional) - Who asked
  - `asked_date` (datetime, optional) - When asked
  - `answered_by` (string, optional) - Who answered
  - `answered_date` (datetime, optional) - When answered
  - `status` (string) - Pending / Answered
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**Indexes:**
- Indexes on `opportunity_id`, `rfp_status`, `submission_deadline`, `bid_manager`, `created_at`, `updated_at`

### 3. rfp_documents Collection

Stores RFP and proposal documents.

**Fields:**
- `_id` (ObjectId) - Auto-generated MongoDB ID
- `opportunity_id` (string) - Reference to opportunities collection
- `document_type` (string) - RFP / Proposal / Presentation / Commercial / Other
- `file_name` (string) - Original file name
- `file_url` (string) - URL to stored file
- `uploaded_by` (string) - User who uploaded
- `uploaded_at` (datetime) - Upload timestamp

**Indexes:**
- Indexes on `opportunity_id`, `document_type`, `uploaded_by`, `uploaded_at`

### 4. sow_details Collection

Stores SOW information after conversion.

**Fields:**
- `_id` (ObjectId) - Auto-generated MongoDB ID
- `opportunity_id` (string) - Reference to opportunities collection
- `sow_title` (string, optional) - SOW title
- `sow_status` (string, optional) - Draft / Signed
- `contract_value` (float, optional) - Contract value
- `currency` (string) - Currency code (default: USD)
- `value` (float, optional) - SOW value
- `target_kickoff_date` (datetime, optional) - Target kickoff date
- `linked_proposal_ref` (string, optional) - Reference to linked proposal
- `scope_overview` (string, optional) - Scope overview
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**Indexes:**
- Indexes on `opportunity_id`, `sow_status`, `target_kickoff_date`, `linked_proposal_ref`, `created_at`, `updated_at`

### 5. sow_documents Collection

Stores signed SOW and agreement files.

**Fields:**
- `_id` (ObjectId) - Auto-generated MongoDB ID
- `sow_id` (string) - Reference to sow_details collection
- `file_name` (string) - Original file name
- `file_url` (string) - URL to stored file
- `uploaded_at` (datetime) - Upload timestamp

**Indexes:**
- Indexes on `sow_id`, `uploaded_at`

## API Endpoints

The collections are accessible via the `/api/opportunity-collections` endpoints:

### Collection Management
- `POST /api/opportunity-collections/init` - Initialize all collections and indexes
- `GET /api/opportunity-collections/validate` - Validate collections exist

### Opportunities Collection
- `GET /api/opportunity-collections/opportunities` - Get opportunities (with filtering)
- `POST /api/opportunity-collections/opportunities` - Create new opportunity

### RFP Details Collection
- `GET /api/opportunity-collections/rfp-details` - Get RFP details
- `POST /api/opportunity-collections/rfp-details` - Create RFP details

### RFP Documents Collection
- `GET /api/opportunity-collections/rfp-documents` - Get RFP documents
- `POST /api/opportunity-collections/rfp-documents` - Upload RFP document

### SOW Details Collection
- `GET /api/opportunity-collections/sow-details` - Get SOW details
- `POST /api/opportunity-collections/sow-details` - Create SOW details

### SOW Documents Collection
- `GET /api/opportunity-collections/sow-documents` - Get SOW documents
- `POST /api/opportunity-collections/sow-documents` - Upload SOW document

### Complete Opportunity Data
- `GET /api/opportunity-collections/opportunity/{opportunity_id}/complete` - Get complete opportunity data with all related collections

## Setup Instructions

### 1. Initialize Collections

Run the setup script to create all collections and indexes:

```bash
cd backend
python scripts/setup_opportunity_collections.py
```

Or use the API endpoint:

```bash
curl -X POST http://localhost:8000/api/opportunity-collections/init \
  -H "Authorization: Bearer <your_token>"
```

### 2. Validate Collections

Check that all collections exist:

```bash
curl -X GET http://localhost:8000/api/opportunity-collections/validate \
  -H "Authorization: Bearer <your_token>"
```

## Data Relationships

The collections are designed with the following relationships:

1. **opportunities** is the main collection
2. **rfp_details** links to opportunities via `opportunity_id`
3. **rfp_documents** links to opportunities via `opportunity_id`
4. **sow_details** links to opportunities via `opportunity_id`
5. **sow_documents** links to sow_details via `sow_id`

This design allows for:
- Efficient queries on opportunity-specific data
- Proper separation of concerns
- Scalable document storage
- Easy data retrieval for UI components

## Usage Examples

### Create a New Opportunity

```python
import requests

opportunity_data = {
    "opportunity_name": "New Deal with ABC Corp",
    "client_name": "ABC Corporation",
    "type": "New Business",
    "amount": 150000.0,
    "currency": "USD",
    "pipeline_status": "Prospecting",
    "win_probability": 25
}

response = requests.post(
    "http://localhost:8000/api/opportunity-collections/opportunities",
    json=opportunity_data,
    headers={"Authorization": "Bearer <token>"}
)
```

### Get Complete Opportunity Data

```python
response = requests.get(
    "http://localhost:8000/api/opportunity-collections/opportunity/OPP-001/complete",
    headers={"Authorization": "Bearer <token>"}
)

data = response.json()
# Returns: opportunity, rfp_details, rfp_documents, sow_details, sow_documents
```

## File Structure

```
backend/
├── models/
│   └── opportunity_collections.py      # Pydantic models for collections
├── utils/
│   └── opportunity_collections_setup.py # Collection setup utilities
├── routers/
│   └── opportunity_collections.py      # API endpoints
├── scripts/
│   └── setup_opportunity_collections.py # Standalone setup script
└── OPPORTUNITY_COLLECTIONS_README.md   # This documentation
```

## Notes

- All collections include proper indexes for performance
- Opportunity IDs are auto-generated in OPP-XXX format
- Timestamps are automatically managed
- The design supports the complete Opportunity lifecycle
- Collections are optimized for the UI tab structure (Details, RFP Details, SOW Details)
