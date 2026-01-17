from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import io
import json

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== Models ==============

class MetricData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: float
    category: str  # revenue, expense, customer, conversion
    trend: Optional[float] = 0.0  # percentage change
    period: str  # daily, weekly, monthly
    date: str
    metadata: Optional[Dict[str, Any]] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MetricCreate(BaseModel):
    name: str
    value: float
    category: str
    trend: Optional[float] = 0.0
    period: str
    date: str
    metadata: Optional[Dict[str, Any]] = {}

class BusinessFraming(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stakeholder: str
    business_question: str
    decision_impact: str
    data_sources: List[str]
    success_criteria: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BusinessFramingCreate(BaseModel):
    stakeholder: str
    business_question: str
    decision_impact: str
    data_sources: List[str]
    success_criteria: str

class InsightRequest(BaseModel):
    context: str
    metrics_summary: Dict[str, Any]
    question: Optional[str] = "Provide executive summary and recommendations"

class InsightResponse(BaseModel):
    insight_id: str
    executive_summary: str
    key_findings: List[str]
    recommendations: List[str]
    generated_at: str

class DatasetUpload(BaseModel):
    name: str
    data: List[Dict[str, Any]]
    description: Optional[str] = ""

# ============== Sample Data ==============

SAMPLE_FINANCIAL_DATA = [
    {"name": "Total Revenue", "value": 2450000, "category": "revenue", "trend": 12.5, "period": "monthly", "date": "2024-12"},
    {"name": "Gross Profit", "value": 980000, "category": "revenue", "trend": 8.3, "period": "monthly", "date": "2024-12"},
    {"name": "Operating Expenses", "value": 425000, "category": "expense", "trend": -3.2, "period": "monthly", "date": "2024-12"},
    {"name": "Net Income", "value": 555000, "category": "revenue", "trend": 15.7, "period": "monthly", "date": "2024-12"},
    {"name": "Customer Acquisition Cost", "value": 85, "category": "customer", "trend": -5.1, "period": "monthly", "date": "2024-12"},
    {"name": "Customer Lifetime Value", "value": 1250, "category": "customer", "trend": 7.8, "period": "monthly", "date": "2024-12"},
    {"name": "Conversion Rate", "value": 3.8, "category": "conversion", "trend": 0.5, "period": "monthly", "date": "2024-12"},
    {"name": "Average Order Value", "value": 125, "category": "revenue", "trend": 4.2, "period": "monthly", "date": "2024-12"},
    {"name": "Churn Rate", "value": 2.1, "category": "customer", "trend": -0.3, "period": "monthly", "date": "2024-12"},
    {"name": "Marketing ROI", "value": 340, "category": "revenue", "trend": 18.5, "period": "monthly", "date": "2024-12"},
]

SAMPLE_TIMESERIES = [
    {"month": "Jul", "revenue": 1850000, "expenses": 410000, "profit": 440000},
    {"month": "Aug", "revenue": 1920000, "expenses": 415000, "profit": 505000},
    {"month": "Sep", "revenue": 2050000, "expenses": 420000, "profit": 530000},
    {"month": "Oct", "revenue": 2180000, "expenses": 418000, "profit": 540000},
    {"month": "Nov", "revenue": 2320000, "expenses": 422000, "profit": 545000},
    {"month": "Dec", "revenue": 2450000, "expenses": 425000, "profit": 555000},
]

SAMPLE_CUSTOMER_SEGMENTS = [
    {"segment": "Enterprise", "count": 45, "revenue": 1100000, "ltv": 24444},
    {"segment": "SMB", "count": 320, "revenue": 850000, "ltv": 2656},
    {"segment": "Startup", "count": 580, "revenue": 350000, "ltv": 603},
    {"segment": "Individual", "count": 1250, "revenue": 150000, "ltv": 120},
]

# ============== Routes ==============

@api_router.get("/")
async def root():
    return {"message": "Data Analytics Portfolio API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ----- Metrics -----

@api_router.get("/metrics")
async def get_metrics(category: Optional[str] = None):
    """Get all metrics, optionally filtered by category"""
    query = {} if not category else {"category": category}
    metrics = await db.metrics.find(query, {"_id": 0}).to_list(1000)
    
    if not metrics:
        # Return sample data if no data exists
        return SAMPLE_FINANCIAL_DATA
    
    for m in metrics:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return metrics

@api_router.post("/metrics", response_model=MetricData)
async def create_metric(metric: MetricCreate):
    """Create a new metric"""
    metric_obj = MetricData(**metric.model_dump())
    doc = metric_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.metrics.insert_one(doc)
    return metric_obj

@api_router.post("/metrics/bulk")
async def bulk_create_metrics(metrics: List[MetricCreate]):
    """Bulk create metrics"""
    docs = []
    for m in metrics:
        metric_obj = MetricData(**m.model_dump())
        doc = metric_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        docs.append(doc)
    
    if docs:
        await db.metrics.insert_many(docs)
    return {"created": len(docs)}

@api_router.delete("/metrics/{metric_id}")
async def delete_metric(metric_id: str):
    """Delete a metric"""
    result = await db.metrics.delete_one({"id": metric_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Metric not found")
    return {"deleted": True}

# ----- Time Series Data -----

@api_router.get("/timeseries")
async def get_timeseries():
    """Get time series financial data"""
    data = await db.timeseries.find({}, {"_id": 0}).to_list(1000)
    if not data:
        return SAMPLE_TIMESERIES
    return data

@api_router.post("/timeseries/seed")
async def seed_timeseries():
    """Seed sample time series data"""
    await db.timeseries.delete_many({})
    await db.timeseries.insert_many(SAMPLE_TIMESERIES)
    return {"seeded": len(SAMPLE_TIMESERIES)}

# ----- Customer Segments -----

@api_router.get("/customer-segments")
async def get_customer_segments():
    """Get customer segment data"""
    data = await db.customer_segments.find({}, {"_id": 0}).to_list(1000)
    if not data:
        return SAMPLE_CUSTOMER_SEGMENTS
    return data

# ----- Business Framing -----

@api_router.get("/business-framing")
async def get_business_framing():
    """Get all business framing entries"""
    framings = await db.business_framing.find({}, {"_id": 0}).to_list(100)
    for f in framings:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
    return framings

@api_router.post("/business-framing", response_model=BusinessFraming)
async def create_business_framing(framing: BusinessFramingCreate):
    """Create a business framing entry"""
    framing_obj = BusinessFraming(**framing.model_dump())
    doc = framing_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.business_framing.insert_one(doc)
    return framing_obj

@api_router.delete("/business-framing/{framing_id}")
async def delete_business_framing(framing_id: str):
    """Delete a business framing entry"""
    result = await db.business_framing.delete_one({"id": framing_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Business framing not found")
    return {"deleted": True}

# ----- AI Insights -----

@api_router.post("/insights/generate", response_model=InsightResponse)
async def generate_insights(request: InsightRequest):
    """Generate AI-powered executive insights using GPT-5.2"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"insight-{str(uuid.uuid4())[:8]}",
            system_message="""You are a senior financial analyst and business strategist. 
Your role is to analyze financial and customer data and provide:
1. Clear executive summaries for C-level stakeholders
2. Key findings backed by the data
3. Actionable recommendations for business decisions

Format your response as JSON with these exact keys:
- executive_summary: 2-3 paragraph summary
- key_findings: array of 3-5 bullet points
- recommendations: array of 3-5 actionable items"""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""
Analyze the following business context and metrics data:

CONTEXT:
{request.context}

METRICS SUMMARY:
{json.dumps(request.metrics_summary, indent=2)}

SPECIFIC QUESTION:
{request.question}

Provide your analysis as a JSON object with executive_summary, key_findings, and recommendations.
"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Try to extract JSON from response
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            parsed = json.loads(response_text.strip())
            
            insight = InsightResponse(
                insight_id=str(uuid.uuid4()),
                executive_summary=parsed.get("executive_summary", response_text),
                key_findings=parsed.get("key_findings", []),
                recommendations=parsed.get("recommendations", []),
                generated_at=datetime.now(timezone.utc).isoformat()
            )
        except json.JSONDecodeError:
            # If JSON parsing fails, use the raw response
            insight = InsightResponse(
                insight_id=str(uuid.uuid4()),
                executive_summary=response,
                key_findings=["Analysis generated - see executive summary"],
                recommendations=["Review the executive summary for detailed recommendations"],
                generated_at=datetime.now(timezone.utc).isoformat()
            )
        
        # Store insight
        insight_doc = insight.model_dump()
        await db.insights.insert_one(insight_doc)
        
        return insight
        
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@api_router.get("/insights/history")
async def get_insights_history():
    """Get history of generated insights"""
    insights = await db.insights.find({}, {"_id": 0}).to_list(50)
    return insights

# ----- PDF Export -----

@api_router.post("/export/pdf")
async def export_pdf(data: Dict[str, Any]):
    """Generate PDF executive memo"""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#0F172A'),
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#0F172A')
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        textColor=colors.HexColor('#334155'),
        leading=16
    )
    
    story = []
    
    # Title
    story.append(Paragraph("Executive Analytics Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Business Framing Section
    if data.get('businessFraming'):
        bf = data['businessFraming']
        story.append(Paragraph("Business Context", heading_style))
        story.append(Paragraph(f"<b>Stakeholder:</b> {bf.get('stakeholder', 'N/A')}", body_style))
        story.append(Paragraph(f"<b>Business Question:</b> {bf.get('business_question', 'N/A')}", body_style))
        story.append(Paragraph(f"<b>Decision Impact:</b> {bf.get('decision_impact', 'N/A')}", body_style))
        story.append(Spacer(1, 15))
    
    # Key Metrics Section
    if data.get('metrics'):
        story.append(Paragraph("Key Performance Indicators", heading_style))
        
        metrics_data = [['Metric', 'Value', 'Trend']]
        for m in data['metrics'][:8]:
            value = f"${m['value']:,.0f}" if m['value'] > 100 else f"{m['value']:.1f}%"
            trend = f"+{m['trend']:.1f}%" if m['trend'] > 0 else f"{m['trend']:.1f}%"
            metrics_data.append([m['name'], value, trend])
        
        table = Table(metrics_data, colWidths=[3*inch, 2*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        story.append(table)
        story.append(Spacer(1, 20))
    
    # AI Insights Section
    if data.get('insights'):
        insights = data['insights']
        story.append(Paragraph("AI-Generated Executive Summary", heading_style))
        story.append(Paragraph(insights.get('executive_summary', 'No summary available'), body_style))
        story.append(Spacer(1, 10))
        
        if insights.get('key_findings'):
            story.append(Paragraph("Key Findings", heading_style))
            for finding in insights['key_findings']:
                story.append(Paragraph(f"• {finding}", body_style))
        
        if insights.get('recommendations'):
            story.append(Spacer(1, 10))
            story.append(Paragraph("Recommendations", heading_style))
            for rec in insights['recommendations']:
                story.append(Paragraph(f"• {rec}", body_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=executive_report.pdf"}
    )

# ----- Dataset Management -----

@api_router.post("/datasets/upload")
async def upload_dataset(dataset: DatasetUpload):
    """Upload a custom dataset"""
    doc = {
        "id": str(uuid.uuid4()),
        "name": dataset.name,
        "description": dataset.description,
        "data": dataset.data,
        "row_count": len(dataset.data),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.datasets.insert_one(doc)
    return {"id": doc["id"], "name": doc["name"], "row_count": doc["row_count"]}

@api_router.get("/datasets")
async def list_datasets():
    """List all uploaded datasets"""
    datasets = await db.datasets.find({}, {"_id": 0, "data": 0}).to_list(100)
    return datasets

@api_router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get a specific dataset"""
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

# ----- Seed Sample Data -----

@api_router.post("/seed-data")
async def seed_all_data():
    """Seed all sample data for demo purposes"""
    # Seed metrics
    await db.metrics.delete_many({})
    for m in SAMPLE_FINANCIAL_DATA:
        metric_obj = MetricData(**m)
        doc = metric_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.metrics.insert_one(doc)
    
    # Seed timeseries
    await db.timeseries.delete_many({})
    await db.timeseries.insert_many(SAMPLE_TIMESERIES)
    
    # Seed customer segments
    await db.customer_segments.delete_many({})
    await db.customer_segments.insert_many(SAMPLE_CUSTOMER_SEGMENTS)
    
    # Seed business framing example
    await db.business_framing.delete_many({})
    example_framing = BusinessFraming(
        stakeholder="Chief Financial Officer",
        business_question="How can we improve profitability while maintaining customer growth?",
        decision_impact="Allocation of Q1 2025 budget ($2M) across marketing, product, and operations",
        data_sources=["Financial transactions", "Customer behavior", "Marketing attribution"],
        success_criteria="15% increase in profit margin with <5% increase in churn"
    )
    doc = example_framing.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.business_framing.insert_one(doc)
    
    return {
        "seeded": True,
        "metrics": len(SAMPLE_FINANCIAL_DATA),
        "timeseries": len(SAMPLE_TIMESERIES),
        "customer_segments": len(SAMPLE_CUSTOMER_SEGMENTS),
        "business_framing": 1
    }

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
