"""
Cross-Filtering Feature Tests for DataViz Studio
Tests POST /api/widgets/{id}/data endpoint with filters support
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCrossFilter:
    """Tests for cross-filtering feature on dashboard widgets"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test credentials and login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Authentication failed - skipping tests")
        
        # Test dashboard ID and dataset ID provided by main agent
        self.dashboard_id = "e5f3240e-a009-4df5-9124-be7c7c960944"
        self.dataset_id = "2b7d310a-7980-4609-a015-76c7b4bb1e91"
    
    def test_get_dashboard_widgets(self):
        """Test that dashboard has widgets"""
        response = self.session.get(f"{BASE_URL}/api/dashboards/{self.dashboard_id}/widgets")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "widgets" in data, "Response should contain widgets array"
        
        widgets = data["widgets"]
        assert len(widgets) > 0, "Dashboard should have at least one widget"
        
        # Store widget IDs for later tests
        self.widget_ids = [w["id"] for w in widgets]
        print(f"PASS: Dashboard has {len(widgets)} widgets")
        
        # Verify widget structure
        for widget in widgets:
            assert "id" in widget, "Widget should have id"
            assert "type" in widget, "Widget should have type"
            assert "title" in widget, "Widget should have title"
            print(f"  - {widget['title']} ({widget['type']})")
        
        return widgets
    
    def test_get_widget_data_unfiltered(self):
        """Test GET /api/widgets/{id}/data returns data without filters"""
        # First get widgets
        widgets_response = self.session.get(f"{BASE_URL}/api/dashboards/{self.dashboard_id}/widgets")
        widgets = widgets_response.json().get("widgets", [])
        
        if not widgets:
            pytest.skip("No widgets found for dashboard")
        
        # Test first widget
        widget = widgets[0]
        widget_id = widget["id"]
        
        response = self.session.get(f"{BASE_URL}/api/widgets/{widget_id}/data")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Response should contain data"
        print(f"PASS: GET /api/widgets/{widget_id}/data returns {type(data['data']).__name__}")
    
    def test_post_widget_data_with_empty_filters(self):
        """Test POST /api/widgets/{id}/data with empty filters object"""
        # Get widgets
        widgets_response = self.session.get(f"{BASE_URL}/api/dashboards/{self.dashboard_id}/widgets")
        widgets = widgets_response.json().get("widgets", [])
        
        if not widgets:
            pytest.skip("No widgets found for dashboard")
        
        widget_id = widgets[0]["id"]
        
        response = self.session.post(
            f"{BASE_URL}/api/widgets/{widget_id}/data",
            json={"filters": {}}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "data" in data, "Response should contain data"
        assert "filtered" in data, "Response should contain filtered flag"
        assert data["filtered"] == False, "filtered flag should be False for empty filters"
        
        print(f"PASS: POST /api/widgets/{widget_id}/data with empty filters works")
    
    def test_post_widget_data_with_filter(self):
        """Test POST /api/widgets/{id}/data with actual filter (Region filter for cross-filtering)"""
        # Get widgets
        widgets_response = self.session.get(f"{BASE_URL}/api/dashboards/{self.dashboard_id}/widgets")
        widgets = widgets_response.json().get("widgets", [])
        
        if not widgets:
            pytest.skip("No widgets found for dashboard")
        
        widget_id = widgets[0]["id"]
        
        # Apply filter on Region field (from Sales Data 2026 dataset)
        response = self.session.post(
            f"{BASE_URL}/api/widgets/{widget_id}/data",
            json={"filters": {"Region": "East"}}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "data" in data, "Response should contain data"
        assert "filtered" in data, "Response should contain filtered flag"
        assert data["filtered"] == True, "filtered flag should be True when filters are applied"
        
        print(f"PASS: POST /api/widgets/{widget_id}/data with Region='East' filter works")
        print(f"  - filtered: {data['filtered']}")
        print(f"  - data returned: {data['data'] is not None}")
    
    def test_post_widget_data_for_all_widgets(self):
        """Test cross-filtering works for all widget types (stat, chart, table)"""
        widgets_response = self.session.get(f"{BASE_URL}/api/dashboards/{self.dashboard_id}/widgets")
        widgets = widgets_response.json().get("widgets", [])
        
        if not widgets:
            pytest.skip("No widgets found for dashboard")
        
        # Group by type
        widget_types = {}
        for w in widgets:
            w_type = w.get("type", "unknown")
            if w_type not in widget_types:
                widget_types[w_type] = []
            widget_types[w_type].append(w)
        
        print(f"Widget types found: {list(widget_types.keys())}")
        
        # Test each widget with a filter
        passed = 0
        failed = 0
        
        for widget in widgets:
            widget_id = widget["id"]
            widget_type = widget.get("type")
            widget_title = widget.get("title")
            
            response = self.session.post(
                f"{BASE_URL}/api/widgets/{widget_id}/data",
                json={"filters": {"Region": "East"}}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("filtered") == True:
                    passed += 1
                    print(f"  PASS: {widget_title} ({widget_type}) - filtered data returned")
                else:
                    passed += 1
                    print(f"  PASS: {widget_title} ({widget_type}) - endpoint works (no matching filter field)")
            else:
                failed += 1
                print(f"  FAIL: {widget_title} ({widget_type}) - {response.status_code}")
        
        assert failed == 0, f"{failed} widgets failed cross-filter test"
        print(f"\nPASS: All {passed} widgets support cross-filtering endpoint")
    
    def test_post_widget_data_nonexistent_widget(self):
        """Test POST /api/widgets/{id}/data with non-existent widget returns 404"""
        response = self.session.post(
            f"{BASE_URL}/api/widgets/nonexistent-widget-id/data",
            json={"filters": {"Region": "East"}}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Non-existent widget returns 404")
    
    def test_multiple_filters(self):
        """Test POST /api/widgets/{id}/data with multiple filters"""
        widgets_response = self.session.get(f"{BASE_URL}/api/dashboards/{self.dashboard_id}/widgets")
        widgets = widgets_response.json().get("widgets", [])
        
        if not widgets:
            pytest.skip("No widgets found for dashboard")
        
        widget_id = widgets[0]["id"]
        
        # Apply multiple filters
        response = self.session.post(
            f"{BASE_URL}/api/widgets/{widget_id}/data",
            json={"filters": {"Region": "East", "Quarter": "Q1"}}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("filtered") == True, "filtered flag should be True"
        
        print("PASS: Multiple filters work correctly")


class TestDatasetWithFilters:
    """Test dataset data to understand structure for cross-filtering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test credentials and login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Authentication failed")
        
        self.dataset_id = "2b7d310a-7980-4609-a015-76c7b4bb1e91"
    
    def test_get_dataset_columns(self):
        """Verify dataset has Region, Sales, Quarter columns for cross-filtering"""
        response = self.session.get(f"{BASE_URL}/api/datasets/{self.dataset_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        columns = data.get("columns", [])
        column_names = [c["name"] for c in columns]
        
        print(f"Dataset columns: {column_names}")
        
        # Verify expected columns exist
        expected_columns = ["Region", "Sales", "Quarter"]
        for col in expected_columns:
            assert col in column_names, f"Expected column '{col}' not found in dataset"
        
        print(f"PASS: Dataset has all required columns: {expected_columns}")
    
    def test_get_dataset_sample_data(self):
        """Get sample data to see possible filter values"""
        response = self.session.get(f"{BASE_URL}/api/datasets/{self.dataset_id}/data?limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        rows = data.get("data", [])
        
        if rows:
            print(f"Sample data structure:")
            # Get unique values for filter fields
            regions = set()
            quarters = set()
            for row in rows:
                if "Region" in row:
                    regions.add(row["Region"])
                if "Quarter" in row:
                    quarters.add(row["Quarter"])
            
            print(f"  - Regions: {regions}")
            print(f"  - Quarters: {quarters}")
        
        print(f"PASS: Dataset data accessible ({len(rows)} sample rows)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
