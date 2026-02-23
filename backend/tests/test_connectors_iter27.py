"""
Test Data Source Connectors - S3 and Google OAuth
Tests the connector features for DataViz Studio iteration 27

Features tested:
1. AWS S3 connector connection flow with credential input
2. S3 connector returns proper error for invalid credentials
3. Google Sheets OAuth connector initialization
4. List connections endpoint
5. Delete connection endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "test@dataviz.com"
TEST_USER_PASSWORD = "test123"


class TestConnectorsAuth:
    """Test authentication helper"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get authenticated headers"""
        return {"Authorization": f"Bearer {auth_token}"}


class TestS3Connector(TestConnectorsAuth):
    """AWS S3 connector tests"""
    
    def test_s3_test_connection_invalid_credentials(self, auth_headers):
        """
        Test S3 test connection endpoint with invalid credentials
        Expected: Returns error status with AWS InvalidAccessKeyId error
        """
        response = requests.post(
            f"{BASE_URL}/api/connectors/s3/test",
            json={
                "access_key_id": "AKIAIOSFODNN7EXAMPLE",
                "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                "region": "us-east-1"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Test connection endpoint failed: {response.text}"
        data = response.json()
        
        # Should return error status for invalid credentials
        assert data.get("status") == "error", f"Expected error status, got: {data}"
        assert "message" in data, "Error message missing"
        # AWS returns InvalidAccessKeyId error for fake credentials
        assert "InvalidAccessKeyId" in data["message"] or "Invalid" in data["message"], \
            f"Expected AWS credential error, got: {data['message']}"
        print(f"PASS: S3 test connection returned proper error: {data['message']}")
    
    def test_s3_connect_invalid_credentials(self, auth_headers):
        """
        Test S3 connect endpoint with invalid credentials
        Expected: Returns 400 error
        """
        response = requests.post(
            f"{BASE_URL}/api/connectors/s3/connect",
            json={
                "name": "Test S3 Connection",
                "access_key_id": "AKIAIOSFODNN7EXAMPLE",
                "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                "region": "us-east-1"
            },
            headers=auth_headers
        )
        
        # Should return 400 because credentials are invalid
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, "Error detail missing"
        print(f"PASS: S3 connect properly rejected invalid credentials: {data['detail']}")
    
    def test_s3_generic_connect_invalid_credentials(self, auth_headers):
        """
        Test generic connect endpoint with S3 type and invalid credentials
        Expected: Returns 400 error
        """
        response = requests.post(
            f"{BASE_URL}/api/connectors/connect",
            json={
                "connector_type": "aws_s3",
                "name": "Test S3 via Generic",
                "config": {
                    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
                    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                    "region": "us-east-1"
                }
            },
            headers=auth_headers
        )
        
        # Should return 400 because credentials are invalid
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print(f"PASS: Generic connect properly rejected invalid S3 credentials")


class TestGoogleConnector(TestConnectorsAuth):
    """Google Sheets/Drive OAuth connector tests"""
    
    def test_google_oauth_init(self, auth_headers):
        """
        Test Google OAuth initialization
        Expected: Returns auth_url and state
        """
        response = requests.post(
            f"{BASE_URL}/api/connectors/google/oauth/init",
            json={
                "client_id": "test-client-id.apps.googleusercontent.com",
                "client_secret": "GOCSPX-test-secret",
                "redirect_uri": "https://example.com/callback",
                "connector_type": "google_sheets"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"OAuth init failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "auth_url" in data, "auth_url missing from response"
        assert "state" in data, "state missing from response"
        
        # Verify auth_url is valid Google OAuth URL
        assert "accounts.google.com" in data["auth_url"], "Invalid OAuth URL"
        assert "client_id" in data["auth_url"], "client_id not in OAuth URL"
        assert data["client_id"] in data["auth_url"] if "client_id" in data else True
        
        print(f"PASS: Google OAuth init returned valid auth URL and state")
        print(f"  - State: {data['state'][:20]}...")
        print(f"  - Auth URL starts with: {data['auth_url'][:60]}...")
    
    def test_google_generic_connect_requires_oauth(self, auth_headers):
        """
        Test generic connect endpoint with Google type
        Expected: Returns oauth_required status
        """
        response = requests.post(
            f"{BASE_URL}/api/connectors/connect",
            json={
                "connector_type": "google_sheets",
                "name": "Test Google Sheets"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Request failed: {response.text}"
        data = response.json()
        
        # Should return oauth_required status
        assert data.get("status") == "oauth_required", f"Expected oauth_required status, got: {data}"
        assert "oauth" in data.get("message", "").lower() or "OAuth" in data.get("message", ""), \
            f"Message should mention OAuth: {data.get('message')}"
        
        print(f"PASS: Generic connect for Google correctly returns oauth_required")


class TestConnectionsManagement(TestConnectorsAuth):
    """Test connections listing and management"""
    
    def test_list_connections(self, auth_headers):
        """
        Test listing all connections for the user
        Expected: Returns list of connections (may be empty)
        """
        response = requests.get(
            f"{BASE_URL}/api/connectors",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"List connections failed: {response.text}"
        data = response.json()
        
        assert "connections" in data, "connections key missing from response"
        assert isinstance(data["connections"], list), "connections should be a list"
        
        print(f"PASS: List connections returned {len(data['connections'])} connections")
        for conn in data["connections"][:3]:
            print(f"  - {conn.get('name', 'Unknown')} ({conn.get('type', 'unknown')})")
    
    def test_list_connections_filtered(self, auth_headers):
        """
        Test listing connections filtered by type
        """
        response = requests.get(
            f"{BASE_URL}/api/connectors?connector_type=aws_s3",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Filtered list failed: {response.text}"
        data = response.json()
        
        assert "connections" in data, "connections key missing"
        # All returned connections should be aws_s3 type
        for conn in data["connections"]:
            assert conn.get("type") == "aws_s3", f"Unexpected connection type: {conn.get('type')}"
        
        print(f"PASS: Filtered connections returned only aws_s3 type ({len(data['connections'])} found)")
    
    def test_delete_nonexistent_connection(self, auth_headers):
        """
        Test deleting a connection that doesn't exist
        Expected: Returns 404
        """
        response = requests.delete(
            f"{BASE_URL}/api/connectors/nonexistent-connection-id",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Delete nonexistent connection properly returns 404")


class TestConnectorsEndpointsAvailability(TestConnectorsAuth):
    """Test that all connector endpoints are available"""
    
    def test_s3_buckets_endpoint_requires_valid_connection(self, auth_headers):
        """
        Test S3 buckets endpoint with invalid connection ID
        Expected: Returns 400 or 404
        """
        response = requests.get(
            f"{BASE_URL}/api/connectors/s3/fake-connection-id/buckets",
            headers=auth_headers
        )
        
        # Should fail because connection doesn't exist
        assert response.status_code in [400, 404], \
            f"Expected 400 or 404, got {response.status_code}: {response.text}"
        print(f"PASS: S3 buckets endpoint properly validates connection ID")
    
    def test_s3_files_endpoint_requires_valid_connection(self, auth_headers):
        """
        Test S3 files endpoint with invalid connection ID
        """
        response = requests.get(
            f"{BASE_URL}/api/connectors/s3/fake-connection-id/files?bucket=test-bucket",
            headers=auth_headers
        )
        
        assert response.status_code in [400, 404], \
            f"Expected 400 or 404, got {response.status_code}"
        print(f"PASS: S3 files endpoint properly validates connection ID")
    
    def test_google_spreadsheets_endpoint_requires_valid_connection(self, auth_headers):
        """
        Test Google spreadsheets endpoint with invalid connection ID
        """
        response = requests.get(
            f"{BASE_URL}/api/connectors/google/fake-connection-id/spreadsheets",
            headers=auth_headers
        )
        
        assert response.status_code in [400, 404], \
            f"Expected 400 or 404, got {response.status_code}"
        print(f"PASS: Google spreadsheets endpoint properly validates connection ID")


class TestUnauthorizedAccess:
    """Test endpoints require authentication"""
    
    def test_connectors_list_require_auth(self):
        """Test that GET connectors endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/connectors")
        assert response.status_code == 401, \
            f"GET connectors should require auth, got {response.status_code}"
        print(f"PASS: GET /api/connectors properly requires authentication")
    
    def test_s3_test_requires_auth(self):
        """Test that S3 test endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/connectors/s3/test",
            json={
                "access_key_id": "test",
                "secret_access_key": "test",
                "region": "us-east-1"
            }
        )
        assert response.status_code == 401, \
            f"POST s3/test should require auth, got {response.status_code}"
        print(f"PASS: POST /api/connectors/s3/test properly requires authentication")
    
    def test_google_oauth_init_requires_auth(self):
        """Test that Google OAuth init requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/connectors/google/oauth/init",
            json={
                "client_id": "test",
                "client_secret": "test",
                "redirect_uri": "https://test.com",
                "connector_type": "google_sheets"
            }
        )
        assert response.status_code == 401, \
            f"POST google/oauth/init should require auth, got {response.status_code}"
        print(f"PASS: POST /api/connectors/google/oauth/init properly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
