"""
Test AI Executive Summary Feature - Iteration 23
Tests the generate-summary and summary-status endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://report-render-lab.preview.emergentagent.com').rstrip('/')


class TestAISummaryEndpoints:
    """Tests for AI Executive Summary feature endpoints"""
    
    def test_summary_status_endpoint(self):
        """GET /api/reports/summary-status - should return AI availability status"""
        response = requests.get(f"{BASE_URL}/api/reports/summary-status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "ai_available" in data, "Missing 'ai_available' field"
        assert "fallback_available" in data, "Missing 'fallback_available' field"
        assert "provider" in data, "Missing 'provider' field"
        
        # Fallback should always be available
        assert data["fallback_available"] == True, "Fallback should always be available"
        
        # If AI is available, provider should be OpenAI
        if data["ai_available"]:
            assert "OpenAI" in data["provider"] or "GPT" in data["provider"], \
                f"Provider should mention OpenAI when AI is available, got: {data['provider']}"
        else:
            assert "Template" in data["provider"], \
                f"Provider should mention Template when AI is unavailable, got: {data['provider']}"
        
        print(f"Summary Status: AI Available={data['ai_available']}, Provider={data['provider']}")
    
    def test_generate_summary_with_valid_data_professional_tone(self):
        """POST /api/reports/generate-summary - test with professional tone"""
        payload = {
            "reportTitle": "Q4 2025 Sales Report",
            "reportSubtitle": "Quarterly Performance Analysis",
            "sections": [
                {
                    "type": "stat_cards",
                    "title": "Key Metrics",
                    "stats": [
                        {"value": "44%", "label": "Revenue Growth YoY"},
                        {"value": "$2.5M", "label": "Total Revenue"},
                        {"value": "32%", "label": "Market Share"},
                        {"value": "95%", "label": "Customer Satisfaction"}
                    ]
                },
                {
                    "type": "bar_chart",
                    "title": "Revenue by Region",
                    "chartData": [
                        {"name": "North", "value": 850000},
                        {"name": "South", "value": 620000},
                        {"name": "East", "value": 540000},
                        {"name": "West", "value": 490000}
                    ]
                },
                {
                    "type": "intro",
                    "title": "Executive Overview",
                    "content": "This report presents the quarterly sales performance analysis with key insights into regional distribution and growth trends."
                }
            ],
            "tone": "professional",
            "length": "medium"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-summary",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60  # AI requests can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "summary" in data, "Missing 'summary' field"
        assert "keyInsights" in data, "Missing 'keyInsights' field"
        assert "recommendations" in data, "Missing 'recommendations' field"
        assert "generatedBy" in data, "Missing 'generatedBy' field"
        
        # Verify data types
        assert isinstance(data["summary"], str), "Summary should be a string"
        assert isinstance(data["keyInsights"], list), "keyInsights should be a list"
        assert isinstance(data["recommendations"], list), "recommendations should be a list"
        assert data["generatedBy"] in ["ai", "template"], f"generatedBy should be 'ai' or 'template', got: {data['generatedBy']}"
        
        # Verify content is not empty
        assert len(data["summary"]) > 50, f"Summary should have meaningful content, got: {len(data['summary'])} chars"
        assert len(data["keyInsights"]) > 0, "Should have at least one insight"
        assert len(data["recommendations"]) > 0, "Should have at least one recommendation"
        
        # If AI generated, confidence should be present
        if data["generatedBy"] == "ai":
            assert "confidence" in data, "AI response should include confidence"
            assert data["confidence"] > 0.5, f"AI confidence should be >0.5, got: {data.get('confidence')}"
        
        print(f"Summary generated by: {data['generatedBy']}")
        print(f"Summary length: {len(data['summary'])} chars")
        print(f"Key Insights count: {len(data['keyInsights'])}")
        print(f"Recommendations count: {len(data['recommendations'])}")
    
    def test_generate_summary_executive_tone(self):
        """POST /api/reports/generate-summary - test with executive tone"""
        payload = {
            "reportTitle": "Annual Executive Summary",
            "reportSubtitle": "2025 Performance Overview",
            "sections": [
                {
                    "type": "stat_cards",
                    "title": "KPIs",
                    "stats": [
                        {"value": "+15%", "label": "Revenue Growth"},
                        {"value": "98.5%", "label": "Customer Retention"}
                    ]
                },
                {
                    "type": "conclusion",
                    "title": "Summary",
                    "content": "The company has exceeded expectations in all key metrics."
                }
            ],
            "tone": "executive",
            "length": "short"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-summary",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "summary" in data
        assert "generatedBy" in data
        assert data["generatedBy"] in ["ai", "template"]
        
        print(f"Executive tone summary generated by: {data['generatedBy']}")
    
    def test_generate_summary_casual_tone(self):
        """POST /api/reports/generate-summary - test with casual tone"""
        payload = {
            "reportTitle": "Team Performance Update",
            "reportSubtitle": "Weekly Highlights",
            "sections": [
                {
                    "type": "stat_cards",
                    "title": "Quick Stats",
                    "stats": [
                        {"value": "5", "label": "Projects Completed"},
                        {"value": "12", "label": "Tasks Done"}
                    ]
                }
            ],
            "tone": "casual",
            "length": "short"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-summary",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "summary" in data
        assert data["generatedBy"] in ["ai", "template"]
        
        print(f"Casual tone summary generated by: {data['generatedBy']}")
    
    def test_generate_summary_long_length(self):
        """POST /api/reports/generate-summary - test with long length"""
        payload = {
            "reportTitle": "Comprehensive Market Analysis",
            "reportSubtitle": "Deep Dive Report",
            "sections": [
                {
                    "type": "stat_cards",
                    "title": "Market Indicators",
                    "stats": [
                        {"value": "$45B", "label": "Total Addressable Market"},
                        {"value": "12.5%", "label": "CAGR"},
                        {"value": "35%", "label": "Our Market Share"},
                        {"value": "150+", "label": "Enterprise Clients"}
                    ]
                },
                {
                    "type": "pie_chart",
                    "title": "Market Distribution",
                    "chartData": [
                        {"name": "Segment A", "value": 45},
                        {"name": "Segment B", "value": 30},
                        {"name": "Segment C", "value": 25}
                    ]
                },
                {
                    "type": "line_chart",
                    "title": "Growth Trajectory",
                    "chartData": [
                        {"name": "Q1", "value": 100},
                        {"name": "Q2", "value": 120},
                        {"name": "Q3", "value": 145},
                        {"name": "Q4", "value": 180}
                    ]
                },
                {
                    "type": "data_table",
                    "title": "Regional Breakdown",
                    "tableData": [
                        {"region": "North America", "revenue": "$12M", "growth": "+18%"},
                        {"region": "Europe", "revenue": "$8M", "growth": "+12%"},
                        {"region": "Asia Pacific", "revenue": "$5M", "growth": "+25%"}
                    ]
                }
            ],
            "tone": "professional",
            "length": "long"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-summary",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=90  # Longer timeout for comprehensive summary
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "summary" in data
        assert len(data["summary"]) > 100, "Long summary should have substantial content"
        
        print(f"Long summary generated: {len(data['summary'])} chars")
        print(f"Generated by: {data['generatedBy']}")
    
    def test_generate_summary_minimal_data_fallback(self):
        """POST /api/reports/generate-summary - test fallback with minimal data"""
        payload = {
            "reportTitle": "Simple Report",
            "sections": [
                {
                    "type": "text_block",
                    "title": "Note",
                    "content": "Brief content"
                }
            ],
            "tone": "professional",
            "length": "short"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-summary",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Should still return valid response (either AI or template)
        assert "summary" in data
        assert "keyInsights" in data
        assert "recommendations" in data
        assert data["generatedBy"] in ["ai", "template"]
        
        print(f"Minimal data summary generated by: {data['generatedBy']}")
    
    def test_generate_summary_empty_sections_handles_gracefully(self):
        """POST /api/reports/generate-summary - test with empty sections array"""
        payload = {
            "reportTitle": "Empty Report Test",
            "sections": [],
            "tone": "professional",
            "length": "short"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-summary",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        # Should still return 200 with template fallback
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "summary" in data
        assert data["generatedBy"] in ["ai", "template"]
        
        print(f"Empty sections handled, generated by: {data['generatedBy']}")


class TestSummaryIntegration:
    """Integration tests for the AI Summary feature"""
    
    def test_summary_workflow_status_then_generate(self):
        """Test typical workflow: check status, then generate"""
        # Step 1: Check status
        status_response = requests.get(f"{BASE_URL}/api/reports/summary-status")
        assert status_response.status_code == 200
        status_data = status_response.json()
        
        print(f"Step 1 - Status check: AI={status_data['ai_available']}")
        
        # Step 2: Generate summary
        generate_response = requests.post(
            f"{BASE_URL}/api/reports/generate-summary",
            json={
                "reportTitle": "Integration Test Report",
                "sections": [
                    {
                        "type": "stat_cards",
                        "title": "Metrics",
                        "stats": [{"value": "100%", "label": "Test Coverage"}]
                    }
                ],
                "tone": "professional",
                "length": "medium"
            },
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert generate_response.status_code == 200
        gen_data = generate_response.json()
        
        print(f"Step 2 - Summary generated by: {gen_data['generatedBy']}")
        
        # Verify consistency
        if status_data["ai_available"]:
            # If AI was available, we expect AI generation (though fallback is possible)
            print(f"AI was available. Generator used: {gen_data['generatedBy']}")
        else:
            # If AI was not available, must be template
            assert gen_data["generatedBy"] == "template", \
                "When AI is unavailable, should use template fallback"
            print("Template fallback worked correctly when AI unavailable")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
