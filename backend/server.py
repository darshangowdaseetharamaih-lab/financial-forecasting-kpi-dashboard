"""
Financial Forecasting & KPI Storytelling Dashboard
===================================================
Backend API for financial analysis, KPI calculations, and AI-powered narratives.

Target Users: CFO, VP Finance, FP&A Manager, Business Unit Leaders
Author: AI Business Analyst Copilot
"""

from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
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
import csv
from decimal import Decimal, ROUND_HALF_UP

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

# LLM Integration for AI Narratives
from emergentintegrations.llm.chat import LlmChat, UserMessage
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(
    title="Financial Forecasting & KPI Dashboard API",
    description="AI-enhanced financial analysis for executive decision-making",
    version="1.0.0"
)
api_router = APIRouter(prefix="/api")

# =============================================================================
# DATA MODELS
# =============================================================================

class FinancialPeriod(BaseModel):
    """Single month of financial data"""
    model_config = ConfigDict(extra="ignore")
    
    date: str  # YYYY-MM format
    revenue: float
    cogs: float  # Cost of Goods Sold
    opex: float  # Operating Expenses
    ebitda: Optional[float] = None
    net_income: Optional[float] = None
    
    # Balance sheet (optional)
    cash: Optional[float] = None
    current_assets: Optional[float] = None
    current_liabilities: Optional[float] = None
    debt: Optional[float] = None
    equity: Optional[float] = None
    
    # Operational metrics (optional)
    customers: Optional[int] = None
    employees: Optional[int] = None
    ar: Optional[float] = None  # Accounts Receivable
    monthly_burn: Optional[float] = None

class CalculatedKPIs(BaseModel):
    """Calculated KPIs for a period"""
    period: str
    
    # Revenue & Growth
    revenue: float
    mom_growth: Optional[float] = None  # Month-over-Month
    yoy_growth: Optional[float] = None  # Year-over-Year
    
    # Profitability Margins
    gross_profit: float
    gross_margin: float
    operating_income: float
    operating_margin: float
    ebitda: float
    ebitda_margin: float
    net_income: float
    net_margin: float
    
    # Efficiency
    opex_ratio: float
    revenue_per_employee: Optional[float] = None
    arpu: Optional[float] = None  # Average Revenue Per User
    
    # Liquidity (if balance sheet available)
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None
    cash_runway_months: Optional[float] = None
    debt_to_equity: Optional[float] = None

class VarianceAnalysis(BaseModel):
    """Variance between two periods"""
    metric: str
    current_value: float
    prior_value: float
    variance_amount: float
    variance_percent: float
    status: str  # "Favorable" or "Unfavorable"
    driver_explanation: str

class ForecastScenario(BaseModel):
    """Forecast scenario data"""
    scenario: str  # base, upside, downside, stress
    periods: List[Dict[str, Any]]
    assumptions: Dict[str, Any]

class NarrativeRequest(BaseModel):
    """Request for AI narrative generation"""
    run_id: str
    focus: str = "executive_summary"  # executive_summary, variance, forecast, recommendations
    custom_question: Optional[str] = None

class NarrativeResponse(BaseModel):
    """AI-generated narrative response"""
    narrative_id: str
    summary: str
    key_insights: List[str]
    risks: List[str]
    recommendations: List[str]
    variance_drivers: Optional[List[str]] = None
    generated_at: str

