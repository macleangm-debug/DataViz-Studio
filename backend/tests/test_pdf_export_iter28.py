"""
Test Export All to PDF Feature (Iteration 28)
Tests the professional PDF export using WeasyPrint backend endpoint
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://viz-preview.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "test@dataviz.com"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestProfessionalPdfExport:
    """Test suite for POST /api/reports/export/professional_pdf endpoint"""
    
    def test_pdf_export_endpoint_exists(self, headers):
        """Test that the professional_pdf endpoint is accessible"""
        # Send empty request to check endpoint
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={"charts": []},
            headers=headers
        )
        # Should return 400 for empty charts, not 404
        assert response.status_code in [400, 422], f"Endpoint returned {response.status_code}"
        print(f"PASS: PDF export endpoint exists and returns proper error for empty charts")
    
    def test_pdf_export_requires_charts(self, headers):
        """Test that endpoint requires charts array"""
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={"charts": []},
            headers=headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "No charts" in response.json().get("detail", ""), "Should mention no charts"
        print("PASS: Endpoint properly rejects empty charts array")
    
    def test_pdf_export_with_mock_chart_data(self, headers):
        """Test PDF generation with mock chart data (base64 image)"""
        # Create a simple 1x1 white PNG (smallest valid PNG)
        # PNG header + IHDR + IDAT + IEND
        simple_white_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        mock_charts = [
            {
                "name": "Test Bar Chart",
                "type": "bar",
                "image_base64": simple_white_png_base64,
                "data": [
                    {"name": "Category A", "value": 100},
                    {"name": "Category B", "value": 200},
                    {"name": "Category C", "value": 150}
                ]
            },
            {
                "name": "Test Line Chart",
                "type": "line",
                "image_base64": simple_white_png_base64,
                "data": [
                    {"name": "Jan", "value": 50},
                    {"name": "Feb", "value": 75},
                    {"name": "Mar", "value": 100}
                ]
            },
            {
                "name": "Test Pie Chart",
                "type": "pie",
                "image_base64": simple_white_png_base64,
                "data": [
                    {"name": "Slice A", "value": 30},
                    {"name": "Slice B", "value": 40},
                    {"name": "Slice C", "value": 30}
                ]
            }
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={
                "charts": mock_charts,
                "title": "Test Chart Report",
                "company_name": "DataViz Studio",
                "include_data_summary": True
            },
            headers=headers,
            timeout=60  # PDF generation may take time
        )
        
        assert response.status_code == 200, f"PDF export failed: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", f"Status not success: {data}"
        assert "pdf_base64" in data, "Missing pdf_base64 in response"
        assert len(data["pdf_base64"]) > 0, "PDF base64 is empty"
        assert data.get("charts_exported") == 3, f"Expected 3 charts, got {data.get('charts_exported')}"
        
        # Verify it's a valid PDF (starts with %PDF after decoding)
        try:
            pdf_bytes = base64.b64decode(data["pdf_base64"])
            assert pdf_bytes[:4] == b'%PDF', "Generated file is not a valid PDF"
            print(f"PASS: PDF generated successfully ({len(pdf_bytes)} bytes, {data.get('pages')} pages)")
        except Exception as e:
            pytest.fail(f"Failed to decode PDF: {e}")
        
        print(f"PASS: PDF export with 3 mock charts works correctly")
    
    def test_pdf_export_includes_data_summary(self, headers):
        """Test that PDF includes data summary page when requested"""
        simple_white_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        mock_charts = [
            {
                "name": "Sales Chart",
                "type": "bar",
                "image_base64": simple_white_png_base64,
                "data": [
                    {"name": "Q1", "value": 1000},
                    {"name": "Q2", "value": 1500},
                    {"name": "Q3", "value": 1200},
                    {"name": "Q4", "value": 1800}
                ]
            }
        ]
        
        # Test with include_data_summary=True
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={
                "charts": mock_charts,
                "title": "Sales Report",
                "include_data_summary": True
            },
            headers=headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("pages") == 2, f"Expected 2 pages (1 chart + 1 summary), got {data.get('pages')}"
        print("PASS: PDF includes data summary page when include_data_summary=True")
    
    def test_pdf_export_without_data_summary(self, headers):
        """Test PDF generation without data summary page"""
        simple_white_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        mock_charts = [
            {
                "name": "Test Chart",
                "type": "bar",
                "image_base64": simple_white_png_base64,
                "data": [{"name": "A", "value": 100}]
            }
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={
                "charts": mock_charts,
                "include_data_summary": False
            },
            headers=headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("pages") == 1, f"Expected 1 page (no summary), got {data.get('pages')}"
        print("PASS: PDF without data summary has correct page count")
    
    def test_pdf_export_multiple_chart_types(self, headers):
        """Test PDF export with all supported chart types"""
        simple_white_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        chart_types = ["bar", "line", "pie", "area", "radar", "funnel", "gauge"]
        mock_charts = []
        
        for chart_type in chart_types:
            mock_charts.append({
                "name": f"Test {chart_type.title()} Chart",
                "type": chart_type,
                "image_base64": simple_white_png_base64,
                "data": [
                    {"name": "A", "value": 100},
                    {"name": "B", "value": 200},
                    {"name": "C", "value": 150}
                ]
            })
        
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={
                "charts": mock_charts,
                "title": "Multiple Chart Types Report",
                "include_data_summary": True
            },
            headers=headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("charts_exported") == len(chart_types)
        print(f"PASS: PDF exported {len(chart_types)} different chart types successfully")
    
    def test_pdf_export_6_charts_per_page_grid(self, headers):
        """Test that 6 charts fit on one page (3 per row grid layout)"""
        simple_white_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        # Create exactly 6 charts
        mock_charts = [
            {
                "name": f"Chart {i+1}",
                "type": "bar",
                "image_base64": simple_white_png_base64,
                "data": [{"name": "A", "value": 100}]
            }
            for i in range(6)
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={
                "charts": mock_charts,
                "include_data_summary": True
            },
            headers=headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        # 6 charts = 1 page + 1 summary page = 2 pages
        assert data.get("pages") == 2, f"Expected 2 pages for 6 charts, got {data.get('pages')}"
        print("PASS: 6 charts fit on 1 page (3-per-row grid layout)")
    
    def test_pdf_export_7_charts_pagination(self, headers):
        """Test that 7 charts spans 2 chart pages + summary page"""
        simple_white_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        # Create 7 charts (should span 2 pages)
        mock_charts = [
            {
                "name": f"Chart {i+1}",
                "type": "bar",
                "image_base64": simple_white_png_base64,
                "data": [{"name": "A", "value": 100}]
            }
            for i in range(7)
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={
                "charts": mock_charts,
                "include_data_summary": True
            },
            headers=headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        # 7 charts = 2 chart pages + 1 summary page = 3 pages
        assert data.get("pages") == 3, f"Expected 3 pages for 7 charts, got {data.get('pages')}"
        print("PASS: 7 charts correctly paginate to 2 chart pages + 1 summary page")
    
    def test_pdf_response_contains_filename(self, headers):
        """Test that PDF response includes filename for download"""
        simple_white_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={
                "charts": [{"name": "Test", "type": "bar", "image_base64": simple_white_png_base64, "data": []}],
                "title": "Test"
            },
            headers=headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "filename" in data, "Missing filename in response"
        assert data["filename"].endswith(".pdf"), "Filename should end with .pdf"
        assert "DataViz" in data["filename"], "Filename should contain DataViz"
        print(f"PASS: PDF response includes valid filename: {data['filename']}")


class TestPdfExportErrorHandling:
    """Test error handling for PDF export"""
    
    def test_pdf_export_requires_auth(self):
        """Test that PDF export requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/reports/export/professional_pdf",
            json={"charts": []},
            headers={"Content-Type": "application/json"}
        )
        # Should require auth (401) or fail validation (422) but not succeed
        assert response.status_code in [401, 422], f"Expected auth error, got {response.status_code}"
        print("PASS: PDF export properly handles missing authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
