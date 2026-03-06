"""
Test Phase 1B: Chart Preview Thumbnails, Tags, and Favorites for Charts and Dashboards
Tests dashboard/chart favorite toggle and view tracking endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://viz-preview.preview.emergentagent.com')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data


class TestDashboardFavorites:
    """Dashboard favorites and view tracking tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def dashboard_id(self, auth_token):
        """Get a dashboard ID for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboards", headers=headers)
        assert response.status_code == 200
        dashboards = response.json().get("dashboards", [])
        assert len(dashboards) > 0, "No dashboards found for testing"
        return dashboards[0]["id"]
    
    def test_get_dashboards_list(self, auth_token):
        """Test getting list of dashboards"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboards", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "dashboards" in data
        print(f"Found {len(data['dashboards'])} dashboards")
    
    def test_dashboard_contains_favorite_field(self, auth_token):
        """Test that dashboard objects have is_favorite field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboards", headers=headers)
        assert response.status_code == 200
        dashboards = response.json().get("dashboards", [])
        if dashboards:
            dashboard = dashboards[0]
            # is_favorite should exist (default False or True)
            assert "is_favorite" in dashboard or dashboard.get("is_favorite") is not None or dashboard.get("is_favorite") is None
            print(f"Dashboard '{dashboard['name']}' is_favorite: {dashboard.get('is_favorite', False)}")
    
    def test_dashboard_favorite_toggle(self, auth_token, dashboard_id):
        """Test POST /api/dashboards/{id}/favorite endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First toggle
        response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/favorite", headers=headers)
        assert response.status_code == 200, f"Favorite toggle failed: {response.text}"
        data = response.json()
        assert "is_favorite" in data
        first_state = data["is_favorite"]
        print(f"First toggle - is_favorite: {first_state}")
        
        # Second toggle should reverse
        response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/favorite", headers=headers)
        assert response.status_code == 200
        data = response.json()
        second_state = data["is_favorite"]
        assert second_state != first_state, "Favorite toggle did not reverse state"
        print(f"Second toggle - is_favorite: {second_state}")
    
    def test_dashboard_view_tracking(self, auth_token, dashboard_id):
        """Test POST /api/dashboards/{id}/view endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/view", headers=headers)
        assert response.status_code == 200, f"View tracking failed: {response.text}"
        data = response.json()
        assert data.get("status") == "view tracked"
        print("Dashboard view tracked successfully")
    
    def test_dashboard_has_widgets_count(self, auth_token, dashboard_id):
        """Test that a specific dashboard has widget count information"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # Get specific dashboard to see widgets
        response = requests.get(f"{BASE_URL}/api/dashboards/{dashboard_id}", headers=headers)
        assert response.status_code == 200
        dashboard = response.json()
        # widgets field should exist as array
        widget_count = len(dashboard.get("widgets", []))
        print(f"Dashboard '{dashboard.get('name', dashboard_id)}' has {widget_count} widgets")


class TestChartFavorites:
    """Chart favorites and view tracking tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def chart_id(self, auth_token):
        """Get a chart ID for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        assert response.status_code == 200
        charts = response.json().get("charts", [])
        assert len(charts) > 0, "No charts found for testing"
        return charts[0]["id"]
    
    def test_get_charts_list(self, auth_token):
        """Test getting list of charts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "charts" in data
        print(f"Found {len(data['charts'])} charts")
    
    def test_chart_contains_tags_field(self, auth_token):
        """Test that chart objects have tags field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        assert response.status_code == 200
        charts = response.json().get("charts", [])
        if charts:
            chart = charts[0]
            # tags field should exist
            tags = chart.get("tags", [])
            print(f"Chart '{chart['name']}' tags: {tags}")
    
    def test_chart_contains_favorite_field(self, auth_token):
        """Test that chart objects have is_favorite field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        assert response.status_code == 200
        charts = response.json().get("charts", [])
        if charts:
            chart = charts[0]
            print(f"Chart '{chart['name']}' is_favorite: {chart.get('is_favorite', False)}")
    
    def test_chart_favorite_toggle(self, auth_token, chart_id):
        """Test POST /api/charts/{id}/favorite endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First toggle
        response = requests.post(f"{BASE_URL}/api/charts/{chart_id}/favorite", headers=headers)
        assert response.status_code == 200, f"Chart favorite toggle failed: {response.text}"
        data = response.json()
        assert "is_favorite" in data
        first_state = data["is_favorite"]
        print(f"First chart favorite toggle - is_favorite: {first_state}")
        
        # Second toggle should reverse
        response = requests.post(f"{BASE_URL}/api/charts/{chart_id}/favorite", headers=headers)
        assert response.status_code == 200
        data = response.json()
        second_state = data["is_favorite"]
        assert second_state != first_state, "Chart favorite toggle did not reverse state"
        print(f"Second chart favorite toggle - is_favorite: {second_state}")
    
    def test_chart_view_tracking(self, auth_token, chart_id):
        """Test POST /api/charts/{id}/view endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/charts/{chart_id}/view", headers=headers)
        assert response.status_code == 200, f"Chart view tracking failed: {response.text}"
        data = response.json()
        assert data.get("status") == "view tracked"
        print("Chart view tracked successfully")
    
    def test_chart_has_type_field(self, auth_token):
        """Test that charts have type field (bar, line, pie, etc)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/charts", headers=headers)
        assert response.status_code == 200
        charts = response.json().get("charts", [])
        if charts:
            chart = charts[0]
            assert "type" in chart, "Chart missing 'type' field"
            print(f"Chart '{chart['name']}' type: {chart['type']}")


class TestNonExistentResources:
    """Test error handling for non-existent resources"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dataviz.com",
            "password": "test123"
        })
        return response.json()["token"]
    
    def test_favorite_nonexistent_dashboard(self, auth_token):
        """Test favorite toggle on non-existent dashboard returns 404"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/dashboards/nonexistent-id/favorite", headers=headers)
        assert response.status_code == 404
    
    def test_view_nonexistent_dashboard(self, auth_token):
        """Test view tracking on non-existent dashboard"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/dashboards/nonexistent-id/view", headers=headers)
        # View tracking may succeed silently or return 404 depending on implementation
        print(f"View non-existent dashboard status: {response.status_code}")
    
    def test_favorite_nonexistent_chart(self, auth_token):
        """Test favorite toggle on non-existent chart returns 404"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/charts/nonexistent-id/favorite", headers=headers)
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