class AnalysisRun(BaseModel):
    """Complete analysis run stored in database"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    periods: List[Dict[str, Any]]
    kpis: List[Dict[str, Any]]
    variances: List[Dict[str, Any]]
    forecasts: Optional[Dict[str, Any]] = None
    narratives: List[Dict[str, Any]] = []

# =============================================================================
# KPI CALCULATION ENGINE
# =============================================================================

def calculate_kpis(data: List[FinancialPeriod]) -> List[CalculatedKPIs]:
    """
    Calculate all financial KPIs from raw data.
    
    FORMULAS REFERENCE:
    -------------------
    Gross Profit = Revenue - COGS
    Gross Margin = Gross Profit / Revenue × 100
    
    Operating Income = Revenue - COGS - OpEx
    Operating Margin = Operating Income / Revenue × 100
    
    EBITDA = Operating Income (simplified, assumes minimal D&A)
    EBITDA Margin = EBITDA / Revenue × 100
    
    Net Margin = Net Income / Revenue × 100
    
    OpEx Ratio = OpEx / Revenue × 100
    Revenue per Employee = Revenue / Employees
    ARPU = Revenue / Customers
    
    Current Ratio = Current Assets / Current Liabilities
    Quick Ratio = (Current Assets - Inventory) / Current Liabilities
                  ≈ (Cash + AR) / Current Liabilities
    Cash Runway = Cash / Monthly Burn
    Debt-to-Equity = Total Debt / Shareholder Equity
    
    MoM Growth = (Current - Prior) / Prior × 100
    YoY Growth = (Current - Same Month Last Year) / Same Month Last Year × 100
    """
    
    # Sort by date
    sorted_data = sorted(data, key=lambda x: x.date)
    results = []
    
    # Create lookup for YoY comparison
    data_by_date = {d.date: d for d in sorted_data}
    
    for i, period in enumerate(sorted_data):
        # Revenue & Growth
        revenue = period.revenue
        
        # MoM Growth
        mom_growth = None
        if i > 0:
            prior_revenue = sorted_data[i-1].revenue
            if prior_revenue > 0:
                mom_growth = round((revenue - prior_revenue) / prior_revenue * 100, 2)
        
        # YoY Growth (look for same month last year)
        yoy_growth = None
        try:
            year, month = period.date.split('-')
            prior_year_date = f"{int(year)-1}-{month}"
            if prior_year_date in data_by_date:
                prior_year_revenue = data_by_date[prior_year_date].revenue
                if prior_year_revenue > 0:
                    yoy_growth = round((revenue - prior_year_revenue) / prior_year_revenue * 100, 2)
        except:
            pass
        
        # Profitability
        gross_profit = revenue - period.cogs
        gross_margin = round(gross_profit / revenue * 100, 2) if revenue > 0 else 0
        
        operating_income = gross_profit - period.opex
        operating_margin = round(operating_income / revenue * 100, 2) if revenue > 0 else 0
        
        # EBITDA (use provided or calculate as operating income)
        ebitda = period.ebitda if period.ebitda is not None else operating_income
        ebitda_margin = round(ebitda / revenue * 100, 2) if revenue > 0 else 0
        
        # Net Income (use provided or estimate from EBITDA)
        net_income = period.net_income if period.net_income is not None else ebitda * 0.75  # rough tax estimate
        net_margin = round(net_income / revenue * 100, 2) if revenue > 0 else 0
        
        # Efficiency
        opex_ratio = round(period.opex / revenue * 100, 2) if revenue > 0 else 0
        
        revenue_per_employee = None
        if period.employees and period.employees > 0:
            revenue_per_employee = round(revenue / period.employees, 2)
        
        arpu = None
        if period.customers and period.customers > 0:
            arpu = round(revenue / period.customers, 2)
        
        # Liquidity Ratios
        current_ratio = None
        if period.current_assets and period.current_liabilities and period.current_liabilities > 0:
            current_ratio = round(period.current_assets / period.current_liabilities, 2)
        
        quick_ratio = None
        if period.cash is not None and period.current_liabilities and period.current_liabilities > 0:
            ar = period.ar if period.ar else 0
            quick_ratio = round((period.cash + ar) / period.current_liabilities, 2)
        
        cash_runway_months = None
        if period.cash is not None and period.monthly_burn and period.monthly_burn > 0:
            cash_runway_months = round(period.cash / period.monthly_burn, 1)
        
        debt_to_equity = None
        if period.debt is not None and period.equity and period.equity > 0:
            debt_to_equity = round(period.debt / period.equity, 2)
        
        kpi = CalculatedKPIs(
            period=period.date,
            revenue=revenue,
            mom_growth=mom_growth,
            yoy_growth=yoy_growth,
            gross_profit=gross_profit,
            gross_margin=gross_margin,
            operating_income=operating_income,
            operating_margin=operating_margin,
            ebitda=ebitda,
            ebitda_margin=ebitda_margin,
            net_income=net_income,
            net_margin=net_margin,
            opex_ratio=opex_ratio,
            revenue_per_employee=revenue_per_employee,
            arpu=arpu,
            current_ratio=current_ratio,
            quick_ratio=quick_ratio,
            cash_runway_months=cash_runway_months,
            debt_to_equity=debt_to_equity
        )
        results.append(kpi)
    
    return results

# =============================================================================
# VARIANCE ANALYSIS ENGINE
# =============================================================================

def analyze_variance(current: CalculatedKPIs, prior: CalculatedKPIs) -> List[VarianceAnalysis]:
    """
    Perform month-over-month variance analysis.
    
    Rules:
    - Revenue/Profit increases = Favorable
    - Cost/Expense increases = Unfavorable
    - Margin improvements = Favorable
    """
    
    variances = []
    
    # Define metrics and their favorability direction
    # True = higher is better, False = lower is better
    metrics = [
        ("Revenue", current.revenue, prior.revenue, True),
        ("Gross Profit", current.gross_profit, prior.gross_profit, True),
        ("Gross Margin (%)", current.gross_margin, prior.gross_margin, True),
        ("Operating Income", current.operating_income, prior.operating_income, True),
        ("Operating Margin (%)", current.operating_margin, prior.operating_margin, True),
        ("EBITDA", current.ebitda, prior.ebitda, True),
        ("Net Income", current.net_income, prior.net_income, True),
        ("Net Margin (%)", current.net_margin, prior.net_margin, True),
        ("OpEx Ratio (%)", current.opex_ratio, prior.opex_ratio, False),  # Lower is better
    ]
    
    for metric_name, current_val, prior_val, higher_is_better in metrics:
        if prior_val == 0:
            variance_pct = 0 if current_val == 0 else 100
        else:
            variance_pct = round((current_val - prior_val) / abs(prior_val) * 100, 2)
        
        variance_amt = round(current_val - prior_val, 2)
        
        # Determine favorability
        if higher_is_better:
            status = "Favorable" if variance_amt >= 0 else "Unfavorable"
        else:
            status = "Favorable" if variance_amt <= 0 else "Unfavorable"
        
        # Generate driver explanation
        driver = _generate_variance_driver(metric_name, variance_amt, variance_pct, status)
        
        variances.append(VarianceAnalysis(
            metric=metric_name,
            current_value=current_val,
            prior_value=prior_val,
            variance_amount=variance_amt,
            variance_percent=variance_pct,
            status=status,
            driver_explanation=driver
        ))
    
    return variances

def _generate_variance_driver(metric: str, amount: float, pct: float, status: str) -> str:
    """Generate business-language explanation for variance driver."""
    
    direction = "increased" if amount > 0 else "decreased"
    abs_pct = abs(pct)
    
    if "Revenue" in metric:
        if abs_pct > 10:
            return f"Revenue {direction} significantly ({abs_pct:.1f}%), indicating {'strong momentum' if status == 'Favorable' else 'potential market challenges'}."
        elif abs_pct > 5:
            return f"Revenue {direction} moderately ({abs_pct:.1f}%), {'continuing growth trajectory' if status == 'Favorable' else 'requiring attention'}."
        else:
            return f"Revenue remained relatively stable with minor {direction[:-1]}e of {abs_pct:.1f}%."
    
    elif "Gross Margin" in metric or "Gross Profit" in metric:
        if status == "Favorable":
            return f"Gross margin improved by {abs_pct:.1f}pp, suggesting better pricing realization or COGS efficiency."
        else:
            return f"Gross margin declined by {abs_pct:.1f}pp, potentially due to pricing pressure or higher input costs."
    
    elif "Operating" in metric:
        if status == "Favorable":
            return f"Operating performance improved, reflecting {'operating leverage' if 'Margin' in metric else 'better cost management'}."
        else:
            return f"Operating performance declined, potentially due to {'increased operating costs' if 'Margin' in metric else 'cost overruns'}."
    
    elif "OpEx Ratio" in metric:
        if status == "Favorable":
            return f"OpEx ratio improved (lower), indicating better expense control relative to revenue."
        else:
            return f"OpEx ratio increased, suggesting expenses grew faster than revenue."
    
    elif "EBITDA" in metric:
        return f"EBITDA {direction} by {abs_pct:.1f}%, {'strengthening' if status == 'Favorable' else 'weakening'} core operating performance."
    
    elif "Net" in metric:
        return f"Bottom line {direction} by {abs_pct:.1f}%, {'improving' if status == 'Favorable' else 'impacting'} overall profitability."
    
    return f"{metric} {direction} by {abs_pct:.1f}%."

# =============================================================================
# FORECASTING ENGINE
# =============================================================================

def generate_forecasts(kpis: List[CalculatedKPIs], periods_ahead: int = 6) -> Dict[str, ForecastScenario]:
    """
    Generate forecast scenarios based on historical trends.
    
    Scenarios:
    - Base: Continue current trend
    - Upside: +50% of growth rate
    - Downside: -50% of growth rate
    - Stress: Revenue decline + cost pressure
    """
    
    if len(kpis) < 2:
        return {}
    
    # Calculate average growth rate from recent periods
    recent_growth_rates = [k.mom_growth for k in kpis[-6:] if k.mom_growth is not None]
    if not recent_growth_rates:
        avg_growth = 5.0  # Default assumption
    else:
        avg_growth = sum(recent_growth_rates) / len(recent_growth_rates)
    
    # Get latest period as baseline
    latest = kpis[-1]
    latest_revenue = latest.revenue
    latest_gross_margin = latest.gross_margin
    latest_opex_ratio = latest.opex_ratio
    
    # Define scenario parameters
    scenarios = {
        "base": {
            "revenue_growth": avg_growth,
            "margin_change": 0,
            "opex_change": 0,
            "description": "Continue current trajectory"
        },
        "upside": {
            "revenue_growth": avg_growth * 1.5,
            "margin_change": 0.5,  # Margin improvement
            "opex_change": -0.5,  # OpEx efficiency
            "description": "Accelerated growth with efficiency gains"
        },
        "downside": {
            "revenue_growth": avg_growth * 0.5,
            "margin_change": -0.5,
            "opex_change": 0.5,
            "description": "Slower growth with margin pressure"
        },
        "stress": {
            "revenue_growth": -5,  # Revenue decline
            "margin_change": -2,
            "opex_change": 2,
            "description": "Revenue contraction with cost pressure"
        }
    }
    
    results = {}
    
    for scenario_name, params in scenarios.items():
        forecast_periods = []
        
        # Parse latest date
        try:
            year, month = map(int, latest.period.split('-'))
        except:
            year, month = 2024, 12
        
        prev_revenue = latest_revenue
        
        for i in range(1, periods_ahead + 1):
            # Calculate next month
            month += 1
            if month > 12:
                month = 1
                year += 1
            
            period_date = f"{year}-{month:02d}"
            
            # Project revenue
            monthly_growth = params["revenue_growth"] / 100
            projected_revenue = prev_revenue * (1 + monthly_growth)
            
            # Project margins
            projected_gross_margin = latest_gross_margin + (params["margin_change"] * i / periods_ahead)
            projected_opex_ratio = latest_opex_ratio + (params["opex_change"] * i / periods_ahead)
            
            # Calculate P&L
            gross_profit = projected_revenue * (projected_gross_margin / 100)
            opex = projected_revenue * (projected_opex_ratio / 100)
            operating_income = gross_profit - opex
            
            forecast_periods.append({
                "period": period_date,
                "revenue": round(projected_revenue, 0),
                "gross_margin": round(projected_gross_margin, 1),
                "opex_ratio": round(projected_opex_ratio, 1),
                "operating_income": round(operating_income, 0),
                "operating_margin": round(operating_income / projected_revenue * 100, 1) if projected_revenue > 0 else 0
            })
            
            prev_revenue = projected_revenue
        
        results[scenario_name] = ForecastScenario(
            scenario=scenario_name,
            periods=forecast_periods,
            assumptions={
                "base_revenue": latest_revenue,
                "revenue_growth_rate": params["revenue_growth"],
                "margin_trajectory": params["margin_change"],
                "opex_trajectory": params["opex_change"],
                "description": params["description"]
            }
        )
    
    return results

# =============================================================================
# AI NARRATIVE ENGINE
# =============================================================================

async def generate_narrative(
    kpis: List[CalculatedKPIs],
    variances: List[VarianceAnalysis],
    forecasts: Dict[str, ForecastScenario],
    focus: str = "executive_summary",
    custom_question: Optional[str] = None
) -> NarrativeResponse:
    """
    Generate AI-powered narrative using GPT-5.2.
    
    Persona: "You are a seasoned FP&A Director preparing insights for executive leadership."
    
    Rules:
    - Never invent numbers
    - Reference only provided data
    - If data is missing, say "not available"
    - Keep tone executive, concise, decision-oriented
    """
    
    # Prepare data context
    latest_kpi = kpis[-1] if kpis else None
    prior_kpi = kpis[-2] if len(kpis) > 1 else None
    
    kpi_summary = ""
    if latest_kpi:
        kpi_summary = f"""
