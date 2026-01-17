import requests
import sys
import json
from datetime import datetime

class DataAnalyticsAPITester:
    def __init__(self, base_url="https://data-to-decision.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: Non-JSON or empty")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'endpoint': endpoint
                })

            return success, response.json() if success and response.content else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.failed_tests.append({
                'name': name,
                'error': 'Timeout',
                'endpoint': endpoint
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e),
                'endpoint': endpoint
            })
            return False, {}

    def test_health_endpoints(self):
        """Test basic health and root endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_metrics_endpoints(self):
        """Test metrics CRUD operations"""
        print("\n" + "="*50)
        print("TESTING METRICS ENDPOINTS")
        print("="*50)
        
        # Get all metrics
        success, metrics = self.run_test("Get All Metrics", "GET", "metrics", 200)
        
        # Get metrics by category
        self.run_test("Get Revenue Metrics", "GET", "metrics?category=revenue", 200)
        self.run_test("Get Customer Metrics", "GET", "metrics?category=customer", 200)
        
        # Create a new metric
        test_metric = {
            "name": "Test Metric",
            "value": 1000,
            "category": "test",
            "trend": 5.5,
            "period": "monthly",
            "date": "2024-12"
        }
        success, created_metric = self.run_test("Create Metric", "POST", "metrics", 201, test_metric)
        
        # Delete the test metric if created
        if success and created_metric.get('id'):
            self.run_test("Delete Test Metric", "DELETE", f"metrics/{created_metric['id']}", 200)

    def test_timeseries_endpoints(self):
        """Test time series data endpoints"""
        print("\n" + "="*50)
        print("TESTING TIMESERIES ENDPOINTS")
        print("="*50)
        
        self.run_test("Get Timeseries Data", "GET", "timeseries", 200)
        self.run_test("Seed Timeseries Data", "POST", "timeseries/seed", 200)

    def test_customer_segments_endpoints(self):
        """Test customer segments endpoints"""
        print("\n" + "="*50)
        print("TESTING CUSTOMER SEGMENTS ENDPOINTS")
        print("="*50)
        
        self.run_test("Get Customer Segments", "GET", "customer-segments", 200)

    def test_business_framing_endpoints(self):
        """Test business framing CRUD operations"""
        print("\n" + "="*50)
        print("TESTING BUSINESS FRAMING ENDPOINTS")
        print("="*50)
        
        # Get all business framing
        self.run_test("Get Business Framing", "GET", "business-framing", 200)
        
        # Create business framing
        test_framing = {
            "stakeholder": "Test CFO",
            "business_question": "How to improve test metrics?",
            "decision_impact": "Test budget allocation",
            "data_sources": ["Test data", "Sample metrics"],
            "success_criteria": "10% improvement in test KPIs"
        }
        success, created_framing = self.run_test("Create Business Framing", "POST", "business-framing", 201, test_framing)
        
        # Delete the test framing if created
        if success and created_framing.get('id'):
            self.run_test("Delete Test Business Framing", "DELETE", f"business-framing/{created_framing['id']}", 200)

    def test_insights_endpoints(self):
        """Test AI insights endpoints (UI functionality only)"""
        print("\n" + "="*50)
        print("TESTING AI INSIGHTS ENDPOINTS")
        print("="*50)
        
        # Get insights history
        self.run_test("Get Insights History", "GET", "insights/history", 200)
        
        # Test insights generation (this will test the endpoint but may fail due to AI integration)
        test_insight_request = {
            "context": "Test context for analytics",
            "metrics_summary": {
                "Total Revenue": {"value": 2450000, "trend": 12.5, "category": "revenue"},
                "Net Income": {"value": 555000, "trend": 15.7, "category": "revenue"}
            },
            "question": "What are the key insights from this test data?"
        }
        
        print("\n🔍 Testing AI Insights Generation...")
        print("   Note: This may take longer due to AI processing")
        success, insight = self.run_test("Generate AI Insights", "POST", "insights/generate", 200, test_insight_request, timeout=60)
        
        if not success:
            print("   ⚠️  AI Insights generation failed - this may be due to API key or network issues")

    def test_export_endpoints(self):
        """Test PDF export functionality"""
        print("\n" + "="*50)
        print("TESTING EXPORT ENDPOINTS")
        print("="*50)
        
        # Test PDF export
        export_data = {
            "businessFraming": {
                "stakeholder": "Test CFO",
                "business_question": "Test question",
                "decision_impact": "Test impact"
            },
            "metrics": [
                {"name": "Test Revenue", "value": 1000000, "trend": 5.0},
                {"name": "Test Profit", "value": 200000, "trend": 3.2}
            ],
            "insights": {
                "executive_summary": "Test executive summary for PDF export",
                "key_findings": ["Test finding 1", "Test finding 2"],
                "recommendations": ["Test recommendation 1", "Test recommendation 2"]
            }
        }
        
        print("\n🔍 Testing PDF Export...")
        try:
            url = f"{self.api_url}/export/pdf"
            response = requests.post(url, json=export_data, headers={'Content-Type': 'application/json'}, timeout=30)
            
            if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                print("✅ Passed - PDF Export successful")
                print(f"   PDF size: {len(response.content)} bytes")
                self.tests_passed += 1
            else:
                print(f"❌ Failed - Expected PDF, got status {response.status_code}")
                self.failed_tests.append({
                    'name': 'PDF Export',
                    'expected': 'PDF response',
                    'actual': f'Status {response.status_code}',
                    'endpoint': 'export/pdf'
                })
            self.tests_run += 1
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': 'PDF Export',
                'error': str(e),
                'endpoint': 'export/pdf'
            })
            self.tests_run += 1

    def test_dataset_endpoints(self):
        """Test dataset management endpoints"""
        print("\n" + "="*50)
        print("TESTING DATASET ENDPOINTS")
        print("="*50)
        
        # Get all datasets
        self.run_test("Get All Datasets", "GET", "datasets", 200)
        
        # Upload a test dataset
        test_dataset = {
            "name": "Test Dataset",
            "description": "Test dataset for API testing",
            "data": [
                {"metric": "test_revenue", "value": 100000},
                {"metric": "test_profit", "value": 20000}
            ]
        }
        success, uploaded = self.run_test("Upload Dataset", "POST", "datasets/upload", 200, test_dataset)
        
        # Get specific dataset if upload succeeded
        if success and uploaded.get('id'):
            self.run_test("Get Specific Dataset", "GET", f"datasets/{uploaded['id']}", 200)

    def test_seed_data_endpoint(self):
        """Test seed data functionality"""
        print("\n" + "="*50)
        print("TESTING SEED DATA ENDPOINT")
        print("="*50)
        
        self.run_test("Seed All Sample Data", "POST", "seed-data", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Data Analytics API Tests")
        print(f"Testing against: {self.base_url}")
        
        # Run all test suites
        self.test_health_endpoints()
        self.test_seed_data_endpoint()  # Seed data first to ensure we have test data
        self.test_metrics_endpoints()
        self.test_timeseries_endpoints()
        self.test_customer_segments_endpoints()
        self.test_business_framing_endpoints()
        self.test_dataset_endpoints()
        self.test_export_endpoints()
        self.test_insights_endpoints()  # Test AI insights last as it may be slower
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"✅ Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed tests ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                print(f"   • {test['name']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DataAnalyticsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())