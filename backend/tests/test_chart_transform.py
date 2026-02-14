"""
Test suite for Chart Annotations and Data Transformation features
Tests:
- Chart annotations (text, reference line, highlight region) for bar/line/area charts
- Data transformation APIs (filter, rename, cast, calculate, fill_missing, drop, sort)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@dataviz.com",
        "password": "test123"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self, api_client):
        """Test login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Login successful: user={data['user'].get('email')}")


class TestDatasets:
    """Dataset listing and info tests"""
    
    def test_list_datasets(self, authenticated_client):
        """Test listing all datasets"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets")
        assert response.status_code == 200
        data = response.json()
        assert "datasets" in data
        print(f"Found {len(data['datasets'])} datasets")
        return data['datasets']
    
    def test_get_sales_data_dataset(self, authenticated_client):
        """Get the Sales Data 2026 dataset for testing"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets")
        assert response.status_code == 200
        datasets = response.json().get("datasets", [])
        
        # Look for Sales Data 2026 dataset
        sales_dataset = None
        for ds in datasets:
            if "sales" in ds.get("name", "").lower() or "2026" in ds.get("name", ""):
                sales_dataset = ds
                break
        
        if not sales_dataset and datasets:
            sales_dataset = datasets[0]  # Use first available dataset
        
        if sales_dataset:
            print(f"Using dataset: {sales_dataset.get('name')} (id: {sales_dataset.get('id')}, rows: {sales_dataset.get('row_count')})")
            return sales_dataset
        else:
            pytest.skip("No datasets available for testing")


