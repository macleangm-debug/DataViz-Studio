#!/usr/bin/env python3
"""
DataViz Studio Backend API Test Suite
Tests all backend functionality including auth, data sources, datasets, dashboards, charts, and AI features.
"""

import requests
import sys
import uuid
import json
import io
import tempfile
import os
from datetime import datetime

class DataVizStudioTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.org_id = None
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        print(f"🚀 Testing DataViz Studio API at: {base_url}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 [{self.tests_run}] Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            # Handle file uploads differently
            if files:
                # Don't set Content-Type for file uploads
                del test_headers['Content-Type']
                response = requests.post(url, files=files, data=data, headers=test_headers)
            elif method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSED - Status: {response.status_code}")
                if response.headers.get('content-type', '').startswith('application/json'):
                    try:
                        return True, response.json()
                    except:
                        return True, {"status": "success", "content": response.text[:200]}
                else:
                    return True, {"status": "success", "content": response.text[:200]}
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:300]
                })
                return False, {}

        except Exception as e:
            print(f"   ❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test_user_{timestamp}@dataviz.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_user
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            if response.get('organization'):
                self.org_id = response['organization']['id']
            print(f"   📋 Registered user: {test_user['email']}")
            print(f"   🔑 Got auth token: {self.token[:20]}...")
            self.test_data['user'] = test_user
            
        return success

    def test_login(self):
        """Test user login"""
        if not hasattr(self, 'test_data') or 'user' not in self.test_data:
            print("   ⚠️  Skipping login test - no registered user")
            return True
            
        login_data = {
            "email": self.test_data['user']['email'],
            "password": self.test_data['user']['password']
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            print(f"   🔑 Login token received")
            
        return success

    def test_file_upload(self):
        """Test CSV file upload"""
        # Create a sample CSV file
        csv_content = """name,age,city,salary
John Doe,25,New York,50000
Jane Smith,30,Los Angeles,60000
Bob Johnson,35,Chicago,55000
Alice Williams,28,Houston,52000
Charlie Brown,32,Phoenix,58000"""
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_data.csv', f, 'text/csv')}
                form_data = {
                    'name': 'Test Dataset',
                    'org_id': self.org_id or ''
                }
                
                success, response = self.run_test(
                    "File Upload (CSV)",
                    "POST",
                    "api/data-sources/upload",
                    200,
                    data=form_data,
                    files=files
                )
                
                if success:
                    self.test_data['uploaded_dataset'] = response
                    print(f"   📊 Uploaded dataset: {response.get('name', 'Unknown')}")
                    print(f"   📈 Rows: {response.get('rows', 0)}, Columns: {len(response.get('columns', []))}")
                
                return success
        finally:
            # Cleanup temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    def test_list_datasets(self):
        """Test listing datasets"""
        org_param = f"?org_id={self.org_id}" if self.org_id else ""
        success, response = self.run_test(
            "List Datasets",
            "GET",
            f"api/datasets{org_param}",
            200
        )
        
        if success:
            datasets = response.get('datasets', [])
            print(f"   📋 Found {len(datasets)} datasets")
            if datasets:
                self.test_data['datasets'] = datasets
                
        return success

    def test_get_dataset_data(self):
        """Test retrieving dataset data"""
        if 'uploaded_dataset' not in self.test_data:
            print("   ⚠️  Skipping dataset data test - no uploaded dataset")
            return True
            
        dataset_id = self.test_data['uploaded_dataset']['dataset_id']
        success, response = self.run_test(
            "Get Dataset Data",
            "GET",
            f"api/datasets/{dataset_id}/data",
            200
        )
        
        if success:
            data = response.get('data', [])
            total = response.get('total', 0)
            print(f"   📊 Retrieved {len(data)} records (total: {total})")
            
        return success

    def test_dataset_statistics(self):
        """Test dataset statistics"""
        if 'uploaded_dataset' not in self.test_data:
            print("   ⚠️  Skipping dataset stats test - no uploaded dataset")
            return True
            
        dataset_id = self.test_data['uploaded_dataset']['dataset_id']
        success, response = self.run_test(
            "Dataset Statistics",
            "GET",
            f"api/datasets/{dataset_id}/stats",
            200
        )
        
        if success:
            stats = response.get('stats', {})
            row_count = response.get('row_count', 0)
            print(f"   📈 Stats for {len(stats)} columns, {row_count} rows")
            
        return success

    def test_create_dashboard(self):
        """Test dashboard creation"""
        dashboard_data = {
            "name": f"Test Dashboard {datetime.now().strftime('%H%M%S')}",
            "description": "Test dashboard created by API test",
            "org_id": self.org_id,
            "widgets": []
        }
        
        success, response = self.run_test(
            "Create Dashboard",
            "POST",
            "api/dashboards",
            200,
            data=dashboard_data
        )
        
        if success:
            self.test_data['dashboard'] = response
            print(f"   📊 Created dashboard: {response.get('name', 'Unknown')}")
            
        return success

    def test_create_chart(self):
        """Test chart creation"""
        if 'uploaded_dataset' not in self.test_data:
            print("   ⚠️  Skipping chart creation test - no uploaded dataset")
            return True
            
        chart_data = {
            "name": f"Test Chart {datetime.now().strftime('%H%M%S')}",
            "type": "bar",
            "dataset_id": self.test_data['uploaded_dataset']['dataset_id'],
            "config": {
                "x_field": "city",
                "y_field": "salary",
                "aggregation": "mean"
            },
            "org_id": self.org_id
        }
        
        success, response = self.run_test(
            "Create Chart",
            "POST",
            "api/charts",
            200,
            data=chart_data
        )
        
        if success:
            self.test_data['chart'] = response
            print(f"   📈 Created chart: {response.get('name', 'Unknown')}")
            
        return success

    def test_database_connections(self):
        """Test database connection creation, test, and sync"""
        # Create database connection
        conn_data = {
            "name": f"Test MongoDB Connection {datetime.now().strftime('%H%M%S')}",
            "db_type": "mongodb",
            "host": "localhost",
            "port": 27017,
            "database": "test_db",
            "username": "test_user",
            "password": "test_pass",
            "org_id": self.org_id
        }
        
        success, response = self.run_test(
            "Create Database Connection",
            "POST",
            "api/database-connections",
            200,
            data=conn_data
        )
        
        if success:
            conn_id = response.get('id')
            self.test_data['db_connection'] = response
            print(f"   🔗 Created connection: {response.get('name', 'Unknown')}")
            
            # Test the connection
            test_success, test_response = self.run_test(
                "Test Database Connection",
                "POST",
                f"api/database-connections/{conn_id}/test",
                200
            )
            
            if test_success:
                status = test_response.get('status', 'unknown')
                print(f"   🧪 Connection test status: {status}")
            
            # Try to sync data (this might fail if database is not available, which is expected)
            sync_success, sync_response = self.run_test(
                "Sync Database Connection",
                "POST",
                f"api/database-connections/{conn_id}/sync",
                200
            )
            
            if sync_success:
                datasets = sync_response.get('datasets', [])
                print(f"   🔄 Sync created {len(datasets)} datasets")
            
            # List database connections
            org_param = f"?org_id={self.org_id}" if self.org_id else ""
            list_success, list_response = self.run_test(
                "List Database Connections",
                "GET",
                f"api/database-connections{org_param}",
                200
            )
            
            if list_success:
                connections = list_response.get('connections', [])
                print(f"   📋 Found {len(connections)} database connections")
            
            return success and test_success and list_success
        
        return success

    def test_widgets(self):
        """Test widget creation, retrieval, and management"""
        if 'dashboard' not in self.test_data:
            print("   ⚠️  Skipping widget tests - no dashboard created")
            return True
            
        dashboard_id = self.test_data['dashboard']['id']
        
        # Create a stat widget
        stat_widget = {
            "dashboard_id": dashboard_id,
            "type": "stat",
            "title": "Total Records",
            "config": {
                "field": "age",
                "aggregation": "count"
            },
            "position": {"x": 0, "y": 0, "w": 4, "h": 3},
            "dataset_id": self.test_data.get('uploaded_dataset', {}).get('dataset_id')
        }
        
        success, response = self.run_test(
            "Create Stat Widget",
            "POST",
            "api/widgets",
            200,
            data=stat_widget
        )
        
        if success:
            stat_widget_id = response.get('id')
            self.test_data['stat_widget'] = response
            print(f"   📊 Created stat widget: {response.get('title', 'Unknown')}")
            
            # Create a chart widget
            chart_widget = {
                "dashboard_id": dashboard_id,
                "type": "chart",
                "title": "Salary by City",
                "config": {
                    "chart_type": "bar",
                    "x_field": "city",
                    "y_field": "salary"
                },
                "position": {"x": 4, "y": 0, "w": 8, "h": 6},
                "dataset_id": self.test_data.get('uploaded_dataset', {}).get('dataset_id')
            }
            
            chart_success, chart_response = self.run_test(
                "Create Chart Widget",
                "POST",
                "api/widgets",
                200,
                data=chart_widget
            )
            
            if chart_success:
                chart_widget_id = chart_response.get('id')
                self.test_data['chart_widget'] = chart_response
                print(f"   📈 Created chart widget: {chart_response.get('title', 'Unknown')}")
                
                # Get dashboard widgets
                widgets_success, widgets_response = self.run_test(
                    "Get Dashboard Widgets",
                    "GET",
                    f"api/dashboards/{dashboard_id}/widgets",
                    200
                )
                
                if widgets_success:
                    widgets = widgets_response.get('widgets', [])
                    print(f"   🎛️  Dashboard has {len(widgets)} widgets")
                
                # Get widget data
                data_success, data_response = self.run_test(
                    "Get Widget Data",
                    "GET",
                    f"api/widgets/{stat_widget_id}/data",
                    200
                )
                
                if data_success:
                    widget_data = data_response.get('data')
                    print(f"   📊 Widget data: {str(widget_data)[:50]}...")
                
                # Update widget
                updated_widget = {
                    "dashboard_id": dashboard_id,
                    "type": "stat",
                    "title": "Updated Total Records",
                    "config": {
                        "field": "age",
                        "aggregation": "mean"
                    },
                    "position": {"x": 0, "y": 0, "w": 4, "h": 3},
                    "dataset_id": self.test_data.get('uploaded_dataset', {}).get('dataset_id')
                }
                
                update_success, update_response = self.run_test(
                    "Update Widget",
                    "PUT",
                    f"api/widgets/{stat_widget_id}",
                    200,
                    data=updated_widget
                )
                
                if update_success:
                    print(f"   ✏️  Updated widget title")
                
                # Delete widget
                delete_success, delete_response = self.run_test(
                    "Delete Widget",
                    "DELETE",
                    f"api/widgets/{chart_widget_id}",
                    200
                )
                
                if delete_success:
                    print(f"   🗑️  Deleted chart widget")
                
                return success and chart_success and widgets_success and data_success and update_success and delete_success
            
            return success and chart_success
        
        return success

    def test_dashboard_layout_update(self):
        """Test dashboard layout update functionality"""
        if 'dashboard' not in self.test_data or 'stat_widget' not in self.test_data:
            print("   ⚠️  Skipping layout update test - no dashboard or widgets")
            return True
            
        dashboard_id = self.test_data['dashboard']['id']
        widget_id = self.test_data['stat_widget']['id']
        
        layout_data = {
            "widgets": [
                {
                    "id": widget_id,
                    "x": 2,
                    "y": 1,
                    "w": 6,
                    "h": 4
                }
            ]
        }
        
        success, response = self.run_test(
            "Update Dashboard Layout",
            "PUT",
            f"api/dashboards/{dashboard_id}/layout",
            200,
            data=layout_data
        )
        
        if success:
            print(f"   📐 Updated dashboard layout")
            
        return success

    def test_ai_query(self):
        """Test AI query functionality"""
        if 'uploaded_dataset' not in self.test_data:
            print("   ⚠️  Skipping AI query test - no uploaded dataset")
            return True
            
        query_data = {
            "query": "Analyze the salary distribution by city in this dataset",
            "dataset_id": self.test_data['uploaded_dataset']['dataset_id']
        }
        
        success, response = self.run_test(
            "AI Query",
            "POST",
            "api/ai/query",
            200,
            data=query_data
        )
        
        if success:
            ai_response = response.get('response', '')
            print(f"   🤖 AI Response length: {len(ai_response)} characters")
            if ai_response:
                print(f"   💬 AI: {ai_response[:100]}...")
                
        return success

    def test_data_source_operations(self):
        """Test data source CRUD operations"""
        # Create data source
        source_data = {
            "name": "Test API Source",
            "type": "api",
            "config": {"url": "https://api.example.com", "auth": "token"},
            "org_id": self.org_id
        }
        
        success, response = self.run_test(
            "Create Data Source",
            "POST",
            "api/data-sources",
            200,
            data=source_data
        )
        
        if success:
            source_id = response.get('id')
            
            # List data sources
            org_param = f"?org_id={self.org_id}" if self.org_id else ""
            list_success, list_response = self.run_test(
                "List Data Sources",
                "GET",
                f"api/data-sources{org_param}",
                200
            )
            
            if list_success:
                sources = list_response.get('sources', [])
                print(f"   📋 Found {len(sources)} data sources")
            
            return success and list_success
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🧪 DATAVIZ STUDIO API TEST SUITE")
        print("=" * 60)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_register),
            ("User Login", self.test_login),
            ("File Upload (CSV)", self.test_file_upload),
            ("List Datasets", self.test_list_datasets),
            ("Dataset Data Retrieval", self.test_get_dataset_data),
            ("Dataset Statistics", self.test_dataset_statistics),
            ("Dashboard Creation", self.test_create_dashboard),
            ("Database Connections", self.test_database_connections),
            ("Widget Management", self.test_widgets),
            ("Dashboard Layout Update", self.test_dashboard_layout_update),
            ("Chart Creation", self.test_create_chart),
            ("Data Source Operations", self.test_data_source_operations),
            ("AI Query", self.test_ai_query)
        ]
        
        for test_name, test_func in tests:
            print(f"\n{'=' * 50}")
            print(f"🔧 Running: {test_name}")
            print(f"{'=' * 50}")
            
            try:
                test_func()
            except Exception as e:
                print(f"   💥 EXCEPTION in {test_name}: {str(e)}")
                self.failed_tests.append({
                    "test": test_name,
                    "error": f"Exception: {str(e)}"
                })
        
        # Print final results
        self.print_results()
        
        return self.tests_passed == self.tests_run

    def print_results(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n🔍 FAILED TESTS:")
            for i, failed in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {failed['test']}")
                if 'endpoint' in failed:
                    print(f"   Endpoint: {failed['endpoint']}")
                if 'expected' in failed and 'actual' in failed:
                    print(f"   Expected: {failed['expected']}, Got: {failed['actual']}")
                if 'response' in failed:
                    print(f"   Response: {failed['response']}")
                if 'error' in failed:
                    print(f"   Error: {failed['error']}")
        
        print("\n" + "=" * 60)
        
        if success_rate >= 80:
            print("🎉 Overall Status: GOOD")
        elif success_rate >= 60:
            print("⚠️  Overall Status: NEEDS ATTENTION")
        else:
            print("🚨 Overall Status: CRITICAL ISSUES")


def main():
    """Main test runner"""
    tester = DataVizStudioTester()
    success = tester.run_all_tests()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())