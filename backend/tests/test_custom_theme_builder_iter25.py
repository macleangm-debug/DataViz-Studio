"""
Custom Theme Builder Feature Tests - Iteration 25
Tests for the Custom Chart Theme Builder in Chart Studio:
- Theme CRUD operations (Create, Read, Update, Delete)
- Tier-based limits (Free: 3, Pro: 10, Enterprise: Unlimited)
- Preset themes API
- Theme application to charts
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@dataviz.com"
TEST_PASSWORD = "test123"


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Login successful - User: {data['user']['email']}")


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Authenticated headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestPresetThemes:
    """Tests for GET /api/themes/presets"""
    
    def test_get_preset_themes_success(self):
        """Test fetching preset themes - no auth required"""
        response = requests.get(f"{BASE_URL}/api/themes/presets")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "themes" in data
        print(f"Preset themes count: {len(data['themes'])}")
    
    def test_preset_themes_count(self):
        """Test that exactly 10 preset themes are returned"""
        response = requests.get(f"{BASE_URL}/api/themes/presets")
        assert response.status_code == 200
        data = response.json()
        assert len(data["themes"]) == 10, f"Expected 10 themes, got {len(data['themes'])}"
        print("PASS: 10 preset themes returned")
    
    def test_preset_themes_structure(self):
        """Test preset theme structure has required fields"""
        response = requests.get(f"{BASE_URL}/api/themes/presets")
        assert response.status_code == 200
        data = response.json()
        
        for theme in data["themes"]:
            assert "id" in theme, f"Missing 'id' in theme: {theme}"
            assert "name" in theme, f"Missing 'name' in theme: {theme}"
            assert "colors" in theme, f"Missing 'colors' in theme: {theme}"
            assert isinstance(theme["colors"], list), f"'colors' should be a list"
            assert len(theme["colors"]) >= 5, f"Theme should have at least 5 colors"
        print("PASS: All preset themes have required fields")
    
    def test_preset_theme_ids(self):
        """Test expected preset theme IDs exist"""
        response = requests.get(f"{BASE_URL}/api/themes/presets")
        assert response.status_code == 200
        data = response.json()
        
        expected_ids = ["violet", "ocean", "sunset", "forest", "rose", "midnight", "corporate", "warm", "cool", "neon"]
        actual_ids = [t["id"] for t in data["themes"]]
        
        for expected_id in expected_ids:
            assert expected_id in actual_ids, f"Missing theme: {expected_id}"
        print(f"PASS: All expected theme IDs found: {expected_ids}")


class TestCustomThemesGet:
    """Tests for GET /api/themes/custom"""
    
    def test_get_custom_themes_requires_auth(self):
        """Test that custom themes endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/themes/custom")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Custom themes requires authentication")
    
    def test_get_custom_themes_success(self, auth_headers):
        """Test fetching user's custom themes"""
        response = requests.get(f"{BASE_URL}/api/themes/custom", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "themes" in data
        assert "count" in data
        assert "limit" in data
        assert "can_create_more" in data
        print(f"Custom themes - Count: {data['count']}, Limit: {data['limit']}, Can create more: {data['can_create_more']}")
    
    def test_custom_themes_limit_for_pro_tier(self, auth_headers):
        """Test that Pro tier has limit of 10 custom themes"""
        response = requests.get(f"{BASE_URL}/api/themes/custom", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Pro tier should have limit of 10
        assert data["limit"] == 10, f"Expected limit of 10 for Pro tier, got {data['limit']}"
        print("PASS: Pro tier has correct limit of 10 custom themes")


class TestCustomThemesCreate:
    """Tests for POST /api/themes/custom"""
    
    def test_create_theme_requires_auth(self):
        """Test that creating a theme requires authentication"""
        theme_data = {
            "name": "Test Theme",
            "colors": ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]
        }
        response = requests.post(f"{BASE_URL}/api/themes/custom", json=theme_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Create theme requires authentication")
    
    def test_create_custom_theme_success(self, auth_headers):
        """Test creating a new custom theme"""
        theme_data = {
            "name": f"Test Theme {uuid.uuid4().hex[:8]}",
            "colors": ["#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#fecdd3"],
            "background": "#ffffff",
            "textColor": "#1f2937"
        }
        response = requests.post(
            f"{BASE_URL}/api/themes/custom",
            json=theme_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "theme" in data
        assert "id" in data["theme"]
        assert data["theme"]["name"] == theme_data["name"]
        assert data["theme"]["colors"] == theme_data["colors"]
        print(f"PASS: Custom theme created - ID: {data['theme']['id']}, Name: {data['theme']['name']}")
        
        # Return theme ID for cleanup
        return data["theme"]["id"]
    
    def test_create_theme_with_5_colors(self, auth_headers):
        """Test creating theme with minimum 5 colors"""
        theme_data = {
            "name": f"Five Color Theme {uuid.uuid4().hex[:8]}",
            "colors": ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#6d28d9"]
        }
        response = requests.post(
            f"{BASE_URL}/api/themes/custom",
            json=theme_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert len(data["theme"]["colors"]) == 5
        print("PASS: Created theme with 5 colors")
        return data["theme"]["id"]
    
    def test_create_theme_with_8_colors(self, auth_headers):
        """Test creating theme with maximum 8 colors"""
        theme_data = {
            "name": f"Eight Color Theme {uuid.uuid4().hex[:8]}",
            "colors": ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#6d28d9", "#f97316", "#22c55e", "#06b6d4"]
        }
        response = requests.post(
            f"{BASE_URL}/api/themes/custom",
            json=theme_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert len(data["theme"]["colors"]) == 8
        print("PASS: Created theme with 8 colors")
        return data["theme"]["id"]


class TestCustomThemesUpdate:
    """Tests for PUT /api/themes/custom/{id}"""
    
    def test_update_theme_requires_auth(self):
        """Test that updating a theme requires authentication"""
        theme_data = {
            "name": "Updated Theme",
            "colors": ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]
        }
        response = requests.put(
            f"{BASE_URL}/api/themes/custom/fake-id",
            json=theme_data
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Update theme requires authentication")
    
    def test_update_custom_theme_success(self, auth_headers):
        """Test updating an existing custom theme"""
        # First create a theme
        create_data = {
            "name": f"Theme To Update {uuid.uuid4().hex[:8]}",
            "colors": ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#6d28d9"]
        }
        create_response = requests.post(
            f"{BASE_URL}/api/themes/custom",
            json=create_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        theme_id = create_response.json()["theme"]["id"]
        
        # Now update it
        update_data = {
            "name": f"Updated Theme Name {uuid.uuid4().hex[:8]}",
            "colors": ["#f97316", "#fb923c", "#fdba74", "#ea580c", "#c2410c"]
        }
        update_response = requests.put(
            f"{BASE_URL}/api/themes/custom/{theme_id}",
            json=update_data,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"Failed: {update_response.text}"
        print(f"PASS: Custom theme updated - ID: {theme_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/themes/custom/{theme_id}", headers=auth_headers)
    
    def test_update_nonexistent_theme(self, auth_headers):
        """Test updating a theme that doesn't exist"""
        update_data = {
            "name": "Nonexistent Theme",
            "colors": ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]
        }
        response = requests.put(
            f"{BASE_URL}/api/themes/custom/nonexistent-id-12345",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Update nonexistent theme returns 404")


class TestCustomThemesDelete:
    """Tests for DELETE /api/themes/custom/{id}"""
    
    def test_delete_theme_requires_auth(self):
        """Test that deleting a theme requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/themes/custom/fake-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Delete theme requires authentication")
    
    def test_delete_custom_theme_success(self, auth_headers):
        """Test deleting a custom theme"""
        # First create a theme
        create_data = {
            "name": f"Theme To Delete {uuid.uuid4().hex[:8]}",
            "colors": ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#6d28d9"]
        }
        create_response = requests.post(
            f"{BASE_URL}/api/themes/custom",
            json=create_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        theme_id = create_response.json()["theme"]["id"]
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/themes/custom/{theme_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Failed: {delete_response.text}"
        print(f"PASS: Custom theme deleted - ID: {theme_id}")
        
        # Verify deletion by trying to get custom themes
        get_response = requests.get(f"{BASE_URL}/api/themes/custom", headers=auth_headers)
        themes = get_response.json()["themes"]
        theme_ids = [t["id"] for t in themes]
        assert theme_id not in theme_ids, "Theme should be deleted"
        print("PASS: Theme confirmed deleted from list")
    
    def test_delete_nonexistent_theme(self, auth_headers):
        """Test deleting a theme that doesn't exist"""
        response = requests.delete(
            f"{BASE_URL}/api/themes/custom/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Delete nonexistent theme returns 404")


class TestThemeLimits:
    """Tests for tier-based theme limits"""
    
    def test_get_tier_info(self, auth_headers):
        """Test getting user tier information"""
        response = requests.get(f"{BASE_URL}/api/user/tier-info", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "tier" in data
        assert "limits" in data
        assert "custom_themes_limit" in data["limits"]
        print(f"User tier: {data['tier']}, Custom themes limit: {data['limits']['custom_themes_limit']}")
    
    def test_custom_themes_usage_stats(self, auth_headers):
        """Test custom themes usage in tier info"""
        response = requests.get(f"{BASE_URL}/api/user/tier-info", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        if "usage" in data and "custom_themes" in data["usage"]:
            usage = data["usage"]["custom_themes"]
            assert "used" in usage
            assert "limit" in usage
            print(f"Custom themes usage: {usage['used']}/{usage['limit']}")


class TestThemeIntegration:
    """Integration tests for theme workflow"""
    
    def test_full_theme_crud_workflow(self, auth_headers):
        """Test complete Create -> Read -> Update -> Delete workflow"""
        unique_id = uuid.uuid4().hex[:8]
        
        # CREATE
        create_data = {
            "name": f"Integration Test Theme {unique_id}",
            "colors": ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#6d28d9"],
            "background": "#ffffff",
            "textColor": "#1f2937"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/themes/custom",
            json=create_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        theme_id = create_response.json()["theme"]["id"]
        print(f"1. CREATE: Theme created - ID: {theme_id}")
        
        # READ - Verify theme exists
        get_response = requests.get(f"{BASE_URL}/api/themes/custom", headers=auth_headers)
        assert get_response.status_code == 200
        themes = get_response.json()["themes"]
        theme_ids = [t["id"] for t in themes]
        assert theme_id in theme_ids, "Created theme should be in list"
        print(f"2. READ: Theme found in list")
        
        # UPDATE
        update_data = {
            "name": f"Updated Integration Test {unique_id}",
            "colors": ["#f97316", "#fb923c", "#fdba74", "#ea580c", "#c2410c", "#d97706"],  # 6 colors now
            "background": "#fffbeb",
            "textColor": "#451a03"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/themes/custom/{theme_id}",
            json=update_data,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        print(f"3. UPDATE: Theme updated successfully")
        
        # DELETE
        delete_response = requests.delete(
            f"{BASE_URL}/api/themes/custom/{theme_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print(f"4. DELETE: Theme deleted successfully")
        
        # Verify deletion
        final_get = requests.get(f"{BASE_URL}/api/themes/custom", headers=auth_headers)
        final_themes = final_get.json()["themes"]
        final_theme_ids = [t["id"] for t in final_themes]
        assert theme_id not in final_theme_ids, "Deleted theme should not be in list"
        print(f"5. VERIFY: Theme confirmed deleted")
        
        print("PASS: Full CRUD workflow completed successfully")


class TestCleanup:
    """Cleanup test data after tests"""
    
    def test_cleanup_test_themes(self, auth_headers):
        """Clean up any test themes created during testing"""
        response = requests.get(f"{BASE_URL}/api/themes/custom", headers=auth_headers)
        if response.status_code == 200:
            themes = response.json()["themes"]
            deleted_count = 0
            for theme in themes:
                if "Test" in theme.get("name", "") or "Integration" in theme.get("name", ""):
                    delete_resp = requests.delete(
                        f"{BASE_URL}/api/themes/custom/{theme['id']}",
                        headers=auth_headers
                    )
                    if delete_resp.status_code == 200:
                        deleted_count += 1
            print(f"Cleanup: Deleted {deleted_count} test themes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
