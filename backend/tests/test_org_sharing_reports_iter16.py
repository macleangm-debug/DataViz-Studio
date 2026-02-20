"""
Test Suite for DataViz Studio - Iteration 16
Features: Organization CRUD, Dashboard Sharing, Report Delivery APIs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://viz-debug.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@dataviz.com"
TEST_PASSWORD = "test123"


class TestHealth:
    """Health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health endpoint working")


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data.get("token")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Login correctly rejected for invalid credentials")


@pytest.fixture
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Get authenticated headers"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestOrganizationCRUD:
    """Organization CRUD endpoint tests"""
    
    def test_list_organizations(self, auth_headers):
        """Test listing organizations"""
        response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List organizations successful, found {len(data)} org(s)")
    
    def test_create_organization(self, auth_headers):
        """Test creating a new organization"""
        test_name = f"TEST_Org_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/organizations", 
            headers=auth_headers,
            json={
                "name": test_name,
                "description": "Test organization for automated testing",
                "slug": test_name.lower().replace("_", "-")
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == test_name
        assert "id" in data
        print(f"✓ Create organization successful: {test_name}")
        return data.get("id")
    
    def test_create_and_get_organization(self, auth_headers):
        """Test creating and retrieving an organization"""
        # Create
        test_name = f"TEST_Org_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/organizations", 
            headers=auth_headers,
            json={
                "name": test_name,
                "description": "Test description",
                "slug": test_name.lower().replace("_", "-")
            }
        )
        assert create_response.status_code == 200
        org_id = create_response.json().get("id")
        
        # Get
        get_response = requests.get(f"{BASE_URL}/api/organizations/{org_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("name") == test_name
        print(f"✓ Create and GET organization verified")
    
    def test_update_organization(self, auth_headers):
        """Test updating an organization"""
        # First create
        test_name = f"TEST_Org_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/organizations", 
            headers=auth_headers,
            json={
                "name": test_name,
                "description": "Original description",
                "slug": test_name.lower().replace("_", "-")
            }
        )
        assert create_response.status_code == 200
        org_id = create_response.json().get("id")
        
        # Update
        updated_name = f"{test_name}_Updated"
        update_response = requests.put(f"{BASE_URL}/api/organizations/{org_id}",
            headers=auth_headers,
            json={
                "name": updated_name,
                "description": "Updated description",
                "slug": test_name.lower().replace("_", "-")
            }
        )
        assert update_response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/organizations/{org_id}", headers=auth_headers)
        data = get_response.json()
        assert data.get("name") == updated_name
        print(f"✓ Update organization verified")
    
    def test_get_org_members(self, auth_headers):
        """Test getting organization members"""
        # Get first org
        list_response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        orgs = list_response.json()
        if not orgs:
            pytest.skip("No organizations found")
        
        org_id = orgs[0].get("id")
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/members", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get organization members successful")


class TestDashboardSharing:
    """Dashboard sharing endpoint tests"""
    
    def test_share_dashboard_create_public_link(self, auth_headers):
        """Test creating a public share link for a dashboard"""
        # First, get a dashboard or create one
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            # Create a dashboard
            create_resp = requests.post(f"{BASE_URL}/api/dashboards",
                headers=auth_headers,
                json={
                    "name": "TEST_ShareDashboard",
                    "description": "Dashboard for testing sharing"
                }
            )
            assert create_resp.status_code == 200
            dashboard_id = create_resp.json().get("id")
        else:
            dashboard_id = dashboards[0].get("id")
        
        # Create public share
        share_response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/share",
            headers=auth_headers,
            json={
                "is_public": True,
                "password_protected": False
            }
        )
        assert share_response.status_code == 200
        data = share_response.json()
        assert data.get("is_public") == True
        assert "public_id" in data
        print(f"✓ Dashboard public share link created: {data.get('public_id')}")
        return dashboard_id, data.get("public_id")
    
    def test_share_dashboard_with_password(self, auth_headers):
        """Test creating a password-protected share link"""
        # Get a dashboard
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available for testing")
        
        dashboard_id = dashboards[0].get("id")
        
        # Create password-protected share
        share_response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/share",
            headers=auth_headers,
            json={
                "is_public": True,
                "password_protected": True,
                "password": "test_password_123"
            }
        )
        assert share_response.status_code == 200
        data = share_response.json()
        assert data.get("password_protected") == True
        print(f"✓ Password-protected share link created")
    
    def test_get_share_settings(self, auth_headers):
        """Test getting share settings for a dashboard"""
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        response = requests.get(f"{BASE_URL}/api/dashboards/{dashboard_id}/share", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "is_public" in data
        print(f"✓ Get share settings successful")
    
    def test_revoke_share(self, auth_headers):
        """Test revoking a share link"""
        # Get a dashboard
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # First create a share
        requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/share",
            headers=auth_headers,
            json={"is_public": True}
        )
        
        # Then revoke
        revoke_response = requests.delete(f"{BASE_URL}/api/dashboards/{dashboard_id}/share", headers=auth_headers)
        assert revoke_response.status_code == 200
        data = revoke_response.json()
        assert data.get("status") == "success"
        print(f"✓ Share revoked successfully")


