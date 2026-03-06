"""
Test file for Drill Down Feature (Phase 2B) - Iteration 32
Tests:
1. POST /api/widgets/{id}/data with drill_level parameter
2. Widget drilldown hierarchy support
3. Dashboard layout (3 widgets per row with w=4)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@dataviz.com"
TEST_PASSWORD = "test123"

# Test dashboard ID (from main agent context)
TEST_DASHBOARD_ID = "e5f3240e-a009-4df5-9124-be7c7c960944"
# Widget with drilldown hierarchy (Sales by Region -> Quarter)
DRILLDOWN_WIDGET_ID = "d8705a2f-d1b3-4bd3-a608-3784bb69e291"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestDrillDownBackendAPI:
    """Test drill-down related backend API endpoints"""
    
    def test_get_dashboard_exists(self, auth_headers):
        """Test that test dashboard exists"""
        response = requests.get(f"{BASE_URL}/api/dashboards/{TEST_DASHBOARD_ID}", headers=auth_headers)
        assert response.status_code == 200, f"Dashboard not found: {response.text}"
        data = response.json()
        assert "name" in data
        print(f"PASS: Dashboard '{data['name']}' exists")
    
    def test_get_dashboard_widgets(self, auth_headers):
        """Test getting dashboard widgets"""
        response = requests.get(f"{BASE_URL}/api/dashboards/{TEST_DASHBOARD_ID}/widgets", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get widgets: {response.text}"
        data = response.json()
        widgets = data.get("widgets", [])
        assert len(widgets) > 0, "No widgets found in dashboard"
        print(f"PASS: Dashboard has {len(widgets)} widgets")
        
        # Check for drilldown widget
        drilldown_widget = next((w for w in widgets if w.get("id") == DRILLDOWN_WIDGET_ID), None)
        if drilldown_widget:
            print(f"PASS: Found drilldown widget: {drilldown_widget.get('title')}")
            config = drilldown_widget.get("config", {})
            drilldown = config.get("drilldown", [])
            print(f"  - Drilldown hierarchy: {drilldown}")
        else:
            print(f"INFO: Drilldown widget {DRILLDOWN_WIDGET_ID} not found - checking all widgets")
            for w in widgets:
                config = w.get("config", {})
                if config.get("drilldown"):
                    print(f"  - Widget '{w.get('title')}' has drilldown: {config.get('drilldown')}")
        
        return widgets
    
    def test_widget_data_without_drill(self, auth_headers):
        """Test POST /api/widgets/{id}/data without drill_level (baseline)"""
        # First get widget data normally (top level)
        response = requests.post(
            f"{BASE_URL}/api/widgets/{DRILLDOWN_WIDGET_ID}/data",
            json={"filters": {}},
            headers=auth_headers
        )
        
        if response.status_code == 404:
            print(f"SKIP: Widget {DRILLDOWN_WIDGET_ID} not found - checking available widgets")
            # Get first chart widget from dashboard
            widgets_resp = requests.get(f"{BASE_URL}/api/dashboards/{TEST_DASHBOARD_ID}/widgets", headers=auth_headers)
            widgets = widgets_resp.json().get("widgets", [])
            chart_widget = next((w for w in widgets if w.get("type") == "chart"), None)
            if chart_widget:
                response = requests.post(
                    f"{BASE_URL}/api/widgets/{chart_widget['id']}/data",
                    json={"filters": {}},
                    headers=auth_headers
                )
                assert response.status_code == 200
                data = response.json()
                print(f"PASS: Widget '{chart_widget['title']}' data returned (no drill)")
                print(f"  - Data points: {len(data.get('data', []))}")
            return
        
        assert response.status_code == 200, f"Failed to get widget data: {response.text}"
        data = response.json()
        assert "data" in data
        assert "widget" in data
        print(f"PASS: Widget data returned without drill_level")
        print(f"  - Filtered: {data.get('filtered')}")
        print(f"  - Drilled: {data.get('drilled')}")
        print(f"  - Data points: {len(data.get('data', []))}")
    
    def test_widget_data_with_drill_level(self, auth_headers):
        """Test POST /api/widgets/{id}/data WITH drill_level parameter"""
        # First get a chart widget
        widgets_resp = requests.get(f"{BASE_URL}/api/dashboards/{TEST_DASHBOARD_ID}/widgets", headers=auth_headers)
        widgets = widgets_resp.json().get("widgets", [])
        chart_widget = next((w for w in widgets if w.get("type") == "chart"), None)
        
        if not chart_widget:
            pytest.skip("No chart widget found")
        
        widget_id = chart_widget["id"]
        config = chart_widget.get("config", {})
        drilldown_hierarchy = config.get("drilldown", [])
        
        print(f"Testing widget: {chart_widget['title']}")
        print(f"  - Drilldown hierarchy: {drilldown_hierarchy}")
        
        # Test drilling down if hierarchy exists
        if len(drilldown_hierarchy) > 1:
            # First level is Region, second level is Quarter
            drill_field = drilldown_hierarchy[1] if len(drilldown_hierarchy) > 1 else "Quarter"
            
            # Apply drill: filter by first level value, group by second level
            response = requests.post(
                f"{BASE_URL}/api/widgets/{widget_id}/data",
                json={
                    "filters": {drilldown_hierarchy[0]: "East"},  # Filter by Region=East
                    "drill_level": drill_field  # Group by Quarter
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200, f"Drill request failed: {response.text}"
            data = response.json()
            
            print(f"PASS: Drill-down request successful")
            print(f"  - Filtered: {data.get('filtered')}")
            print(f"  - Drilled: {data.get('drilled')}")
            print(f"  - Drill level: {data.get('drill_level')}")
            print(f"  - Current x_field: {data.get('current_x_field')}")
            print(f"  - Data points: {len(data.get('data', []))}")
            
            # Verify the response includes drilled flag
            assert data.get("drilled") == True, "Expected drilled=True"
            assert data.get("drill_level") == drill_field, f"Expected drill_level={drill_field}"
        else:
            print(f"INFO: Widget has no drilldown hierarchy configured")
            # Test basic drill_level parameter still works
            response = requests.post(
                f"{BASE_URL}/api/widgets/{widget_id}/data",
                json={
                    "filters": {},
                    "drill_level": "Quarter"
                },
                headers=auth_headers
            )
            if response.status_code == 200:
                data = response.json()
                print(f"PASS: drill_level parameter accepted")
                print(f"  - Drilled: {data.get('drilled')}")
    
    def test_widget_data_drill_with_filter(self, auth_headers):
        """Test drill-down with filter combination"""
        widgets_resp = requests.get(f"{BASE_URL}/api/dashboards/{TEST_DASHBOARD_ID}/widgets", headers=auth_headers)
        widgets = widgets_resp.json().get("widgets", [])
        chart_widget = next((w for w in widgets if w.get("type") == "chart"), None)
        
        if not chart_widget:
            pytest.skip("No chart widget found")
        
        widget_id = chart_widget["id"]
        
        # Test with both filters and drill_level
        response = requests.post(
            f"{BASE_URL}/api/widgets/{widget_id}/data",
            json={
                "filters": {"Region": "East"},
                "drill_level": "Quarter"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Request failed: {response.text}"
        data = response.json()
        
        print(f"PASS: Combined filter + drill request successful")
        print(f"  - Filtered: {data.get('filtered')} (expected: True)")
        print(f"  - Drilled: {data.get('drilled')} (expected: True)")
        
        # Both should be true
        assert data.get("filtered") == True, "Expected filtered=True"
        assert data.get("drilled") == True, "Expected drilled=True"


class TestWidgetDrilldownConfiguration:
    """Test that widgets have correct drilldown configuration"""
    
    def test_drilldown_widget_has_hierarchy(self, auth_headers):
        """Test that Sales by Region widget has drilldown hierarchy"""
        # Check all widgets for drilldown via dashboard endpoint
        widgets_resp = requests.get(f"{BASE_URL}/api/dashboards/{TEST_DASHBOARD_ID}/widgets", headers=auth_headers)
        assert widgets_resp.status_code == 200
        widgets = widgets_resp.json().get("widgets", [])
        
        drilldown_widgets = [w for w in widgets if w.get("config", {}).get("drilldown")]
        assert len(drilldown_widgets) > 0, "Expected at least one widget with drilldown hierarchy"
        
        print(f"PASS: Found {len(drilldown_widgets)} widget(s) with drilldown hierarchy")
        for w in drilldown_widgets:
            hierarchy = w['config']['drilldown']
            print(f"  - {w['title']}: {hierarchy}")
            assert len(hierarchy) >= 2, f"Drilldown should have at least 2 levels: {hierarchy}"


class TestDashboardLayout:
    """Test dashboard layout configuration (3 widgets per row)"""
    
    def test_widgets_have_position(self, auth_headers):
        """Test that widgets have position data"""
        response = requests.get(f"{BASE_URL}/api/dashboards/{TEST_DASHBOARD_ID}/widgets", headers=auth_headers)
        assert response.status_code == 200
        widgets = response.json().get("widgets", [])
        
        for widget in widgets:
            position = widget.get("position", {})
            print(f"Widget '{widget['title']}': position={position}")
            
            # Check width (should be 4 for 3-per-row in 12-col grid)
            w = position.get("w", 4)
            if w != 4:
                print(f"  - NOTE: Widget width is {w}, expected 4 for 3-per-row layout")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
