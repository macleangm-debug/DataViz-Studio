"""
Test file for Chart Studio and AI Insights features - Iteration 3
Tests: Charts CRUD, Dataset selection, AI query, AI suggestions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Health and authentication tests"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_login_with_test_credentials(self):
        """Test login with provided test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        
        if response.status_code == 401:
            # User doesn't exist, register first
            print("Test user doesn't exist, creating...")
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": "test@dataviz.com",
                "password": "test123",
                "name": "Test User"
            })
            if reg_response.status_code == 200:
                data = reg_response.json()
                print(f"✓ User registered: {data['user']['email']}")
                return data
            elif reg_response.status_code == 400:
                # Email already registered, try login again
                response = requests.post(f"{BASE_URL}/api/auth/login", json={
                    "email": "test@dataviz.com",
                    "password": "test123"
                })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Login successful: {data['user']['email']}")
        return data


class TestDatasets:
    """Dataset tests for chart creation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        if response.status_code == 401:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": "test@dataviz.com",
                "password": "test123",
                "name": "Test User"
            })
        return response.json().get("token")
    
    def test_list_datasets(self, auth_token):
        """Test listing datasets"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/datasets", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "datasets" in data
        print(f"✓ Listed {len(data['datasets'])} datasets")
        return data['datasets']
    
    def test_get_dataset_data(self, auth_token):
        """Test getting dataset data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get datasets
        datasets_response = requests.get(f"{BASE_URL}/api/datasets", headers=headers)
        datasets = datasets_response.json().get("datasets", [])
        
        if not datasets:
            pytest.skip("No datasets available for testing")
        
        # Get first dataset's data
        dataset_id = datasets[0]["id"]
        response = requests.get(f"{BASE_URL}/api/datasets/{dataset_id}/data", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Retrieved data for dataset {datasets[0]['name']}: {data.get('total', len(data.get('data', [])))} rows")


class TestCharts:
    """Chart Studio feature tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        if response.status_code == 401:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": "test@dataviz.com",
                "password": "test123",
                "name": "Test User"
            })
        return response.json().get("token")
    
    @pytest.fixture
    def test_dataset_id(self, auth_token):
        """Get a valid dataset ID for chart creation"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/datasets", headers=headers)
        datasets = response.json().get("datasets", [])
        if not datasets:
            pytest.skip("No datasets available for chart testing")
        return datasets[0]["id"]
    
    def test_list_charts(self, auth_token):
        """Test listing charts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "charts" in data
        print(f"✓ Listed {len(data['charts'])} charts")
        return data['charts']
    
    def test_create_bar_chart(self, auth_token, test_dataset_id):
        """Test creating a bar chart"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get dataset columns to pick valid field names
        dataset_response = requests.get(f"{BASE_URL}/api/datasets/{test_dataset_id}", headers=headers)
        if dataset_response.status_code != 200:
            pytest.skip("Could not fetch dataset details")
        
        dataset = dataset_response.json()
        columns = dataset.get("columns", [])
        
        x_field = columns[0]["name"] if columns else "category"
        y_field = None
        for col in columns:
            if "int" in col["type"] or "float" in col["type"]:
                y_field = col["name"]
                break
        
        chart_data = {
            "name": "TEST_Bar_Chart",
            "type": "bar",
            "dataset_id": test_dataset_id,
            "config": {
                "x_field": x_field,
                "y_field": y_field,
                "aggregation": "count",
                "theme": "violet"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_Bar_Chart"
        print(f"✓ Created bar chart: {data}")
        return data["id"]
    
    def test_create_line_chart(self, auth_token, test_dataset_id):
        """Test creating a line chart"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        chart_data = {
            "name": "TEST_Line_Chart",
            "type": "line",
            "dataset_id": test_dataset_id,
            "config": {
                "x_field": "category",
                "aggregation": "count",
                "theme": "ocean"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ Created line chart: {data}")
        return data["id"]
    
    def test_create_pie_chart(self, auth_token, test_dataset_id):
        """Test creating a pie chart"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        chart_data = {
            "name": "TEST_Pie_Chart",
            "type": "pie",
            "dataset_id": test_dataset_id,
            "config": {
                "x_field": "category",
                "aggregation": "count",
                "theme": "forest"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ Created pie chart: {data}")
        return data["id"]
    
    def test_create_area_chart(self, auth_token, test_dataset_id):
        """Test creating an area chart"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        chart_data = {
            "name": "TEST_Area_Chart",
            "type": "area",
            "dataset_id": test_dataset_id,
            "config": {
                "x_field": "category",
                "aggregation": "count",
                "theme": "sunset"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ Created area chart: {data}")
        return data["id"]
    
    def test_get_chart_by_id(self, auth_token, test_dataset_id):
        """Test getting a chart by ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a chart first
        chart_data = {
            "name": "TEST_Chart_GetById",
            "type": "bar",
            "dataset_id": test_dataset_id,
            "config": {"x_field": "category"}
        }
        create_response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        chart_id = create_response.json()["id"]
        
        # Get chart by ID
        response = requests.get(f"{BASE_URL}/api/charts/{chart_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == chart_id
        assert data["name"] == "TEST_Chart_GetById"
        print(f"✓ Retrieved chart by ID: {data['name']}")
    
    def test_get_chart_data(self, auth_token, test_dataset_id):
        """Test getting chart data for rendering"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a chart first
        chart_data = {
            "name": "TEST_Chart_Data",
            "type": "bar",
            "dataset_id": test_dataset_id,
            "config": {"x_field": "category", "aggregation": "count"}
        }
        create_response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        chart_id = create_response.json()["id"]
        
        # Get chart data
        response = requests.get(f"{BASE_URL}/api/charts/{chart_id}/data", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "chart" in data
        assert "data" in data
        print(f"✓ Retrieved chart data: {len(data['data'])} data points")
    
    def test_update_chart(self, auth_token, test_dataset_id):
        """Test updating a chart"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a chart first
        chart_data = {
            "name": "TEST_Chart_Update",
            "type": "bar",
            "dataset_id": test_dataset_id,
            "config": {"x_field": "category"}
        }
        create_response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        chart_id = create_response.json()["id"]
        
        # Update chart
        update_data = {
            "name": "TEST_Chart_Updated",
            "type": "line",
            "dataset_id": test_dataset_id,
            "config": {"x_field": "category", "theme": "berry"}
        }
        response = requests.put(f"{BASE_URL}/api/charts/{chart_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/charts/{chart_id}", headers=headers)
        updated_chart = get_response.json()
        assert updated_chart["name"] == "TEST_Chart_Updated"
        assert updated_chart["type"] == "line"
        print(f"✓ Updated chart successfully")
    
    def test_delete_chart(self, auth_token, test_dataset_id):
        """Test deleting a chart"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a chart first
        chart_data = {
            "name": "TEST_Chart_Delete",
            "type": "bar",
            "dataset_id": test_dataset_id,
            "config": {"x_field": "category"}
        }
        create_response = requests.post(f"{BASE_URL}/api/charts", json=chart_data, headers=headers)
        chart_id = create_response.json()["id"]
        
        # Delete chart
        response = requests.delete(f"{BASE_URL}/api/charts/{chart_id}", headers=headers)
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/charts/{chart_id}", headers=headers)
        assert get_response.status_code == 404
        print(f"✓ Deleted chart successfully")


class TestAIInsights:
    """AI Insights feature tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        if response.status_code == 401:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": "test@dataviz.com",
                "password": "test123",
                "name": "Test User"
            })
        return response.json().get("token")
    
    @pytest.fixture
    def test_dataset_id(self, auth_token):
        """Get a valid dataset ID for AI testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/datasets", headers=headers)
        datasets = response.json().get("datasets", [])
        if not datasets:
            pytest.skip("No datasets available for AI testing")
        return datasets[0]["id"]
    
    def test_ai_query_without_dataset(self, auth_token):
        """Test AI query without specific dataset"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        query_data = {
            "query": "What types of charts work best for categorical data?",
            "dataset_id": None,
            "context": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/query", json=query_data, headers=headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"✓ AI query without dataset: Got {len(data['response'])} char response")
    
    def test_ai_query_with_dataset(self, auth_token, test_dataset_id):
        """Test AI query with specific dataset context"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        query_data = {
            "query": "Summarize this dataset",
            "dataset_id": test_dataset_id,
            "context": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/query", json=query_data, headers=headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ AI query with dataset: Got {len(data['response'])} char response")
    
    def test_ai_suggest_charts(self, auth_token, test_dataset_id):
        """Test AI chart suggestions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggest-charts?dataset_id={test_dataset_id}",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        print(f"✓ AI suggested {len(data['suggestions'])} charts")
        if data["suggestions"]:
            print(f"  First suggestion: {data['suggestions'][0].get('title', 'N/A')}")


class TestCleanup:
    """Cleanup test-created data"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        if response.status_code == 401:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": "test@dataviz.com",
                "password": "test123",
                "name": "Test User"
            })
        return response.json().get("token")
    
    def test_cleanup_test_charts(self, auth_token):
        """Clean up all TEST_ prefixed charts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        charts = response.json().get("charts", [])
        
        deleted_count = 0
        for chart in charts:
            if chart["name"].startswith("TEST_"):
                delete_response = requests.delete(f"{BASE_URL}/api/charts/{chart['id']}", headers=headers)
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test charts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