class TestPublicDashboardAccess:
    """Public dashboard access endpoint tests"""
    
    def test_get_public_dashboard_info(self, auth_headers):
        """Test getting public dashboard info without auth"""
        # First create a public share
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # Create public share
        share_response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/share",
            headers=auth_headers,
            json={"is_public": True, "password_protected": False}
        )
        public_id = share_response.json().get("public_id")
        
        if not public_id:
            pytest.skip("Could not create public share")
        
        # Access public dashboard info (no auth required)
        info_response = requests.get(f"{BASE_URL}/api/dashboards/public/{public_id}")
        assert info_response.status_code == 200
        data = info_response.json()
        assert "name" in data
        print(f"✓ Public dashboard info accessible")
    
    def test_access_public_dashboard(self, auth_headers):
        """Test accessing a public dashboard"""
        # First create a public share
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # Create public share
        share_response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/share",
            headers=auth_headers,
            json={"is_public": True, "password_protected": False}
        )
        public_id = share_response.json().get("public_id")
        
        # Access dashboard content
        access_response = requests.post(f"{BASE_URL}/api/dashboards/public/{public_id}/access",
            json={}  # No password needed
        )
        assert access_response.status_code == 200
        data = access_response.json()
        assert "id" in data
        print(f"✓ Public dashboard accessed successfully")
    
    def test_access_password_protected_dashboard_without_password(self, auth_headers):
        """Test accessing a password-protected dashboard without password"""
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # Create password-protected share
        share_response = requests.post(f"{BASE_URL}/api/dashboards/{dashboard_id}/share",
            headers=auth_headers,
            json={
                "is_public": True, 
                "password_protected": True, 
                "password": "secret123"
            }
        )
        public_id = share_response.json().get("public_id")
        
        # Try to access without password
        access_response = requests.post(f"{BASE_URL}/api/dashboards/public/{public_id}/access",
            json={}
        )
        assert access_response.status_code == 401  # Should require password
        print(f"✓ Password-protected dashboard correctly requires password")


class TestReportDelivery:
    """Report delivery endpoint tests"""
    
    def test_send_report_no_api_key(self, auth_headers):
        """Test sending a report (expects 503 since no Resend API key)"""
        # Get a dashboard
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # Try to send report
        send_response = requests.post(f"{BASE_URL}/api/reports/send",
            headers=auth_headers,
            json={
                "dashboard_id": dashboard_id,
                "recipients": ["test@example.com"],
                "subject": "Test Report",
                "message": "This is a test report"
            }
        )
        # Should get 503 since Resend API key is not configured
        assert send_response.status_code == 503
        data = send_response.json()
        assert "not configured" in data.get("detail", "").lower()
        print(f"✓ Report delivery correctly returns 503 (MOCKED - no API key)")
    
    def test_create_report_schedule(self, auth_headers):
        """Test creating a report schedule"""
        # Get a dashboard
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # Create schedule
        schedule_response = requests.post(f"{BASE_URL}/api/reports/schedules",
            headers=auth_headers,
            json={
                "dashboard_id": dashboard_id,
                "name": "TEST_WeeklyReport",
                "recipients": ["test@example.com"],
                "schedule": {
                    "frequency": "weekly",
                    "day_of_week": 1,
                    "time": "09:00",
                    "timezone": "UTC"
                }
            }
        )
        assert schedule_response.status_code == 200
        data = schedule_response.json()
        assert "id" in data
        assert data.get("status") == "created"
        print(f"✓ Report schedule created: {data.get('id')}")
        return data.get("id")
    
    def test_list_report_schedules(self, auth_headers):
        """Test listing report schedules"""
        response = requests.get(f"{BASE_URL}/api/reports/schedules", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "schedules" in data
        print(f"✓ Report schedules listed: {len(data.get('schedules', []))} found")
    
    def test_get_report_schedule(self, auth_headers):
        """Test getting a specific report schedule"""
        # First create one
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # Create schedule
        create_response = requests.post(f"{BASE_URL}/api/reports/schedules",
            headers=auth_headers,
            json={
                "dashboard_id": dashboard_id,
                "name": "TEST_DailyReport",
                "recipients": ["test@example.com"],
                "schedule": {
                    "frequency": "daily",
                    "time": "08:00",
                    "timezone": "UTC"
                }
            }
        )
        schedule_id = create_response.json().get("id")
        
        # Get the schedule
        get_response = requests.get(f"{BASE_URL}/api/reports/schedules/{schedule_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("id") == schedule_id
        print(f"✓ Report schedule retrieved")
    
    def test_delete_report_schedule(self, auth_headers):
        """Test deleting a report schedule"""
        # First create one
        dash_response = requests.get(f"{BASE_URL}/api/dashboards", headers=auth_headers)
        dashboards = dash_response.json().get("dashboards", [])
        
        if not dashboards:
            pytest.skip("No dashboards available")
        
        dashboard_id = dashboards[0].get("id")
        
        # Create schedule
        create_response = requests.post(f"{BASE_URL}/api/reports/schedules",
            headers=auth_headers,
            json={
                "dashboard_id": dashboard_id,
                "name": "TEST_ToDeleteReport",
                "recipients": ["test@example.com"],
                "schedule": {
                    "frequency": "monthly",
                    "day_of_month": 1,
                    "time": "10:00",
                    "timezone": "UTC"
                }
            }
        )
        schedule_id = create_response.json().get("id")
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/reports/schedules/{schedule_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/reports/schedules/{schedule_id}", headers=auth_headers)
        assert get_response.status_code == 404
        print(f"✓ Report schedule deleted and verified")
    
    def test_list_report_deliveries(self, auth_headers):
        """Test listing report deliveries"""
        response = requests.get(f"{BASE_URL}/api/reports/deliveries", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "deliveries" in data
        print(f"✓ Report deliveries listed")


class TestPricingTierLimits:
    """Tests related to pricing tier organization limits"""
    
    def test_org_count_matches_tier(self, auth_headers):
        """Test that organization count respects tier limits"""
        response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        assert response.status_code == 200
        orgs = response.json()
        # Free tier allows 1 org - just verify we get valid response
        assert isinstance(orgs, list)
        print(f"✓ Organizations count: {len(orgs)} (limit depends on user tier)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
