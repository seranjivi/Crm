"""
Test script for Opportunity Collections API
Run this to verify all endpoints are working correctly
"""
import asyncio
import sys
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/opportunity-collections"

def test_endpoint(method, endpoint, data=None, params=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{API_PREFIX}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params)
        elif method == "POST":
            response = requests.post(url, json=data)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
            
        print(f"{'✅' if response.status_code < 400 else '❌'} {method} {endpoint} - Status: {response.status_code}")
        
        if response.status_code < 400:
            try:
                result = response.json()
                if isinstance(result, list):
                    print(f"   Returned {len(result)} items")
                elif isinstance(result, dict):
                    print(f"   Response keys: {list(result.keys())}")
                return True
            except:
                print(f"   Response: {response.text[:100]}...")
                return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {method} {endpoint} - Exception: {str(e)}")
        return False

async def main():
    """Main test function"""
    print("🧪 Testing Opportunity Collections API...")
    print("=" * 50)
    
    # Test collection management endpoints
    print("\n📋 Collection Management Tests:")
    test_endpoint("POST", "/init")
    test_endpoint("GET", "/validate")
    
    # Test opportunities endpoints
    print("\n💼 Opportunities Collection Tests:")
    
    # Create a test opportunity
    test_opportunity = {
        "opportunity_name": "Test Opportunity - API Test",
        "client_name": "Test Client Corp",
        "type": "New Business",
        "amount": 100000.0,
        "currency": "USD",
        "pipeline_status": "Prospecting",
        "win_probability": 25,
        "status": "Active"
    }
    
    success = test_endpoint("POST", "/opportunities", test_opportunity)
    
    # Get opportunities
    test_endpoint("GET", "/opportunities")
    
    # Test RFP details endpoints
    print("\n📄 RFP Details Collection Tests:")
    
    if success:
        # Create RFP details (assuming OPP-001 was created)
        rfp_details = {
            "opportunity_id": "OPP-001",
            "rfp_title": "Test RFP",
            "rfp_status": "Pending",
            "submission_deadline": "2025-02-15T00:00:00Z",
            "bid_manager": "John Doe"
        }
        test_endpoint("POST", "/rfp-details", rfp_details)
    
    test_endpoint("GET", "/rfp-details")
    test_endpoint("GET", "/rfp-details", params={"opportunity_id": "OPP-001"})
    
    # Test RFP documents endpoints
    print("\n📎 RFP Documents Collection Tests:")
    
    if success:
        # Create RFP document
        rfp_doc = {
            "opportunity_id": "OPP-001",
            "document_type": "RFP",
            "file_name": "test_rfp.pdf",
            "file_url": "http://example.com/test_rfp.pdf",
            "uploaded_by": "test_user"
        }
        test_endpoint("POST", "/rfp-documents", rfp_doc)
    
    test_endpoint("GET", "/rfp-documents")
    test_endpoint("GET", "/rfp-documents", params={"opportunity_id": "OPP-001"})
    
    # Test SOW details endpoints
    print("\n📋 SOW Details Collection Tests:")
    
    if success:
        # Create SOW details
        sow_details = {
            "opportunity_id": "OPP-001",
            "sow_title": "Test SOW",
            "sow_status": "Draft",
            "contract_value": 95000.0,
            "currency": "USD",
            "target_kickoff_date": "2025-03-01T00:00:00Z"
        }
        test_endpoint("POST", "/sow-details", sow_details)
    
    test_endpoint("GET", "/sow-details")
    test_endpoint("GET", "/sow-details", params={"opportunity_id": "OPP-001"})
    
    # Test SOW documents endpoints
    print("\n📎 SOW Documents Collection Tests:")
    
    # Create SOW document (would need actual sow_id from previous step)
    sow_doc = {
        "sow_id": "test_sow_id",
        "file_name": "test_sow.pdf",
        "file_url": "http://example.com/test_sow.pdf"
    }
    test_endpoint("POST", "/sow-documents", sow_doc)
    
    test_endpoint("GET", "/sow-documents")
    test_endpoint("GET", "/sow-documents", params={"sow_id": "test_sow_id"})
    
    # Test complete opportunity endpoint
    print("\n🔍 Complete Opportunity Data Test:")
    test_endpoint("GET", "/opportunity/OPP-001/complete")
    
    print("\n" + "=" * 50)
    print("🎉 API Testing Complete!")
    print("\nNote: Some tests may fail if authentication is required.")
    print("For authenticated testing, add Authorization header to requests.")

if __name__ == "__main__":
    asyncio.run(main())
