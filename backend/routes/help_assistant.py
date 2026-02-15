"""Help Center AI Assistant Routes for DataViz Studio"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/help-assistant", tags=["Help Assistant"])

HELP_CENTER_BASE = "/help"

DATAVIZ_HELP_CONTEXT = """
You are the DataViz Studio AI Assistant, an expert on the DataViz Studio data visualization platform.

## About DataViz Studio
DataViz Studio is a comprehensive data visualization and analytics platform with:
- Upload CSV, Excel, JSON data (up to 50MB)
- Connect to MongoDB, PostgreSQL, MySQL databases
- Create interactive dashboards with 12 widget types
- Build infographic-style reports with PDF export
- 9 chart types with annotations
- Data transformation tools
- AI-powered insights

## Key Features

### Dashboards
- 10 preset templates: Sales, Marketing, Customer, Financial, Operations, Web Analytics, Executive, Project Tracker, Support, Blank Canvas
- Save custom templates
- 12 widget types: stat cards, charts, tables, gauges, progress bars, maps, funnels, heatmaps, scorecards, lists, timelines, sparklines

### Report Builder
- WYSIWYG editor with live preview
- 6 color themes + custom colors
- Section types: Key Metrics, Bar/Pie/Line charts, Data Table, Text/Notes
- Section widths: 25%, 50%, 75%, 100%
- Multi-page PDF export with headers/footers

### Charts
- 9 types: Bar, Line, Area, Pie, Donut, Scatter, Radar, Heatmap, Funnel
- Annotations: text labels, reference lines, highlight regions

### Data Management
- Upload: CSV, Excel (.xlsx), JSON
- Transform: filter, rename, change type, calculate, fill missing, drop, sort
- Database connections with scheduled refresh

## Help Center Links
When relevant, include these links in your responses:

- Getting Started: [Welcome Guide]({base}?tab=article&category=getting-started&article=welcome)
- Dashboards: [Dashboard Overview]({base}?tab=article&category=getting-started&article=dashboard-overview)
- Templates: [Using Templates]({base}?tab=article&category=dashboards&article=templates)
- Charts: [Chart Types Guide]({base}?tab=article&category=charts&article=chart-types)
- Reports: [Report Builder Overview]({base}?tab=article&category=reports&article=report-overview)
- PDF Export: [Exporting to PDF]({base}?tab=article&category=reports&article=pdf-export)
- Upload Data: [Uploading Data]({base}?tab=article&category=data&article=upload-data)
- Transform: [Data Transformation]({base}?tab=article&category=data&article=data-transform)
- FAQ: [Frequently Asked Questions]({base}?tab=faq)
- Troubleshooting: [Troubleshooting Guide]({base}?tab=troubleshooting)

## Guidelines
1. Be helpful, accurate, and concise
2. Include 1-2 relevant article links when appropriate
3. Format links as: [Link Text](url)
4. Keep responses friendly and professional
5. If unsure, direct users to appropriate Help Center section
""".format(base=HELP_CENTER_BASE)

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class FeedbackRequest(BaseModel):
    session_id: Optional[str] = None
    message_id: str
    is_helpful: bool
    question: Optional[str] = None

# In-memory storage (use database in production)
chat_sessions = {}
feedback_store = []
question_analytics = {}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(chat_message: ChatMessage):
    """Chat with the DataViz Studio AI Assistant"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI Assistant not configured")
        
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        if session_id not in chat_sessions:
            chat = LlmChat(
                api_key=api_key, 
                session_id=session_id, 
                system_message=DATAVIZ_HELP_CONTEXT
            ).with_model("openai", "gpt-4o")
            chat_sessions[session_id] = chat
        else:
            chat = chat_sessions[session_id]
        
        response = await chat.send_message(UserMessage(text=chat_message.message))
        
        return ChatResponse(response=response, session_id=session_id)
        
    except ImportError:
        # Fallback response if emergentintegrations not available
        return ChatResponse(
            response=get_fallback_response(chat_message.message),
            session_id=chat_message.session_id or str(uuid.uuid4())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback on assistant responses"""
    feedback_store.append({
        "session_id": feedback.session_id,
        "message_id": feedback.message_id,
        "is_helpful": feedback.is_helpful,
        "question": feedback.question
    })
    
    # Track question analytics
    if feedback.question:
        q = feedback.question.lower().strip()
        if q not in question_analytics:
            question_analytics[q] = {
                "question": feedback.question,
                "count": 0,
                "helpful": 0,
                "not_helpful": 0
            }
        question_analytics[q]["count"] += 1
        if feedback.is_helpful:
            question_analytics[q]["helpful"] += 1
        else:
            question_analytics[q]["not_helpful"] += 1
    
    return {"success": True}

@router.get("/analytics")
async def get_analytics():
    """Get analytics on frequently asked questions"""
    sorted_q = sorted(question_analytics.values(), key=lambda x: x["count"], reverse=True)
    return {
        "total_questions": sum(q["count"] for q in sorted_q),
        "top_questions": sorted_q[:10],
        "feedback_count": len(feedback_store)
    }

def get_fallback_response(message: str) -> str:
    """Provide helpful responses when AI is unavailable"""
    message_lower = message.lower()
    
    if "template" in message_lower:
        return "To use templates: Go to Dashboards → Click 'Templates' → Choose from 10 presets or your custom templates → Click to create. [Using Templates](/help?tab=article&category=dashboards&article=templates)"
    elif "pdf" in message_lower or "export" in message_lower:
        return "To export to PDF: Open Report Builder → Add sections → Click 'Preview' → Click 'Export PDF'. [Exporting to PDF](/help?tab=article&category=reports&article=pdf-export)"
    elif "chart" in message_lower:
        return "DataViz Studio supports 9 chart types: Bar, Line, Area, Pie, Donut, Scatter, Radar, Heatmap, Funnel. [Chart Types Guide](/help?tab=article&category=charts&article=chart-types)"
    elif "dashboard" in message_lower:
        return "Create dashboards with 12 widget types. Use templates for quick start or build from scratch. [Dashboard Overview](/help?tab=article&category=getting-started&article=dashboard-overview)"
    elif "upload" in message_lower or "data" in message_lower:
        return "Upload CSV, Excel (.xlsx), or JSON files up to 50MB. Go to Data > Upload Data. [Uploading Data](/help?tab=article&category=data&article=upload-data)"
    elif "transform" in message_lower:
        return "Transform data with: filter, rename, change type, calculate, fill missing, drop, sort. [Data Transformation](/help?tab=article&category=data&article=data-transform)"
    elif "widget" in message_lower:
        return "12 widget types available: stat cards, charts, tables, gauges, progress bars, maps, funnels, heatmaps, scorecards, lists, timelines, sparklines."
    elif "annotation" in message_lower:
        return "Add annotations to charts: text labels, reference lines, or highlight regions. Access via Chart Studio's Annotations section."
    elif "started" in message_lower or "begin" in message_lower or "hello" in message_lower or "hi" in message_lower:
        return "Welcome to DataViz Studio! I can help you with dashboards, reports, charts, and data management. [Welcome Guide](/help?tab=article&category=getting-started&article=welcome)"
    else:
        return "I'm here to help with DataViz Studio! Ask about dashboards, templates, charts, reports, PDF export, data upload, or transformations. [Visit FAQ](/help?tab=faq)"
