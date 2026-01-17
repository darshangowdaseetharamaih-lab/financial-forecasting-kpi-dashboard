#!/usr/bin/env python3
"""
Financial Forecasting Dashboard - Backend API Tests
==================================================
Comprehensive testing of all backend endpoints for the Financial Forecasting & KPI Dashboard.
"""

import requests
import sys
import json
from datetime import datetime

class FinancialDashboardTester:
    def __init__(self, base_url="https://data-to-decision.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.sample_run_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if data:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
                else:
                    response = requests.post(url, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Try to parse JSON response
                try:
                    json_response = response.json()
                    if isinstance(json_response, dict):
                        print(f"   Response keys: {list(json_response.keys())}")
                    elif isinstance(json_response, list):
                        print(f"   Response: List with {len(json_response)} items")
                    return True, json_response
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (30s)")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root Info",
            "GET",
            "",
            200
        )
        return success

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success

    def test_kpi_definitions(self):
        """Test KPI definitions endpoint"""
        success, response = self.run_test(
            "KPI Definitions",
            "GET",
            "kpi-definitions",
            200
        )
        if success and isinstance(response, dict):
            print(f"   KPI definitions available: {len(response)} definitions")
        return success

    def test_load_sample_data(self):
        """Test loading sample data"""
        success, response = self.run_test(
            "Load Sample Data",
            "POST",
            "sample-data",
            200
        )
        if success and isinstance(response, dict):
            self.sample_run_id = response.get('run_id')
            print(f"   Sample run ID: {self.sample_run_id}")
            print(f"   Run name: {response.get('name')}")
        return success

    def test_list_runs(self):
        """Test listing analysis runs"""
        success, response = self.run_test(
            "List Analysis Runs",
            "GET",
            "runs",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} analysis runs")
            if response:
                print(f"   Latest run: {response[0].get('name', 'Unknown')}")
        return success

    def test_get_run_details(self):
        """Test getting specific run details"""
        if not self.sample_run_id:
            print("❌ Skipped - No sample run ID available")
            return False
            
        success, response = self.run_test(
            "Get Run Details",
            "GET",
            f"runs/{self.sample_run_id}",
            200
        )
        if success and isinstance(response, dict):
            print(f"   Periods: {len(response.get('periods', []))}")
            print(f"   KPIs: {len(response.get('kpis', []))}")
            print(f"   Variances: {len(response.get('variances', []))}")
            print(f"   Forecasts: {len(response.get('forecasts', {}))}")
        return success

    def test_get_kpis(self):
        """Test getting KPIs for a run"""
        if not self.sample_run_id:
            print("❌ Skipped - No sample run ID available")
            return False
            
        success, response = self.run_test(
            "Get Run KPIs",
            "GET",
            f"runs/{self.sample_run_id}/kpis",
            200
        )
        if success and isinstance(response, list):
            print(f"   KPI periods: {len(response)}")
            if response:
                latest_kpi = response[-1]
                print(f"   Latest period: {latest_kpi.get('period')}")
                print(f"   Revenue: ${latest_kpi.get('revenue', 0):,.0f}")
                print(f"   Gross Margin: {latest_kpi.get('gross_margin', 0):.1f}%")
        return success

    def test_get_variances(self):
        """Test getting variance analysis for a run"""
        if not self.sample_run_id:
            print("❌ Skipped - No sample run ID available")
            return False
            
        success, response = self.run_test(
            "Get Variance Analysis",
            "GET",
            f"runs/{self.sample_run_id}/variances",
            200
        )
        if success and isinstance(response, list):
            print(f"   Variance metrics: {len(response)}")
            if response:
                favorable = sum(1 for v in response if v.get('status') == 'Favorable')
                print(f"   Favorable variances: {favorable}/{len(response)}")
        return success

    def test_get_forecasts(self):
        """Test getting forecast scenarios for a run"""
        if not self.sample_run_id:
            print("❌ Skipped - No sample run ID available")
            return False
            
        success, response = self.run_test(
            "Get Forecast Scenarios",
            "GET",
            f"runs/{self.sample_run_id}/forecasts",
            200
        )
        if success and isinstance(response, dict):
            scenarios = list(response.keys())
            print(f"   Available scenarios: {scenarios}")
            if 'base' in response:
                base_periods = len(response['base'].get('periods', []))
                print(f"   Base scenario periods: {base_periods}")
        return success

    def test_generate_narrative(self):
        """Test AI narrative generation"""
        if not self.sample_run_id:
            print("❌ Skipped - No sample run ID available")
            return False
            
        narrative_data = {
            "run_id": self.sample_run_id,
            "focus": "executive_summary"
        }
        
        success, response = self.run_test(
            "Generate AI Narrative",
            "POST",
            f"runs/{self.sample_run_id}/narrative",
            200,
            data=narrative_data
        )
        if success and isinstance(response, dict):
            print(f"   Narrative ID: {response.get('narrative_id')}")
            print(f"   Summary length: {len(response.get('summary', ''))}")
            print(f"   Key insights: {len(response.get('key_insights', []))}")
            print(f"   Recommendations: {len(response.get('recommendations', []))}")
        return success

    def test_get_narratives(self):
        """Test getting all narratives for a run"""
        if not self.sample_run_id:
            print("❌ Skipped - No sample run ID available")
            return False
            
        success, response = self.run_test(
            "Get Run Narratives",
            "GET",
            f"runs/{self.sample_run_id}/narratives",
            200
        )
        if success and isinstance(response, list):
            print(f"   Total narratives: {len(response)}")
        return success

def main():
    """Run all tests"""
    print("=" * 70)
    print("Financial Forecasting Dashboard - Backend API Tests")
    print("=" * 70)
    
    tester = FinancialDashboardTester()
    
    # Test sequence
    tests = [
        ("API Root", tester.test_api_root),
        ("Health Check", tester.test_health_check),
        ("KPI Definitions", tester.test_kpi_definitions),
        ("Load Sample Data", tester.test_load_sample_data),
        ("List Runs", tester.test_list_runs),
        ("Get Run Details", tester.test_get_run_details),
        ("Get KPIs", tester.test_get_kpis),
        ("Get Variances", tester.test_get_variances),
        ("Get Forecasts", tester.test_get_forecasts),
        ("Generate AI Narrative", tester.test_generate_narrative),
        ("Get Narratives", tester.test_get_narratives),
    ]
    
    print(f"\nRunning {len(tests)} tests...\n")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())