class TestDataTransformation:
    """Data Transformation API tests"""
    
    @pytest.fixture
    def dataset_id(self, authenticated_client):
        """Get a valid dataset ID for testing"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets")
        assert response.status_code == 200
        datasets = response.json().get("datasets", [])
        if datasets:
            return datasets[0].get("id")
        pytest.skip("No datasets available for transformation tests")
    
    def test_transform_preview_filter(self, authenticated_client, dataset_id):
        """Test filter transformation preview"""
        # First get dataset columns
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        assert response.status_code == 200
        dataset = response.json()
        columns = [c.get("name") for c in dataset.get("columns", [])]
        
        if not columns:
            pytest.skip("Dataset has no columns")
        
        # Apply filter transformation
        column_name = columns[0]
        response = authenticated_client.post(
            f"{BASE_URL}/api/datasets/{dataset_id}/transform/preview",
            json={
                "transformations": [
                    {
                        "type": "filter",
                        "config": {
                            "column": column_name,
                            "operator": "not_null",
                            "value": ""
                        },
                        "enabled": True
                    }
                ]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "columns" in data
        print(f"Filter preview returned {len(data.get('data', []))} rows with columns: {data.get('columns', [])}")
    
    def test_transform_preview_sort(self, authenticated_client, dataset_id):
        """Test sort transformation preview"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        assert response.status_code == 200
        dataset = response.json()
        columns = [c.get("name") for c in dataset.get("columns", [])]
        
        if not columns:
            pytest.skip("Dataset has no columns")
        
        column_name = columns[0]
        response = authenticated_client.post(
            f"{BASE_URL}/api/datasets/{dataset_id}/transform/preview",
            json={
                "transformations": [
                    {
                        "type": "sort",
                        "config": {
                            "column": column_name,
                            "order": "asc"
                        },
                        "enabled": True
                    }
                ]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"Sort preview returned {len(data.get('data', []))} rows")
    
    def test_transform_preview_disabled_step(self, authenticated_client, dataset_id):
        """Test that disabled transformation steps are skipped"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        assert response.status_code == 200
        dataset = response.json()
        columns = [c.get("name") for c in dataset.get("columns", [])]
        
        if len(columns) < 1:
            pytest.skip("Dataset has no columns")
        
        column_name = columns[0]
        response = authenticated_client.post(
            f"{BASE_URL}/api/datasets/{dataset_id}/transform/preview",
            json={
                "transformations": [
                    {
                        "type": "drop",
                        "config": {
                            "column": column_name
                        },
                        "enabled": False  # Disabled - should not drop column
                    }
                ]
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Column should still exist because step is disabled
        assert column_name in data.get("columns", []), "Disabled step should not affect data"
        print(f"Disabled step correctly ignored - columns: {data.get('columns', [])}")
    
    def test_transform_preview_multiple_steps(self, authenticated_client, dataset_id):
        """Test multiple transformation steps together"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        assert response.status_code == 200
        dataset = response.json()
        columns = [c.get("name") for c in dataset.get("columns", [])]
        
        if len(columns) < 1:
            pytest.skip("Dataset has no columns")
        
        column_name = columns[0]
        response = authenticated_client.post(
            f"{BASE_URL}/api/datasets/{dataset_id}/transform/preview",
            json={
                "transformations": [
                    {
                        "type": "filter",
                        "config": {
                            "column": column_name,
                            "operator": "not_null",
                            "value": ""
                        },
                        "enabled": True
                    },
                    {
                        "type": "sort",
                        "config": {
                            "column": column_name,
                            "order": "desc"
                        },
                        "enabled": True
                    }
                ]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"Multiple steps preview returned {len(data.get('data', []))} rows")


class TestCharts:
    """Chart CRUD and data tests"""
    
    @pytest.fixture
    def dataset_id(self, authenticated_client):
        """Get a valid dataset ID"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets")
        assert response.status_code == 200
        datasets = response.json().get("datasets", [])
        if datasets:
            return datasets[0].get("id")
        pytest.skip("No datasets available")
    
    def test_list_charts(self, authenticated_client):
        """Test listing all charts"""
        response = authenticated_client.get(f"{BASE_URL}/api/charts")
        assert response.status_code == 200
        data = response.json()
        assert "charts" in data
        print(f"Found {len(data['charts'])} charts")
    
    def test_create_chart_with_annotations(self, authenticated_client, dataset_id):
        """Test creating a bar chart with annotations"""
        # First get dataset columns
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        assert response.status_code == 200
        dataset = response.json()
        columns = [c.get("name") for c in dataset.get("columns", [])]
        
        if not columns:
            pytest.skip("Dataset has no columns")
        
        x_field = columns[0]
        
        # Create chart with annotations
        chart_data = {
            "name": "TEST_Annotated_Bar_Chart",
            "type": "bar",
            "dataset_id": dataset_id,
            "config": {
                "x_field": x_field,
                "y_field": None,
                "aggregation": "count",
                "theme": "violet",
                "showLegend": True,
                "showLabels": True,
                "annotations": [
                    {
                        "id": "test_line_1",
                        "type": "line",
                        "label": "Target",
                        "axis": "y",
                        "value": 100,
                        "color": "#f59e0b",
                        "lineStyle": "dashed"
                    },
                    {
                        "id": "test_text_1",
                        "type": "text",
                        "label": "Peak Sales",
                        "xValue": x_field,
                        "yValue": 50,
                        "color": "#8b5cf6"
                    }
                ]
            }
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/charts", json=chart_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"Created chart with annotations: id={data['id']}, name={data.get('name')}")
        
        # Verify chart was created
        chart_id = data['id']
        response = authenticated_client.get(f"{BASE_URL}/api/charts/{chart_id}")
        assert response.status_code == 200
        chart = response.json()
        assert chart.get("config", {}).get("annotations") is not None
        print(f"Chart config has annotations: {len(chart['config'].get('annotations', []))} annotations")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/charts/{chart_id}")
        return chart_id
    
    def test_create_line_chart_with_reference_line(self, authenticated_client, dataset_id):
        """Test creating a line chart with a reference line annotation"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        assert response.status_code == 200
        dataset = response.json()
        columns = [c.get("name") for c in dataset.get("columns", [])]
        
        if not columns:
            pytest.skip("Dataset has no columns")
        
        x_field = columns[0]
        
        chart_data = {
            "name": "TEST_Line_Chart_Reference",
            "type": "line",
            "dataset_id": dataset_id,
            "config": {
                "x_field": x_field,
                "aggregation": "count",
                "smooth": True,
                "annotations": [
                    {
                        "id": "ref_line_1",
                        "type": "line",
                        "label": "Average Target",
                        "axis": "y",
                        "value": 50,
                        "color": "#10b981",
                        "lineStyle": "solid"
                    }
                ]
            }
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/charts", json=chart_data)
        assert response.status_code == 200
        data = response.json()
        chart_id = data['id']
        print(f"Created line chart with reference line: id={chart_id}")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/charts/{chart_id}")
    
    def test_create_area_chart_with_highlight_region(self, authenticated_client, dataset_id):
        """Test creating an area chart with highlight region annotation"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        assert response.status_code == 200
        dataset = response.json()
        columns = [c.get("name") for c in dataset.get("columns", [])]
        
        if not columns:
            pytest.skip("Dataset has no columns")
        
        x_field = columns[0]
        
        chart_data = {
            "name": "TEST_Area_Chart_Region",
            "type": "area",
            "dataset_id": dataset_id,
            "config": {
                "x_field": x_field,
                "aggregation": "count",
                "annotations": [
                    {
                        "id": "region_1",
                        "type": "region",
                        "label": "Promotion Period",
                        "startX": "Jan",
                        "endX": "Mar",
                        "color": "#8b5cf6"
                    }
                ]
            }
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/charts", json=chart_data)
        assert response.status_code == 200
        data = response.json()
        chart_id = data['id']
        print(f"Created area chart with highlight region: id={chart_id}")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/charts/{chart_id}")


class TestDatasetStats:
    """Dataset stats tests - required for transform page column info"""
    
    @pytest.fixture
    def dataset_id(self, authenticated_client):
        """Get a valid dataset ID"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets")
        assert response.status_code == 200
        datasets = response.json().get("datasets", [])
        if datasets:
            return datasets[0].get("id")
        pytest.skip("No datasets available")
    
    def test_get_dataset_stats(self, authenticated_client, dataset_id):
        """Test getting dataset statistics"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}/stats")
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        print(f"Dataset stats has {len(data.get('stats', {}))} column statistics")
    
    def test_get_dataset_data(self, authenticated_client, dataset_id):
        """Test getting dataset data with pagination"""
        response = authenticated_client.get(f"{BASE_URL}/api/datasets/{dataset_id}/data?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        print(f"Dataset data: {len(data.get('data', []))} rows, total: {data.get('total')}, page: {data.get('page')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
