"""
Test file for Dashboard Template Library feature (Iteration 11)
Tests: Templates API endpoints, CRUD operations, and template creation from dashboards
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestTemplatesFeature:
    """Test Dashboard Template Library API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
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
            self.token = token
        else:
            pytest.skip("Authentication failed - cannot test authenticated endpoints")
    
    def test_get_templates_returns_preset_templates(self):
        """Verify GET /api/templates returns preset templates"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "preset" in data, "Response should contain 'preset' key"
        assert "custom" in data, "Response should contain 'custom' key"
        
        # Verify 10 preset templates exist
        presets = data["preset"]
        assert len(presets) == 10, f"Expected 10 preset templates, got {len(presets)}"
        
    def test_preset_templates_have_required_fields(self):
        """Verify preset templates have all required fields"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        
        presets = response.json()["preset"]
        required_fields = ["id", "name", "description", "icon", "color", "category", "is_preset", "widgets"]
        
        for template in presets:
            for field in required_fields:
                assert field in template, f"Template {template.get('name')} missing field: {field}"
    
    def test_preset_template_categories(self):
        """Verify preset templates cover expected categories"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        
        presets = response.json()["preset"]
        expected_categories = {"sales", "marketing", "customers", "operations", "finance", 
                              "analytics", "executive", "project", "support", "custom"}
        
        actual_categories = {t["category"] for t in presets}
        
        # All preset categories should be in expected list
        for cat in actual_categories:
            assert cat in expected_categories, f"Unexpected category: {cat}"
    
    def test_preset_template_names(self):
        """Verify all 10 preset templates have correct names"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        
        presets = response.json()["preset"]
        expected_names = [
            "Sales Dashboard", "Marketing Analytics", "Customer Insights",
            "Operations Monitor", "Financial Summary", "Web Analytics",
            "Executive Summary", "Project Tracker", "Support Dashboard", "Blank Canvas"
        ]
        
        actual_names = [t["name"] for t in presets]
        for name in expected_names:
            assert name in actual_names, f"Missing preset template: {name}"
    
    def test_create_dashboard_from_preset_template(self):
        """Test creating a dashboard from a preset template"""
        # Get a preset template (Sales Dashboard)
        response = self.session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        
        presets = response.json()["preset"]
        sales_template = next((t for t in presets if t["name"] == "Sales Dashboard"), None)
        assert sales_template is not None, "Sales Dashboard template not found"
        
        # Create dashboard with template widgets
        create_response = self.session.post(f"{BASE_URL}/api/dashboards", json={
            "name": "TEST_Sales_Dashboard_from_Template",
            "description": "Created from Sales Dashboard template",
            "widgets": sales_template["widgets"]
        })
        
        assert create_response.status_code == 200, f"Dashboard creation failed: {create_response.text}"
        dashboard_data = create_response.json()
        assert "id" in dashboard_data, "Response should contain dashboard id"
        
        dashboard_id = dashboard_data["id"]
        
        # Verify dashboard was created
        get_response = self.session.get(f"{BASE_URL}/api/dashboards/{dashboard_id}")
        assert get_response.status_code == 200
        
        # Cleanup - delete test dashboard
        delete_response = self.session.delete(f"{BASE_URL}/api/dashboards/{dashboard_id}")
        assert delete_response.status_code == 200
    
    def test_save_dashboard_as_template(self):
        """Test saving an existing dashboard as a template"""
        # First create a dashboard
        create_dashboard = self.session.post(f"{BASE_URL}/api/dashboards", json={
            "name": "TEST_Dashboard_for_Template",
            "description": "Test dashboard to be saved as template",
            "widgets": [
                {"type": "stat", "title": "Test Metric", "config": {"aggregation": "sum"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
                {"type": "chart", "title": "Test Chart", "config": {"chart_type": "bar"}, "position": {"x": 3, "y": 0, "w": 6, "h": 4}}
            ]
        })
        assert create_dashboard.status_code == 200
        dashboard_id = create_dashboard.json()["id"]
        
        # Save dashboard as template
        save_response = self.session.post(
            f"{BASE_URL}/api/templates/from-dashboard/{dashboard_id}",
            params={"name": "TEST_Custom_Template", "description": "Test custom template"}
        )
        assert save_response.status_code == 200, f"Save as template failed: {save_response.text}"
        
        template_data = save_response.json()
        assert "id" in template_data, "Response should contain template id"
        template_id = template_data["id"]
        
        # Verify template appears in list
        list_response = self.session.get(f"{BASE_URL}/api/templates")
        assert list_response.status_code == 200
        
        custom_templates = list_response.json()["custom"]
        assert any(t["id"] == template_id for t in custom_templates), "Created template not found in custom list"
        
        # Cleanup - delete template and dashboard
        self.session.delete(f"{BASE_URL}/api/templates/{template_id}")
        self.session.delete(f"{BASE_URL}/api/dashboards/{dashboard_id}")
    
    def test_update_custom_template(self):
        """Test updating a custom template"""
        # First create a dashboard and template
        create_dashboard = self.session.post(f"{BASE_URL}/api/dashboards", json={
            "name": "TEST_Dashboard_Update",
            "description": "Test"
        })
        dashboard_id = create_dashboard.json()["id"]
        
        save_response = self.session.post(
            f"{BASE_URL}/api/templates/from-dashboard/{dashboard_id}",
            params={"name": "TEST_Template_Update", "description": "Original description"}
        )
        template_id = save_response.json()["id"]
        
        # Update template
        update_response = self.session.put(f"{BASE_URL}/api/templates/{template_id}", json={
            "name": "TEST_Template_Updated_Name"
        })
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify update persisted
        list_response = self.session.get(f"{BASE_URL}/api/templates")
        custom_templates = list_response.json()["custom"]
        updated_template = next((t for t in custom_templates if t["id"] == template_id), None)
        assert updated_template is not None, "Template not found after update"
        assert updated_template["name"] == "TEST_Template_Updated_Name", "Template name not updated"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/templates/{template_id}")
        self.session.delete(f"{BASE_URL}/api/dashboards/{dashboard_id}")
    
    def test_delete_custom_template(self):
        """Test deleting a custom template"""
        # Create a dashboard and template
        create_dashboard = self.session.post(f"{BASE_URL}/api/dashboards", json={
            "name": "TEST_Dashboard_Delete",
            "description": "Test"
        })
        dashboard_id = create_dashboard.json()["id"]
        
        save_response = self.session.post(
            f"{BASE_URL}/api/templates/from-dashboard/{dashboard_id}",
            params={"name": "TEST_Template_Delete"}
        )
        template_id = save_response.json()["id"]
        
        # Delete template
        delete_response = self.session.delete(f"{BASE_URL}/api/templates/{template_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify deletion
        list_response = self.session.get(f"{BASE_URL}/api/templates")
        custom_templates = list_response.json()["custom"]
        assert not any(t["id"] == template_id for t in custom_templates), "Template still exists after deletion"
        
        # Cleanup dashboard
        self.session.delete(f"{BASE_URL}/api/dashboards/{dashboard_id}")
    
    def test_cannot_delete_preset_template(self):
        """Verify preset templates cannot be deleted by users"""
        # Try to delete a preset template (should fail)
        delete_response = self.session.delete(f"{BASE_URL}/api/templates/preset_sales")
        # Should return 404 because user doesn't own preset templates
        assert delete_response.status_code == 404, "Should not be able to delete preset templates"
    
    def test_template_widgets_preserved(self):
        """Verify widget configurations are preserved when saving as template"""
        # Create dashboard with specific widget config
        widget_config = {
            "type": "chart",
            "title": "Test Chart",
            "config": {"chart_type": "pie", "color": "#ff0000"},
            "position": {"x": 0, "y": 0, "w": 6, "h": 4}
        }
        
        create_dashboard = self.session.post(f"{BASE_URL}/api/dashboards", json={
            "name": "TEST_Dashboard_Widgets",
            "widgets": [widget_config]
        })
        dashboard_id = create_dashboard.json()["id"]
        
        # Save as template
        save_response = self.session.post(
            f"{BASE_URL}/api/templates/from-dashboard/{dashboard_id}",
            params={"name": "TEST_Template_Widgets"}
        )
        template_id = save_response.json()["id"]
        
        # Get templates and verify widget config
        list_response = self.session.get(f"{BASE_URL}/api/templates")
        custom_templates = list_response.json()["custom"]
        template = next((t for t in custom_templates if t["id"] == template_id), None)
        
        assert template is not None, "Template not found"
        assert len(template["widgets"]) > 0, "Template should have widgets"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/templates/{template_id}")
        self.session.delete(f"{BASE_URL}/api/dashboards/{dashboard_id}")


class TestTemplatesCategorization:
    """Test template category filtering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_sales_category_template(self):
        """Verify Sales Dashboard is in sales category"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        presets = response.json()["preset"]
        
        sales_template = next((t for t in presets if t["name"] == "Sales Dashboard"), None)
        assert sales_template is not None
        assert sales_template["category"] == "sales"
    
    def test_marketing_category_template(self):
        """Verify Marketing Analytics is in marketing category"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        presets = response.json()["preset"]
        
        template = next((t for t in presets if t["name"] == "Marketing Analytics"), None)
        assert template is not None
        assert template["category"] == "marketing"
    
    def test_customers_category_template(self):
        """Verify Customer Insights is in customers category"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        presets = response.json()["preset"]
        
        template = next((t for t in presets if t["name"] == "Customer Insights"), None)
        assert template is not None
        assert template["category"] == "customers"
    
    def test_preset_widget_types(self):
        """Verify preset templates use the 12 widget types"""
        response = self.session.get(f"{BASE_URL}/api/templates")
        presets = response.json()["preset"]
        
        expected_widget_types = {"stat", "chart", "table", "gauge", "progress", 
                                 "map", "funnel", "heatmap", "scorecard", "list", 
                                 "timeline", "sparkline"}
        
        # Collect all widget types used in presets
        actual_types = set()
        for template in presets:
            for widget in template.get("widgets", []):
                actual_types.add(widget.get("type"))
        
        # All expected types should be used
        for wtype in expected_widget_types:
            assert wtype in actual_types, f"Widget type '{wtype}' not used in any preset template"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