LATEST PERIOD ({latest_kpi.period}):
- Revenue: ${latest_kpi.revenue:,.0f}
- MoM Growth: {latest_kpi.mom_growth or 'N/A'}%
- Gross Margin: {latest_kpi.gross_margin}%
- Operating Margin: {latest_kpi.operating_margin}%
- Net Margin: {latest_kpi.net_margin}%
- OpEx Ratio: {latest_kpi.opex_ratio}%
"""
        if latest_kpi.current_ratio:
            kpi_summary += f"- Current Ratio: {latest_kpi.current_ratio}x\n"
        if latest_kpi.cash_runway_months:
            kpi_summary += f"- Cash Runway: {latest_kpi.cash_runway_months} months\n"
    
    variance_summary = ""
    if variances:
        variance_summary = "KEY VARIANCES (vs Prior Period):\n"
        for v in variances[:6]:  # Top 6 variances
            variance_summary += f"- {v.metric}: {v.variance_percent:+.1f}% ({v.status})\n"
    
    forecast_summary = ""
    if forecasts and "base" in forecasts:
        base = forecasts["base"]
        if base.periods:
            next_period = base.periods[0]
            forecast_summary = f"""
BASE CASE FORECAST ({next_period['period']}):
- Projected Revenue: ${next_period['revenue']:,.0f}
- Projected Operating Margin: {next_period['operating_margin']}%
"""
    
    # Build prompt based on focus
    focus_prompts = {
        "executive_summary": "Provide a concise executive summary for leadership. What are the key takeaways? What should the CFO highlight in the next board meeting?",
        "variance": "Analyze the variances in detail. What drove the changes? Which variances require immediate attention?",
        "forecast": "Explain the forecast scenarios. What are the key assumptions? What conditions would trigger upside vs downside cases?",
        "recommendations": "Provide specific, actionable recommendations. What should finance leadership prioritize in the next 30/60/90 days?"
    }
    
    focus_instruction = focus_prompts.get(focus, focus_prompts["executive_summary"])
    if custom_question:
        focus_instruction += f"\n\nAdditionally, answer this specific question: {custom_question}"
    
    prompt = f"""
