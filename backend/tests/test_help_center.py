"""
Help Center & AI Assistant API Tests - Iteration 12
Tests: GET /api/health, POST /api/help/assistant
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://help-center-ai.preview.emergentagent.com').rstrip('/')

class TestHealth:
    """Health check tests"""
    
    def test_api_health_check(self):
        """Test that the API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")


class TestHelpAssistant:
    """Help Center AI Assistant tests"""
    
    def test_help_assistant_simple_question(self):
        """Test AI assistant responds to simple question"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "How do I create a dashboard?", "conversation_history": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "status" in data
        assert data["status"] in ["success", "fallback"]
        assert len(data["response"]) > 0
        print(f"✓ Simple question response received: {len(data['response'])} chars, status: {data['status']}")
        
    def test_help_assistant_template_question(self):
        """Test AI assistant responds to template question"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "How do I use templates?", "conversation_history": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "template" in data["response"].lower() or "dashboard" in data["response"].lower()
        print(f"✓ Template question answered correctly, status: {data['status']}")
        
    def test_help_assistant_chart_question(self):
        """Test AI assistant responds to chart question"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "What chart types are available?", "conversation_history": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Response should mention chart types
        response_lower = data["response"].lower()
        has_chart_info = any(word in response_lower for word in ["bar", "line", "pie", "chart", "scatter", "area"])
        assert has_chart_info, "Response should mention chart types"
        print(f"✓ Chart types question answered, status: {data['status']}")
        
    def test_help_assistant_export_question(self):
        """Test AI assistant responds to PDF export question"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "How do I export to PDF?", "conversation_history": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        response_lower = data["response"].lower()
        has_pdf_info = "pdf" in response_lower or "export" in response_lower
        assert has_pdf_info, "Response should mention PDF/export"
        print(f"✓ PDF export question answered, status: {data['status']}")
        
    def test_help_assistant_with_conversation_history(self):
        """Test AI assistant handles conversation history"""
        history = [
            {"role": "user", "content": "What is DataViz Studio?"},
            {"role": "assistant", "content": "DataViz Studio is a data visualization platform."}
        ]
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={
                "message": "Tell me more about dashboards",
                "conversation_history": history
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Conversation with history handled, status: {data['status']}")
        
    def test_help_assistant_widget_question(self):
        """Test AI assistant responds to widget question"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "What widget types can I add to dashboards?", "conversation_history": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        response_lower = data["response"].lower()
        has_widget_info = any(word in response_lower for word in ["widget", "stat", "chart", "table", "gauge"])
        assert has_widget_info, "Response should mention widget types"
        print(f"✓ Widget types question answered, status: {data['status']}")
        
    def test_help_assistant_data_upload_question(self):
        """Test AI assistant responds to data upload question"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "How do I upload data?", "conversation_history": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        response_lower = data["response"].lower()
        has_upload_info = any(word in response_lower for word in ["upload", "csv", "data", "file"])
        assert has_upload_info, "Response should mention data upload"
        print(f"✓ Data upload question answered, status: {data['status']}")
        
    def test_help_assistant_empty_message_handled(self):
        """Test AI assistant handles empty message gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "", "conversation_history": []}
        )
        # Should return 200 with a fallback or error message, not crash
        assert response.status_code in [200, 400, 422]
        print(f"✓ Empty message handled, status code: {response.status_code}")


class TestAuthenticationForHelp:
    """Test that help assistant works with and without auth"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for testing"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@dataviz.com", "password": "test123"}
        )
        if response.status_code == 200:
            return response.json().get("token")
        return None
        
    def test_help_assistant_without_auth(self):
        """Test help assistant works without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "Help me with reports", "conversation_history": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Help assistant works without auth")
        
    def test_help_assistant_with_auth(self, auth_token):
        """Test help assistant works with authentication"""
        if not auth_token:
            pytest.skip("Could not get auth token")
            
        response = requests.post(
            f"{BASE_URL}/api/help/assistant",
            json={"message": "How do I transform data?", "conversation_history": []},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Help assistant works with auth token")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
