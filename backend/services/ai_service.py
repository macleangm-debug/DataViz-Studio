"""AI service - handles AI queries and chart suggestions"""
import os
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging

from core.database import db
from core.security import check_ai_usage, increment_ai_usage

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered features"""
    
    @staticmethod
    async def query_dataset(
        dataset_id: str,
        query: str,
        user: Dict[str, Any],
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Query a dataset using natural language"""
        # Check AI usage limits
        can_use, message = await check_ai_usage(user, "ai_query")
        if not can_use:
            return {"error": message, "response": message}
        
        # Get dataset data
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(1000)
        
        if not data:
            return {"response": "No data found in dataset", "error": None}
        
        df = pd.DataFrame(data)
        
        # Try to use AI
        try:
            from emergentintegrations.llm.openai import chat
            
            data_summary = f"Columns: {list(df.columns)}\nRows: {len(df)}\nSample:\n{df.head(3).to_string()}"
            
            prompt = f"""You are a data analyst assistant. Analyze the following dataset and answer the user's question.

Dataset Summary:
{data_summary}

User Question: {query}

Provide a clear, concise answer based on the data."""
            
            response = chat(
                api_key=os.environ.get('EMERGENT_API_KEY'),
                prompt=prompt,
                model="gpt-5.2"
            )
            
            # Increment usage
            await increment_ai_usage(user["id"], "ai_query")
            
            return {
                "response": response,
                "method": "ai",
                "model": "gpt-5.2"
            }
        except Exception as e:
            logger.error(f"AI query error: {str(e)}")
            
            # Fallback to basic stats
            stats = {
                "row_count": len(df),
                "columns": list(df.columns),
                "numeric_summary": df.describe().to_dict() if len(df.select_dtypes(include=['number']).columns) > 0 else {}
            }
            
            return {
                "response": f"Here are some statistics about your data:\n- Rows: {stats['row_count']}\n- Columns: {', '.join(stats['columns'])}",
                "method": "fallback",
                "stats": stats
            }
    
    @staticmethod
    async def suggest_charts(
        dataset_id: str,
        user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Suggest chart types based on dataset"""
        # Check AI usage limits
        can_use, message = await check_ai_usage(user, "ai_chart_suggest")
        if not can_use:
            return {"error": message, "suggestions": []}
        
        # Get dataset
        dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
        if not dataset:
            return {"error": "Dataset not found", "suggestions": []}
        
        # Get sample data
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(100)
        
        if not data:
            return {"suggestions": [], "error": "No data"}
        
        df = pd.DataFrame(data)
        columns = dataset.get("columns", [])
        
        # Try AI suggestions
        try:
            from emergentintegrations.llm.openai import chat
            
            column_info = "\n".join([
                f"- {col['name']} ({col['type']})"
                for col in columns
            ])
            
            prompt = f"""Based on this dataset structure, suggest 3-5 appropriate chart types with configurations.

Dataset: {dataset.get('name')}
Columns:
{column_info}

Sample data:
{df.head(5).to_string()}

For each suggestion, provide:
1. Chart type (bar, line, pie, area, scatter, radar, funnel, gauge, heatmap)
2. Title
3. X-axis field
4. Y-axis field (if applicable)
5. Brief reason

Format as JSON array."""
            
            response = chat(
                api_key=os.environ.get('EMERGENT_API_KEY'),
                prompt=prompt,
                model="gpt-5.2"
            )
            
            await increment_ai_usage(user["id"], "ai_chart_suggest")
            
            # Parse response
            import json
            try:
                suggestions = json.loads(response)
            except:
                suggestions = [{"raw_response": response}]
            
            return {
                "suggestions": suggestions,
                "method": "ai"
            }
        except Exception as e:
            logger.error(f"AI suggestion error: {str(e)}")
            
            # Fallback: rule-based suggestions
            suggestions = AIService._generate_fallback_suggestions(df, columns)
            
            return {
                "suggestions": suggestions,
                "method": "rule_based"
            }
    
    @staticmethod
    def _generate_fallback_suggestions(df: pd.DataFrame, columns: List[Dict]) -> List[Dict]:
        """Generate chart suggestions using rules"""
        suggestions = []
        
        numeric_cols = [c["name"] for c in columns if c.get("type") in ["int64", "float64", "int", "float"]]
        categorical_cols = [c["name"] for c in columns if c.get("type") in ["object", "string", "str"]]
        
        # Bar chart for categorical vs numeric
        if categorical_cols and numeric_cols:
            suggestions.append({
                "type": "bar",
                "title": f"{numeric_cols[0]} by {categorical_cols[0]}",
                "x_field": categorical_cols[0],
                "y_field": numeric_cols[0],
                "reason": "Bar charts are great for comparing values across categories"
            })
        
        # Line chart for time series
        date_cols = [c["name"] for c in columns if "date" in c["name"].lower() or "time" in c["name"].lower()]
        if date_cols and numeric_cols:
            suggestions.append({
                "type": "line",
                "title": f"{numeric_cols[0]} over time",
                "x_field": date_cols[0],
                "y_field": numeric_cols[0],
                "reason": "Line charts show trends over time"
            })
        
        # Pie chart for distribution
        if categorical_cols:
            suggestions.append({
                "type": "pie",
                "title": f"Distribution of {categorical_cols[0]}",
                "x_field": categorical_cols[0],
                "y_field": numeric_cols[0] if numeric_cols else None,
                "reason": "Pie charts show proportional distribution"
            })
        
        # Scatter for correlation
        if len(numeric_cols) >= 2:
            suggestions.append({
                "type": "scatter",
                "title": f"{numeric_cols[0]} vs {numeric_cols[1]}",
                "x_field": numeric_cols[0],
                "y_field": numeric_cols[1],
                "reason": "Scatter plots reveal correlations between numeric variables"
            })
        
        return suggestions
    
    @staticmethod
    async def help_assistant(
        message: str,
        user: Dict[str, Any],
        conversation_id: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """AI-powered help assistant"""
        try:
            from emergentintegrations.llm.openai import chat
            
            system_prompt = """You are a helpful assistant for DataViz Studio, a data visualization platform.
You can help users with:
- Creating and managing dashboards
- Building charts and visualizations
- Connecting to databases
- Transforming data
- Using AI insights
- Exporting reports

Be concise and helpful. If you don't know something, say so."""
            
            prompt = f"{system_prompt}\n\nUser: {message}"
            if context:
                prompt += f"\n\nContext: {context}"
            
            response = chat(
                api_key=os.environ.get('EMERGENT_API_KEY'),
                prompt=prompt,
                model="gpt-5.2"
            )
            
            return {
                "response": response,
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "method": "ai"
            }
        except Exception as e:
            logger.error(f"Help assistant error: {str(e)}")
            
            # Fallback response
            return {
                "response": AIService._get_fallback_help(message),
                "method": "fallback"
            }
    
    @staticmethod
    def _get_fallback_help(message: str) -> str:
        """Get fallback help response"""
        message_lower = message.lower()
        
        if "chart" in message_lower:
            return "To create a chart, go to Chart Studio, select a dataset, choose your X and Y fields, and pick a chart type."
        elif "dashboard" in message_lower:
            return "Dashboards can be created from the Dashboards page. Use drag-and-drop to add widgets."
        elif "upload" in message_lower or "data" in message_lower:
            return "You can upload CSV, Excel, or JSON files from the Data Sources page."
        elif "export" in message_lower or "pdf" in message_lower:
            return "Export your charts or dashboards to PDF from the Export menu."
        else:
            return "I'm here to help! You can ask about charts, dashboards, data upload, or exports."


# Import uuid for conversation_id generation
import uuid