You are a seasoned FP&A Director preparing insights for executive leadership.

RULES:
- Only reference the data provided below
- Never invent or assume numbers not in the data
- If data is missing, explicitly state "data not available"
- Be concise and decision-oriented
- Use executive language (no technical jargon)

{kpi_summary}

{variance_summary}

{forecast_summary}

TASK: {focus_instruction}

Respond in JSON format with these exact keys:
- summary: 2-4 sentence executive summary
- key_insights: array of 3-5 bullet points
- risks: array of 2-3 key risks
- recommendations: array of 3-4 actionable recommendations
- variance_drivers: array of top 3 variance explanations (if analyzing variance)
"""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"narrative-{str(uuid.uuid4())[:8]}",
            system_message="You are a seasoned FP&A Director preparing insights for executive leadership. You provide clear, concise, data-driven analysis."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        try:
            parsed = json.loads(response_text.strip())
            return NarrativeResponse(
                narrative_id=str(uuid.uuid4()),
                summary=parsed.get("summary", response_text),
                key_insights=parsed.get("key_insights", []),
                risks=parsed.get("risks", []),
                recommendations=parsed.get("recommendations", []),
                variance_drivers=parsed.get("variance_drivers"),
                generated_at=datetime.now(timezone.utc).isoformat()
            )
        except json.JSONDecodeError:
            return NarrativeResponse(
                narrative_id=str(uuid.uuid4()),
                summary=response_text,
                key_insights=["See summary for details"],
                risks=["Unable to parse structured risks"],
                recommendations=["Review full narrative for recommendations"],
                generated_at=datetime.now(timezone.utc).isoformat()
            )
    
    except Exception as e:
        logger.error(f"Error generating narrative: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate narrative: {str(e)}")

# =============================================================================
# API ROUTES
# =============================================================================

@api_router.get("/")
async def root():
    return {
        "message": "Financial Forecasting & KPI Dashboard API",
        "version": "1.0.0",
        "target_users": ["CFO", "VP Finance", "FP&A Manager", "Business Unit Leaders"]
    }

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ----- Data Upload -----

@api_router.post("/upload")
async def upload_financial_data(
    file: UploadFile = File(...),
    run_name: str = Form(default="Financial Analysis")
):
    """
    Upload CSV file with monthly financial data.
    
    Required columns: date, revenue, cogs, opex
    Optional columns: ebitda, net_income, cash, current_assets, current_liabilities,
                      debt, equity, customers, employees, ar, monthly_burn
    """
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read CSV content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Parse CSV
        reader = csv.DictReader(io.StringIO(content_str))
        periods = []
        
        required_cols = ['date', 'revenue', 'cogs', 'opex']
        
        for row in reader:
            # Validate required columns
            for col in required_cols:
                if col not in row or not row[col]:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Missing required column: {col}"
                    )
            
            period = FinancialPeriod(
                date=row['date'],
                revenue=float(row['revenue']),
                cogs=float(row['cogs']),
                opex=float(row['opex']),
                ebitda=float(row['ebitda']) if row.get('ebitda') else None,
                net_income=float(row['net_income']) if row.get('net_income') else None,
                cash=float(row['cash']) if row.get('cash') else None,
                current_assets=float(row['current_assets']) if row.get('current_assets') else None,
                current_liabilities=float(row['current_liabilities']) if row.get('current_liabilities') else None,
                debt=float(row['debt']) if row.get('debt') else None,
                equity=float(row['equity']) if row.get('equity') else None,
                customers=int(row['customers']) if row.get('customers') else None,
                employees=int(row['employees']) if row.get('employees') else None,
                ar=float(row['ar']) if row.get('ar') else None,
                monthly_burn=float(row['monthly_burn']) if row.get('monthly_burn') else None,
            )
            periods.append(period)
        
        if not periods:
            raise HTTPException(status_code=400, detail="No data found in CSV")
        
        # Calculate KPIs
        kpis = calculate_kpis(periods)
        
        # Generate variances (if we have at least 2 periods)
        variances = []
        if len(kpis) >= 2:
            variances = analyze_variance(kpis[-1], kpis[-2])
        
        # Generate forecasts
        forecasts = generate_forecasts(kpis)
        
        # Create analysis run
        run = AnalysisRun(
            name=run_name,
            periods=[p.model_dump() for p in periods],
            kpis=[k.model_dump() for k in kpis],
            variances=[v.model_dump() for v in variances],
            forecasts={k: v.model_dump() for k, v in forecasts.items()} if forecasts else None
        )
        
        # Store in database
        run_doc = run.model_dump()
        run_doc['created_at'] = run_doc['created_at'].isoformat()
        await db.analysis_runs.insert_one(run_doc)
        
        return {
            "run_id": run.id,
            "name": run.name,
            "periods_loaded": len(periods),
            "kpis_calculated": len(kpis),
            "variances_analyzed": len(variances),
            "forecasts_generated": len(forecasts)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

# ----- Analysis Runs -----

@api_router.get("/runs")
async def list_runs():
    """List all analysis runs"""
    runs = await db.analysis_runs.find({}, {"_id": 0, "periods": 0, "kpis": 0, "variances": 0, "forecasts": 0}).to_list(100)
    return runs

@api_router.get("/runs/{run_id}")
async def get_run(run_id: str):
    """Get a specific analysis run with all data"""
    run = await db.analysis_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    return run

@api_router.delete("/runs/{run_id}")
async def delete_run(run_id: str):
    """Delete an analysis run"""
    result = await db.analysis_runs.delete_one({"id": run_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    return {"deleted": True}

# ----- KPIs -----

@api_router.get("/runs/{run_id}/kpis")
async def get_kpis(run_id: str, period: Optional[str] = None):
    """Get KPIs for a run, optionally filtered by period"""
    run = await db.analysis_runs.find_one({"id": run_id}, {"_id": 0, "kpis": 1})
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    kpis = run.get("kpis", [])
    if period:
        kpis = [k for k in kpis if k.get("period") == period]
    
    return kpis

# ----- Variance Analysis -----

@api_router.get("/runs/{run_id}/variances")
async def get_variances(run_id: str):
    """Get variance analysis for a run"""
    run = await db.analysis_runs.find_one({"id": run_id}, {"_id": 0, "variances": 1})
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    return run.get("variances", [])

# ----- Forecasts -----

@api_router.get("/runs/{run_id}/forecasts")
async def get_forecasts(run_id: str, scenario: Optional[str] = None):
    """Get forecast scenarios for a run"""
    run = await db.analysis_runs.find_one({"id": run_id}, {"_id": 0, "forecasts": 1})
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    forecasts = run.get("forecasts", {})
    if scenario and scenario in forecasts:
        return forecasts[scenario]
    
    return forecasts

# ----- AI Narratives -----

@api_router.post("/runs/{run_id}/narrative")
async def generate_run_narrative(run_id: str, request: NarrativeRequest):
    """Generate AI narrative for an analysis run"""
    run = await db.analysis_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    # Convert stored data back to models
    kpis = [CalculatedKPIs(**k) for k in run.get("kpis", [])]
    variances = [VarianceAnalysis(**v) for v in run.get("variances", [])]
    
    forecasts = {}
    if run.get("forecasts"):
        for name, data in run["forecasts"].items():
            forecasts[name] = ForecastScenario(**data)
    
    # Generate narrative
    narrative = await generate_narrative(
        kpis=kpis,
        variances=variances,
        forecasts=forecasts,
        focus=request.focus,
        custom_question=request.custom_question
    )
    
    # Store narrative in run
    narrative_doc = narrative.model_dump()
    await db.analysis_runs.update_one(
        {"id": run_id},
        {"$push": {"narratives": narrative_doc}}
    )
    
    return narrative

@api_router.get("/runs/{run_id}/narratives")
async def get_narratives(run_id: str):
    """Get all narratives generated for a run"""
    run = await db.analysis_runs.find_one({"id": run_id}, {"_id": 0, "narratives": 1})
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    return run.get("narratives", [])

# ----- Sample Data -----

SAMPLE_FINANCIAL_DATA = [
    {"date": "2024-07", "revenue": 1850000, "cogs": 1110000, "opex": 410000, "net_income": 247500, "cash": 3100000, "employees": 45, "customers": 1800},
    {"date": "2024-08", "revenue": 1920000, "cogs": 1152000, "opex": 415000, "net_income": 264750, "cash": 3200000, "employees": 47, "customers": 1920},
    {"date": "2024-09", "revenue": 2050000, "cogs": 1230000, "opex": 420000, "net_income": 300000, "cash": 3300000, "employees": 48, "customers": 2050},
    {"date": "2024-10", "revenue": 2180000, "cogs": 1308000, "opex": 418000, "net_income": 340500, "cash": 3500000, "employees": 49, "customers": 2100},
    {"date": "2024-11", "revenue": 2320000, "cogs": 1392000, "opex": 422000, "net_income": 379500, "cash": 3800000, "employees": 50, "customers": 2180},
    {"date": "2024-12", "revenue": 2450000, "cogs": 1470000, "opex": 425000, "net_income": 416250, "cash": 4200000, "employees": 51, "customers": 2195},
]

@api_router.post("/sample-data")
async def load_sample_data():
    """Load sample financial data for demo purposes"""
    
    periods = [FinancialPeriod(**d) for d in SAMPLE_FINANCIAL_DATA]
    kpis = calculate_kpis(periods)
    variances = analyze_variance(kpis[-1], kpis[-2]) if len(kpis) >= 2 else []
    forecasts = generate_forecasts(kpis)
    
    run = AnalysisRun(
        name="Sample Company - H2 2024",
        periods=[p.model_dump() for p in periods],
        kpis=[k.model_dump() for k in kpis],
        variances=[v.model_dump() for v in variances],
        forecasts={k: v.model_dump() for k, v in forecasts.items()}
    )
    
    run_doc = run.model_dump()
    run_doc['created_at'] = run_doc['created_at'].isoformat()
    
    # Remove existing sample runs
    await db.analysis_runs.delete_many({"name": "Sample Company - H2 2024"})
    await db.analysis_runs.insert_one(run_doc)
    
    return {
        "run_id": run.id,
        "name": run.name,
        "message": "Sample data loaded successfully"
    }

# ----- KPI Definitions -----

@api_router.get("/kpi-definitions")
async def get_kpi_definitions():
    """Get definitions for all calculated KPIs"""
    return {
        "revenue_growth": {
            "name": "Revenue Growth",
            "formula": "(Current Revenue - Prior Revenue) / Prior Revenue × 100",
            "interpretation": "Positive growth indicates business expansion. Compare to industry benchmarks.",
            "target": "Generally 10-20% YoY for growth companies"
        },
        "gross_margin": {
            "name": "Gross Margin",
            "formula": "(Revenue - COGS) / Revenue × 100",
            "interpretation": "Measures production efficiency and pricing power.",
            "target": "Varies by industry; 40%+ is healthy for software"
        },
        "operating_margin": {
            "name": "Operating Margin",
            "formula": "(Revenue - COGS - OpEx) / Revenue × 100",
            "interpretation": "Core business profitability before interest and taxes.",
            "target": "15-25% for healthy businesses"
        },
        "net_margin": {
            "name": "Net Profit Margin",
            "formula": "Net Income / Revenue × 100",
            "interpretation": "Bottom-line profitability after all expenses.",
            "target": "10%+ indicates strong profitability"
        },
        "opex_ratio": {
            "name": "Operating Expense Ratio",
            "formula": "Operating Expenses / Revenue × 100",
            "interpretation": "Lower is better. Indicates operational efficiency.",
            "target": "<25% shows good expense control"
        },
        "current_ratio": {
            "name": "Current Ratio",
            "formula": "Current Assets / Current Liabilities",
            "interpretation": "Measures short-term liquidity. >1 means you can cover short-term obligations.",
            "target": "1.5-2.0x is healthy"
        },
        "quick_ratio": {
            "name": "Quick Ratio (Acid Test)",
            "formula": "(Cash + Accounts Receivable) / Current Liabilities",
            "interpretation": "More conservative liquidity measure excluding inventory.",
            "target": ">1.0x indicates good liquidity"
        },
        "cash_runway": {
            "name": "Cash Runway",
            "formula": "Cash Balance / Monthly Burn Rate",
            "interpretation": "Months of operation possible with current cash.",
            "target": "18+ months provides strategic flexibility"
        },
        "debt_to_equity": {
            "name": "Debt-to-Equity Ratio",
            "formula": "Total Debt / Shareholder Equity",
            "interpretation": "Measures financial leverage. Lower indicates less risk.",
            "target": "<0.5x is conservative; <1.0x is acceptable"
        }
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
