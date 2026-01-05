#!/usr/bin/env python3
"""
Comprehensive Backend Test Suite for Sightspectrum CRM
Tests Action Items, Sales Activities, Forecasts, and Dashboard modules
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, date
from typing import Dict, Any, Optional

# Configuration
# BASE_URL = "https://sightsales.preview.emergentagent.com/api"
# BASE_URL = "http://localhost:8000/api"
BASE_URL = "https://sales-9se8.onrender.com/api"
TEST_USER = {
    "email": "admin@sightspectrum.com",
    "password": "admin123"
}

class CRMTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.headers = {}
        self.test_results = {
            "action_items": {"passed": 0, "failed": 0, "errors": []},
            "sales_activities": {"passed": 0, "failed": 0, "errors": []},
            "forecasts": {"passed": 0, "failed": 0, "errors": []},
            "dashboard": {"passed": 0, "failed": 0, "errors": []},
            "overall": {"passed": 0, "failed": 0}
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, module: str, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        if success:
            self.test_results[module]["passed"] += 1
            print(f"✅ {module.upper()}: {test_name}")
        else:
            self.test_results[module]["failed"] += 1
            self.test_results[module]["errors"].append(f"{test_name}: {message}")
            print(f"❌ {module.upper()}: {test_name} - {message}")
    
    async def authenticate(self) -> bool:
        """Authenticate and get access token"""
        try:
            async with self.session.post(
                f"{BASE_URL}/auth/login",
                json=TEST_USER,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data["access_token"]
                    self.headers = {
                        "Authorization": f"Bearer {self.auth_token}",
                        "Content-Type": "application/json"
                    }
                    print("✅ Authentication successful")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Authentication failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    async def test_action_items(self):
        """Test Action Items module"""
        print("\n🔍 Testing Action Items Module...")
        
        # Test GET all action items
        try:
            async with self.session.get(f"{BASE_URL}/action-items", headers=self.headers) as response:
                if response.status == 200:
                    action_items = await response.json()
                    
                    # Verify we have 5 items
                    if len(action_items) == 5:
                        self.log_result("action_items", "GET all action items (count=5)", True)
                    else:
                        self.log_result("action_items", "GET all action items (count=5)", False, 
                                      f"Expected 5 items, got {len(action_items)}")
                    
                    # Verify Task IDs are present
                    expected_task_ids = ["SAL0001", "SAL0000", "SAL0003", "SAL0004", "SAL0005"]
                    found_task_ids = [item.get("task_id") for item in action_items]
                    
                    missing_ids = set(expected_task_ids) - set(found_task_ids)
                    if not missing_ids:
                        self.log_result("action_items", "Verify Task IDs present", True)
                    else:
                        self.log_result("action_items", "Verify Task IDs present", False,
                                      f"Missing Task IDs: {missing_ids}")
                    
                    # Verify status values
                    expected_statuses = ["In Progress", "Not Started", "Overdue", "Completed"]
                    found_statuses = set(item.get("status") for item in action_items)
                    
                    if found_statuses.intersection(expected_statuses):
                        self.log_result("action_items", "Verify status values", True)
                    else:
                        self.log_result("action_items", "Verify status values", False,
                                      f"Expected statuses not found. Found: {found_statuses}")
                    
                    # Verify priority levels
                    expected_priorities = ["High", "Medium", "Low"]
                    found_priorities = set(item.get("priority") for item in action_items)
                    
                    if found_priorities.intersection(expected_priorities):
                        self.log_result("action_items", "Verify priority levels", True)
                    else:
                        self.log_result("action_items", "Verify priority levels", False,
                                      f"Expected priorities not found. Found: {found_priorities}")
                    
                else:
                    error_text = await response.text()
                    self.log_result("action_items", "GET all action items", False, 
                                  f"Status {response.status}: {error_text}")
        except Exception as e:
            self.log_result("action_items", "GET all action items", False, str(e))
        
        # Test CREATE action item
        new_action_item = {
            "task_id": "SAL9999",
            "task_title": "Test Action Item",
            "priority": "High",
            "status": "Not Started",
            "notes": "This is a test action item"
        }
        
        try:
            async with self.session.post(f"{BASE_URL}/action-items", 
                                       json=new_action_item, headers=self.headers) as response:
                if response.status == 201:
                    created_item = await response.json()
                    self.created_action_item_id = created_item.get("id")
                    self.log_result("action_items", "CREATE new action item", True)
                else:
                    error_text = await response.text()
                    self.log_result("action_items", "CREATE new action item", False,
                                  f"Status {response.status}: {error_text}")
        except Exception as e:
            self.log_result("action_items", "CREATE new action item", False, str(e))
        
        # Test UPDATE action item
        if hasattr(self, 'created_action_item_id'):
            update_data = {"status": "In Progress", "notes": "Updated test item"}
            try:
                async with self.session.put(f"{BASE_URL}/action-items/{self.created_action_item_id}",
                                          json=update_data, headers=self.headers) as response:
                    if response.status == 200:
                        self.log_result("action_items", "UPDATE action item", True)
                    else:
                        error_text = await response.text()
                        self.log_result("action_items", "UPDATE action item", False,
                                      f"Status {response.status}: {error_text}")
            except Exception as e:
                self.log_result("action_items", "UPDATE action item", False, str(e))
        
        # Test DELETE action item
        if hasattr(self, 'created_action_item_id'):
            try:
                async with self.session.delete(f"{BASE_URL}/action-items/{self.created_action_item_id}",
                                             headers=self.headers) as response:
                    if response.status == 204:
                        self.log_result("action_items", "DELETE action item", True)
                    else:
                        error_text = await response.text()
                        self.log_result("action_items", "DELETE action item", False,
                                      f"Status {response.status}: {error_text}")
            except Exception as e:
                self.log_result("action_items", "DELETE action item", False, str(e))
    
    async def test_sales_activities(self):
        """Test Sales Activities module"""
        print("\n🔍 Testing Sales Activities Module...")
        
        # Test GET all sales activities
        try:
            async with self.session.get(f"{BASE_URL}/sales-activities", headers=self.headers) as response:
                if response.status == 200:
                    activities = await response.json()
                    
                    # Verify we have 5 items
                    if len(activities) == 5:
                        self.log_result("sales_activities", "GET all sales activities (count=5)", True)
                    else:
                        self.log_result("sales_activities", "GET all sales activities (count=5)", False,
                                      f"Expected 5 items, got {len(activities)}")
                    
                    # Verify activity types
                    expected_types = ["Call", "Meeting", "Email"]
                    found_types = set(activity.get("activity_type") for activity in activities)
                    
                    if found_types.intersection(expected_types):
                        self.log_result("sales_activities", "Verify activity types", True)
                    else:
                        self.log_result("sales_activities", "Verify activity types", False,
                                      f"Expected types not found. Found: {found_types}")
                    
                    # Verify required fields
                    required_fields = ["task_id", "activity_owner", "activity_date", "summary", "outcome"]
                    all_have_required = True
                    missing_fields = []
                    
                    for activity in activities:
                        for field in required_fields:
                            if field not in activity or activity[field] is None:
                                all_have_required = False
                                missing_fields.append(f"{field} in activity {activity.get('id', 'unknown')}")
                    
                    if all_have_required:
                        self.log_result("sales_activities", "Verify required fields", True)
                    else:
                        self.log_result("sales_activities", "Verify required fields", False,
                                      f"Missing fields: {missing_fields}")
                    
                else:
                    error_text = await response.text()
                    self.log_result("sales_activities", "GET all sales activities", False,
                                  f"Status {response.status}: {error_text}")
        except Exception as e:
            self.log_result("sales_activities", "GET all sales activities", False, str(e))
        
        # Test CREATE sales activity
        new_activity = {
            "task_id": "SAL9999",
            "activity_type": "Call",
            "activity_owner": "test@sightspectrum.com",
            "activity_date": datetime.now().isoformat(),
            "summary": "Test activity",
            "outcome": "Test outcome"
        }
        
        try:
            async with self.session.post(f"{BASE_URL}/sales-activities",
                                       json=new_activity, headers=self.headers) as response:
                if response.status == 201:
                    created_activity = await response.json()
                    self.created_activity_id = created_activity.get("id")
                    self.log_result("sales_activities", "CREATE new sales activity", True)
                else:
                    error_text = await response.text()
                    self.log_result("sales_activities", "CREATE new sales activity", False,
                                  f"Status {response.status}: {error_text}")
        except Exception as e:
            self.log_result("sales_activities", "CREATE new sales activity", False, str(e))
        
        # Test UPDATE sales activity
        if hasattr(self, 'created_activity_id'):
            update_data = {"outcome": "Updated test outcome", "next_step": "Follow up next week"}
            try:
                async with self.session.put(f"{BASE_URL}/sales-activities/{self.created_activity_id}",
                                          json=update_data, headers=self.headers) as response:
                    if response.status == 200:
                        self.log_result("sales_activities", "UPDATE sales activity", True)
                    else:
                        error_text = await response.text()
                        self.log_result("sales_activities", "UPDATE sales activity", False,
                                      f"Status {response.status}: {error_text}")
            except Exception as e:
                self.log_result("sales_activities", "UPDATE sales activity", False, str(e))
        
        # Test DELETE sales activity
        if hasattr(self, 'created_activity_id'):
            try:
                async with self.session.delete(f"{BASE_URL}/sales-activities/{self.created_activity_id}",
                                             headers=self.headers) as response:
                    if response.status == 204:
                        self.log_result("sales_activities", "DELETE sales activity", True)
                    else:
                        error_text = await response.text()
                        self.log_result("sales_activities", "DELETE sales activity", False,
                                      f"Status {response.status}: {error_text}")
            except Exception as e:
                self.log_result("sales_activities", "DELETE sales activity", False, str(e))
    
    async def test_forecasts(self):
        """Test Forecasts module"""
        print("\n🔍 Testing Forecasts Module...")
        
        # Test GET all forecasts
        try:
            async with self.session.get(f"{BASE_URL}/forecasts", headers=self.headers) as response:
                if response.status == 200:
                    forecasts = await response.json()
                    
                    # Verify we have 5 items
                    if len(forecasts) == 5:
                        self.log_result("forecasts", "GET all forecasts (count=5)", True)
                    else:
                        self.log_result("forecasts", "GET all forecasts (count=5)", False,
                                      f"Expected 5 items, got {len(forecasts)}")
                    
                    # Verify financial calculations
                    calculation_correct = True
                    calculation_errors = []
                    
                    for forecast in forecasts:
                        deal_value = forecast.get("deal_value", 0)
                        probability = forecast.get("probability_percent", 0)
                        forecast_amount = forecast.get("forecast_amount", 0)
                        expected_amount = round((deal_value * probability) / 100, 2)
                        
                        if abs(forecast_amount - expected_amount) > 0.01:  # Allow small rounding differences
                            calculation_correct = False
                            calculation_errors.append(
                                f"Forecast {forecast.get('id')}: Expected {expected_amount}, got {forecast_amount}"
                            )
                    
                    if calculation_correct:
                        self.log_result("forecasts", "Verify financial calculations", True)
                    else:
                        self.log_result("forecasts", "Verify financial calculations", False,
                                      f"Calculation errors: {calculation_errors}")
                    
                    # Verify total forecast amount matches $1,327,500
                    total_forecast = sum(f.get("forecast_amount", 0) for f in forecasts)
                    expected_total = 1327500
                    
                    if abs(total_forecast - expected_total) < 1:  # Allow small rounding differences
                        self.log_result("forecasts", "Verify total forecast amount ($1,327,500)", True)
                    else:
                        self.log_result("forecasts", "Verify total forecast amount ($1,327,500)", False,
                                      f"Expected ${expected_total:,.0f}, got ${total_forecast:,.0f}")
                    
                else:
                    error_text = await response.text()
                    self.log_result("forecasts", "GET all forecasts", False,
                                  f"Status {response.status}: {error_text}")
        except Exception as e:
            self.log_result("forecasts", "GET all forecasts", False, str(e))
        
        # Test CREATE forecast
        new_forecast = {
            "task_id": "SAL9999",
            "opportunity_name": "Test Opportunity",
            "deal_value": 100000,
            "probability_percent": 50,
            "salesperson": "test@sightspectrum.com",
            "stage": "Proposal"
        }
        
        try:
            async with self.session.post(f"{BASE_URL}/forecasts",
                                       json=new_forecast, headers=self.headers) as response:
                if response.status == 201:
                    created_forecast = await response.json()
                    self.created_forecast_id = created_forecast.get("id")
                    
                    # Verify auto-calculation
                    expected_amount = (100000 * 50) / 100
                    actual_amount = created_forecast.get("forecast_amount", 0)
                    
                    if abs(actual_amount - expected_amount) < 0.01:
                        self.log_result("forecasts", "CREATE new forecast (with auto-calculation)", True)
                    else:
                        self.log_result("forecasts", "CREATE new forecast (with auto-calculation)", False,
                                      f"Auto-calculation failed: Expected {expected_amount}, got {actual_amount}")
                else:
                    error_text = await response.text()
                    self.log_result("forecasts", "CREATE new forecast", False,
                                  f"Status {response.status}: {error_text}")
        except Exception as e:
            self.log_result("forecasts", "CREATE new forecast", False, str(e))
        
        # Test UPDATE forecast
        if hasattr(self, 'created_forecast_id'):
            update_data = {"probability_percent": 75, "stage": "Negotiation"}
            try:
                async with self.session.put(f"{BASE_URL}/forecasts/{self.created_forecast_id}",
                                          json=update_data, headers=self.headers) as response:
                    if response.status == 200:
                        updated_forecast = await response.json()
                        
                        # Verify recalculation
                        expected_amount = (100000 * 75) / 100
                        actual_amount = updated_forecast.get("forecast_amount", 0)
                        
                        if abs(actual_amount - expected_amount) < 0.01:
                            self.log_result("forecasts", "UPDATE forecast (with recalculation)", True)
                        else:
                            self.log_result("forecasts", "UPDATE forecast (with recalculation)", False,
                                          f"Recalculation failed: Expected {expected_amount}, got {actual_amount}")
                    else:
                        error_text = await response.text()
                        self.log_result("forecasts", "UPDATE forecast", False,
                                      f"Status {response.status}: {error_text}")
            except Exception as e:
                self.log_result("forecasts", "UPDATE forecast", False, str(e))
        
        # Test DELETE forecast
        if hasattr(self, 'created_forecast_id'):
            try:
                async with self.session.delete(f"{BASE_URL}/forecasts/{self.created_forecast_id}",
                                             headers=self.headers) as response:
                    if response.status == 204:
                        self.log_result("forecasts", "DELETE forecast", True)
                    else:
                        error_text = await response.text()
                        self.log_result("forecasts", "DELETE forecast", False,
                                      f"Status {response.status}: {error_text}")
            except Exception as e:
                self.log_result("forecasts", "DELETE forecast", False, str(e))
    
    async def test_dashboard(self):
        """Test Dashboard Analytics API"""
        print("\n🔍 Testing Dashboard Analytics...")
        
        try:
            async with self.session.get(f"{BASE_URL}/dashboard/analytics", headers=self.headers) as response:
                if response.status == 200:
                    dashboard_data = await response.json()
                    
                    # Verify new sections exist
                    required_sections = ["action_items", "sales_activities", "forecasts", "partners"]
                    missing_sections = []
                    
                    for section in required_sections:
                        if section not in dashboard_data:
                            missing_sections.append(section)
                    
                    if not missing_sections:
                        self.log_result("dashboard", "Verify new sections exist", True)
                    else:
                        self.log_result("dashboard", "Verify new sections exist", False,
                                      f"Missing sections: {missing_sections}")
                    
                    # Verify action_items metrics
                    if "action_items" in dashboard_data:
                        action_items_data = dashboard_data["action_items"]
                        required_metrics = ["total", "pending", "completed", "overdue"]
                        missing_metrics = [m for m in required_metrics if m not in action_items_data]
                        
                        if not missing_metrics:
                            self.log_result("dashboard", "Verify action_items metrics", True)
                        else:
                            self.log_result("dashboard", "Verify action_items metrics", False,
                                          f"Missing metrics: {missing_metrics}")
                    
                    # Verify sales_activities metrics
                    if "sales_activities" in dashboard_data:
                        sales_data = dashboard_data["sales_activities"]
                        required_metrics = ["total", "by_type"]
                        missing_metrics = [m for m in required_metrics if m not in sales_data]
                        
                        if not missing_metrics:
                            self.log_result("dashboard", "Verify sales_activities metrics", True)
                        else:
                            self.log_result("dashboard", "Verify sales_activities metrics", False,
                                          f"Missing metrics: {missing_metrics}")
                    
                    # Verify forecasts metrics
                    if "forecasts" in dashboard_data:
                        forecasts_data = dashboard_data["forecasts"]
                        required_metrics = ["total_forecast_amount", "total_deal_value", "avg_win_probability"]
                        missing_metrics = [m for m in required_metrics if m not in forecasts_data]
                        
                        if not missing_metrics:
                            self.log_result("dashboard", "Verify forecasts metrics", True)
                        else:
                            self.log_result("dashboard", "Verify forecasts metrics", False,
                                          f"Missing metrics: {missing_metrics}")
                        
                        # Verify calculated values match seed data (approximately)
                        total_forecast = forecasts_data.get("total_forecast_amount", 0)
                        expected_total = 1327500
                        
                        if abs(total_forecast - expected_total) < 1000:  # Allow some variance
                            self.log_result("dashboard", "Verify calculated forecast values", True)
                        else:
                            self.log_result("dashboard", "Verify calculated forecast values", False,
                                          f"Expected ~${expected_total:,.0f}, got ${total_forecast:,.0f}")
                    
                else:
                    error_text = await response.text()
                    self.log_result("dashboard", "GET dashboard analytics", False,
                                  f"Status {response.status}: {error_text}")
        except Exception as e:
            self.log_result("dashboard", "GET dashboard analytics", False, str(e))
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🎯 TEST SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for module, results in self.test_results.items():
            if module == "overall":
                continue
                
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{module.upper():20} {status:8} ({passed} passed, {failed} failed)")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"  ❌ {error}")
        
        print("-" * 60)
        overall_status = "✅ ALL TESTS PASSED" if total_failed == 0 else f"❌ {total_failed} TESTS FAILED"
        print(f"OVERALL RESULT: {overall_status} ({total_passed} passed, {total_failed} failed)")
        print("="*60)
        
        # Update overall results
        self.test_results["overall"]["passed"] = total_passed
        self.test_results["overall"]["failed"] = total_failed
        
        return total_failed == 0

async def main():
    """Main test runner"""
    print("🚀 Starting Sightspectrum CRM Backend Tests")
    print(f"🌐 Testing against: {BASE_URL}")
    print(f"👤 Using credentials: {TEST_USER['email']}")
    
    async with CRMTester() as tester:
        # Authenticate first
        if not await tester.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Run all tests
        await tester.test_action_items()
        await tester.test_sales_activities()
        await tester.test_forecasts()
        await tester.test_dashboard()
        
        # Print summary
        success = tester.print_summary()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
