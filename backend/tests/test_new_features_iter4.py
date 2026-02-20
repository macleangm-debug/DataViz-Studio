"""
Test Suite for DataViz Studio - New Features (Iteration 4)
Features tested:
1. Database Connections (PostgreSQL, MySQL, MongoDB)
2. Scheduled Data Refresh (hourly, daily, weekly, custom cron)
3. PDF Report Export
4. Chart Drill-Down capabilities
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://viz-debug.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_EMAIL = "test@dataviz.com"
TEST_PASSWORD = "test123"

class TestHealthAndAuth:
    """Health check and authentication tests"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"Health check: {data}")
    
    def test_login(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Login successful: {data['user']['email']}")
        return data["token"]


class TestDatabaseConnections:
    """Test database connection endpoints (MongoDB, PostgreSQL, MySQL)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_list_database_connections(self, headers):
        """Test listing database connections"""
        response = requests.get(f"{BASE_URL}/api/database-connections", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "connections" in data
        print(f"Found {len(data['connections'])} database connections")
    
    def test_create_mongodb_connection(self, headers):
        """Test creating a MongoDB connection"""
        connection_data = {
            "name": "TEST_MongoDB_Connection",
            "db_type": "mongodb",
            "host": "localhost",
            "port": 27017,
            "database": "test_db",
            "username": "",
            "password": ""
        }
        response = requests.post(f"{BASE_URL}/api/database-connections", json=connection_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == connection_data["name"]
        print(f"Created MongoDB connection: {data['id']}")
        return data["id"]
    
    def test_create_postgresql_connection(self, headers):
        """Test creating a PostgreSQL connection"""
        connection_data = {
            "name": "TEST_PostgreSQL_Connection",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database": "test_db",
            "username": "postgres",
            "password": ""
        }
        response = requests.post(f"{BASE_URL}/api/database-connections", json=connection_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == connection_data["name"]
        print(f"Created PostgreSQL connection: {data['id']}")
        return data["id"]
    
    def test_create_mysql_connection(self, headers):
        """Test creating a MySQL connection"""
        connection_data = {
            "name": "TEST_MySQL_Connection",
            "db_type": "mysql",
            "host": "localhost",
            "port": 3306,
            "database": "test_db",
            "username": "root",
            "password": ""
        }
        response = requests.post(f"{BASE_URL}/api/database-connections", json=connection_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == connection_data["name"]
        print(f"Created MySQL connection: {data['id']}")
        return data["id"]
    
    def test_get_connection_by_id(self, headers):
        """Test getting a connection by ID"""
        # First create a connection
        connection_data = {
            "name": "TEST_Get_Connection",
            "db_type": "mongodb",
            "host": "localhost",
            "port": 27017,
            "database": "test_db"
        }
        create_response = requests.post(f"{BASE_URL}/api/database-connections", json=connection_data, headers=headers)
        conn_id = create_response.json()["id"]
        
        # Then get it by ID
        response = requests.get(f"{BASE_URL}/api/database-connections/{conn_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conn_id
        assert data["name"] == connection_data["name"]
        print(f"Retrieved connection: {data['name']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/database-connections/{conn_id}", headers=headers)
    
    def test_delete_connection(self, headers):
        """Test deleting a connection"""
        # First create a connection
        connection_data = {
            "name": "TEST_Delete_Connection",
            "db_type": "mongodb",
            "host": "localhost",
            "port": 27017,
            "database": "test_db"
        }
        create_response = requests.post(f"{BASE_URL}/api/database-connections", json=connection_data, headers=headers)
        conn_id = create_response.json()["id"]
        
        # Then delete it
        response = requests.delete(f"{BASE_URL}/api/database-connections/{conn_id}", headers=headers)
        assert response.status_code == 200
        
        # Verify deletion
        verify_response = requests.get(f"{BASE_URL}/api/database-connections/{conn_id}", headers=headers)
        assert verify_response.status_code == 404
        print(f"Deleted connection: {conn_id}")


class TestScheduledRefresh:
    """Test scheduled data refresh endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture
    def test_connection(self, headers):
        """Create a test connection for schedule testing"""
        connection_data = {
            "name": "TEST_Schedule_Connection",
            "db_type": "mongodb",
            "host": "localhost",
            "port": 27017,
            "database": "test_db"
        }
        response = requests.post(f"{BASE_URL}/api/database-connections", json=connection_data, headers=headers)
        conn_id = response.json()["id"]
        yield conn_id
        # Cleanup
        requests.delete(f"{BASE_URL}/api/database-connections/{conn_id}", headers=headers)
    
    def test_set_hourly_schedule(self, headers, test_connection):
        """Test setting hourly schedule"""
        schedule_data = {
            "conn_id": test_connection,
            "interval_type": "hourly",
            "interval_value": 1,
            "enabled": True
        }
        response = requests.post(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                                json=schedule_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "scheduled"
        assert "schedule" in data
        print(f"Hourly schedule set: {data['schedule']}")
    
    def test_set_daily_schedule(self, headers, test_connection):
        """Test setting daily schedule"""
        schedule_data = {
            "conn_id": test_connection,
            "interval_type": "daily",
            "interval_value": 1,
            "enabled": True
        }
        response = requests.post(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                                json=schedule_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "scheduled"
        print(f"Daily schedule set: {data['schedule']}")
    
    def test_set_weekly_schedule(self, headers, test_connection):
        """Test setting weekly schedule"""
        schedule_data = {
            "conn_id": test_connection,
            "interval_type": "weekly",
            "interval_value": 1,
            "enabled": True
        }
        response = requests.post(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                                json=schedule_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "scheduled"
        print(f"Weekly schedule set: {data['schedule']}")
    
    def test_set_custom_cron_schedule(self, headers, test_connection):
        """Test setting custom cron schedule"""
        schedule_data = {
            "conn_id": test_connection,
            "interval_type": "custom",
            "custom_cron": "0 */6 * * *",  # Every 6 hours
            "enabled": True
        }
        response = requests.post(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                                json=schedule_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "scheduled"
        print(f"Custom cron schedule set: {data['schedule']}")
    
    def test_get_schedule(self, headers, test_connection):
        """Test getting current schedule"""
        # First set a schedule
        schedule_data = {
            "conn_id": test_connection,
            "interval_type": "daily",
            "interval_value": 1,
            "enabled": True
        }
        requests.post(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                     json=schedule_data, headers=headers)
        
        # Then get it
        response = requests.get(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                               headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "scheduled"
        assert "schedule" in data
        print(f"Retrieved schedule: {data['schedule']}")
    
    def test_disable_schedule(self, headers, test_connection):
        """Test disabling schedule"""
        schedule_data = {
            "conn_id": test_connection,
            "interval_type": "daily",
            "interval_value": 1,
            "enabled": False
        }
        response = requests.post(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                                json=schedule_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "disabled"
        print(f"Schedule disabled")
    
    def test_delete_schedule(self, headers, test_connection):
        """Test deleting schedule"""
        # First set a schedule
        schedule_data = {
            "conn_id": test_connection,
            "interval_type": "daily",
            "interval_value": 1,
            "enabled": True
        }
        requests.post(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                     json=schedule_data, headers=headers)
        
        # Then delete it
        response = requests.delete(f"{BASE_URL}/api/database-connections/{test_connection}/schedule", 
                                  headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "removed"
        print(f"Schedule deleted")


class TestPDFExport:
    """Test PDF report export endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_export_pdf_with_no_charts(self, headers):
        """Test PDF export with no charts - should return 400"""
        export_data = {
            "chart_ids": [],
            "include_data_tables": True,
            "title": "Test Report"
        }
        response = requests.post(f"{BASE_URL}/api/reports/export/pdf", json=export_data, headers=headers)
        assert response.status_code == 400
        print(f"Correctly rejected empty chart list")
    
    def test_export_pdf_with_existing_charts(self, headers):
        """Test PDF export with existing charts"""
        # First get existing charts
        charts_response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        charts = charts_response.json().get("charts", [])
        
        if not charts:
            pytest.skip("No charts available for PDF export test")
        
        chart_ids = [c["id"] for c in charts[:3]]  # Take up to 3 charts
        
        export_data = {
            "chart_ids": chart_ids,
            "include_data_tables": True,
            "title": "DataViz Studio Test Report"
        }
        response = requests.post(f"{BASE_URL}/api/reports/export/pdf", json=export_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "pdf_base64" in data
        assert "filename" in data
        print(f"PDF exported: {data['filename']}, charts included: {data.get('charts_included', len(chart_ids))}")
    
    def test_export_pdf_with_dashboard(self, headers):
        """Test PDF export with dashboard ID"""
        # Get existing dashboards
        dashboards_response = requests.get(f"{BASE_URL}/api/dashboards", headers=headers)
        dashboards = dashboards_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available for PDF export test")
        
        dashboard_id = dashboards[0]["id"]
        
        export_data = {
            "dashboard_id": dashboard_id,
            "include_data_tables": True,
            "title": "Dashboard Report"
        }
        response = requests.post(f"{BASE_URL}/api/reports/export/pdf", json=export_data, headers=headers)
        # May return 400 if dashboard has no charts
        assert response.status_code in [200, 400]
        print(f"Dashboard PDF export response: {response.status_code}")


class TestChartDrillDown:
    """Test chart drill-down capabilities"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture
    def existing_chart(self, headers):
        """Get or create a chart for testing"""
        charts_response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        charts = charts_response.json().get("charts", [])
        
        if charts:
            return charts[0]
        
        # Create a test chart if none exist
        datasets_response = requests.get(f"{BASE_URL}/api/datasets", headers=headers)
        datasets = datasets_response.json().get("datasets", [])
        
        if not datasets:
            pytest.skip("No datasets available for chart drill-down test")
        
        chart_data = {
            "name": "TEST_DrillDown_Chart",
            "type": "bar",
            "dataset_id": datasets[0]["id"],
            "config": {
                "x_field": datasets[0]["columns"][0]["name"] if datasets[0].get("columns") else "category",
                "aggregation": "count"
            }
        }
        response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        return response.json()
    
    def test_get_drill_options(self, headers, existing_chart):
        """Test getting drill-down options for a chart"""
        chart_id = existing_chart.get("id")
        if not chart_id:
            pytest.skip("No chart available for drill options test")
        
        response = requests.get(f"{BASE_URL}/api/charts/{chart_id}/drill-options", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "drill_options" in data
        assert "chart_id" in data
        print(f"Drill options for chart {chart_id}: {len(data['drill_options'])} options available")
        return data
    
    def test_drill_down_with_filter(self, headers, existing_chart):
        """Test drill-down with filter"""
        chart_id = existing_chart.get("id")
        if not chart_id:
            pytest.skip("No chart available for drill-down test")
        
        # First get drill options
        options_response = requests.get(f"{BASE_URL}/api/charts/{chart_id}/drill-options", headers=headers)
        options = options_response.json().get("drill_options", [])
        
        if not options:
            pytest.skip("No drill options available for this chart")
        
        # Use first option for drill down
        first_option = options[0]
        filter_field = first_option["field"]
        filter_values = first_option.get("values", [])
        
        if not filter_values:
            pytest.skip("No filter values available")
        
        filter_value = filter_values[0]
        
        drill_data = {
            "chart_id": chart_id,
            "filter_field": filter_field,
            "filter_value": str(filter_value)
        }
        
        response = requests.post(f"{BASE_URL}/api/charts/{chart_id}/drill-down", json=drill_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "filter" in data
        assert data["filter"]["field"] == filter_field
        print(f"Drill-down successful: filtered by {filter_field}={filter_value}, {data.get('total_rows', 0)} rows returned")
    
    def test_drill_down_returns_breadcrumb(self, headers, existing_chart):
        """Test that drill-down returns breadcrumb navigation"""
        chart_id = existing_chart.get("id")
        if not chart_id:
            pytest.skip("No chart available for breadcrumb test")
        
        # Get drill options
        options_response = requests.get(f"{BASE_URL}/api/charts/{chart_id}/drill-options", headers=headers)
        options = options_response.json().get("drill_options", [])
        
        if not options or not options[0].get("values"):
            pytest.skip("No drill options available for breadcrumb test")
        
        drill_data = {
            "chart_id": chart_id,
            "filter_field": options[0]["field"],
            "filter_value": str(options[0]["values"][0])
        }
        
        response = requests.post(f"{BASE_URL}/api/charts/{chart_id}/drill-down", json=drill_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "breadcrumb" in data
        assert len(data["breadcrumb"]) > 0
        print(f"Breadcrumb returned: {data['breadcrumb']}")
    
    def test_drill_down_chart_not_found(self, headers):
        """Test drill-down with non-existent chart"""
        drill_data = {
            "chart_id": "non-existent-id",
            "filter_field": "category",
            "filter_value": "test"
        }
        
        response = requests.post(f"{BASE_URL}/api/charts/non-existent-id/drill-down", json=drill_data, headers=headers)
        assert response.status_code == 404
        print("Correctly returned 404 for non-existent chart")


class TestCleanup:
    """Cleanup test data after all tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_cleanup_test_connections(self, headers):
        """Cleanup test connections"""
        response = requests.get(f"{BASE_URL}/api/database-connections", headers=headers)
        connections = response.json().get("connections", [])
        
        deleted_count = 0
        for conn in connections:
            if conn["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/database-connections/{conn['id']}", headers=headers)
                deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test connections")
    
    def test_cleanup_test_charts(self, headers):
        """Cleanup test charts"""
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        charts = response.json().get("charts", [])
        
        deleted_count = 0
        for chart in charts:
            if chart["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/charts/{chart['id']}", headers=headers)
                deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test charts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
