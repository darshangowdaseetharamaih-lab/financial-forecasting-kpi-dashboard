# Financial Forecasting & KPI Storytelling Dashboard
### AI-Enhanced Executive Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/AI-GPT--5.2-blue?style=for-the-badge&logo=openai" alt="GPT-5.2"/>
  <img src="https://img.shields.io/badge/For-CFO%20%7C%20VP%20Finance%20%7C%20FP%26A-green?style=for-the-badge" alt="Target Users"/>
  <img src="https://img.shields.io/badge/Domain-Financial%20Analytics-orange?style=for-the-badge" alt="Domain"/>
</p>

---

## Executive Overview

**What is this?**

A web-based financial analysis tool that transforms your monthly financial data into:
- **Clear KPI dashboards** showing performance at a glance
- **Variance analysis** explaining what changed and why
- **Forecast scenarios** for planning (Base, Upside, Downside, Stress)
- **AI-generated narratives** that read like FP&A commentary—not generic AI text

**Who is it for?**

| Role | Primary Use |
|------|-------------|
| **CFO** | Board-ready insights, strategic overview |
| **VP of Finance** | Performance monitoring, variance explanations |
| **FP&A Manager** | Forecasting, variance analysis, reporting |
| **Business Unit Leaders** | Understanding their P&L performance |

**Why does it matter?**

Traditional dashboards show *what happened*. This tool explains *why it happened* and *what to do next*—in plain English that executives can act on.

---

## How a Business Analyst Uses This Tool

### Step 1: Prepare Your Data
Create a CSV file with your monthly financial data:

```csv
date,revenue,cogs,opex,net_income,cash,employees,customers
2024-07,1850000,1110000,410000,247500,3100000,45,1800
2024-08,1920000,1152000,415000,264750,3200000,47,1920
2024-09,2050000,1230000,420000,300000,3300000,48,2050
```

**Required columns**: `date`, `revenue`, `cogs`, `opex`

**Optional columns**: `ebitda`, `net_income`, `cash`, `current_assets`, `current_liabilities`, `debt`, `equity`, `customers`, `employees`, `ar`, `monthly_burn`

### Step 2: Upload to Dashboard
1. Open the dashboard in your browser
2. Click **"Upload CSV"** button
3. Select your file
4. Wait for analysis to complete

### Step 3: Explore KPIs
- View summary cards for key metrics (Revenue, Margins, Efficiency)
- Select different periods using the dropdown
- Compare actual vs prior month

### Step 4: Analyze Variances
- Switch to **"Variance Analysis"** tab
- See which metrics improved (Favorable) or declined (Unfavorable)
- Read driver explanations in business language

### Step 5: Review Forecasts
- Switch to **"Forecast Scenarios"** tab
- Select scenario: Base, Upside, Downside, or Stress
- See projected values for next 6 months

### Step 6: Generate AI Narrative
1. Select a **Focus Area**:
   - Executive Summary (for board meetings)
   - Variance Deep-Dive (for monthly reviews)
   - Forecast Analysis (for planning)
   - Recommendations (for action items)
2. Click **"Generate"**
3. Review AI-generated insights, risks, and recommendations

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Upload    │  │   KPI       │  │   AI Narrative          │ │
│  │   CSV Data  │  │   Dashboard │  │   Generation            │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Data      │  │   KPI       │  │   AI Narrative          │ │
│  │   Parser    │  │   Engine    │  │   Engine (GPT-5.2)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Variance  │  │   Forecast  │                              │
│  │   Analyzer  │  │   Generator │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                │
│                    MongoDB (analysis runs,                      │
│                    narratives, history)                         │
└─────────────────────────────────────────────────────────────────┘
```

**How it works:**

1. **You upload CSV** → Backend parses and validates
2. **KPI Engine calculates** → All financial metrics computed server-side
3. **Variance Analyzer** → Compares periods, explains drivers
4. **Forecast Generator** → Creates 4 scenarios based on trends
5. **AI Engine (GPT-5.2)** → Generates executive narratives
6. **MongoDB stores** → Everything saved for history

---

## KPI Definitions & Formulas

### Revenue & Growth

| KPI | Formula | Interpretation |
|-----|---------|----------------|
| **Revenue** | Sum of period sales | Total top-line performance |
| **MoM Growth** | (Current - Prior) / Prior × 100 | Month-over-month momentum |
| **YoY Growth** | (Current - Same Month Last Year) / Last Year × 100 | Year-over-year performance |

### Profitability Margins

| KPI | Formula | Target |
|-----|---------|--------|
| **Gross Margin** | (Revenue - COGS) / Revenue × 100 | 40%+ for software |
| **Operating Margin** | (Revenue - COGS - OpEx) / Revenue × 100 | 15-25% healthy |
| **EBITDA Margin** | EBITDA / Revenue × 100 | 20%+ strong |
| **Net Margin** | Net Income / Revenue × 100 | 10%+ profitable |

### Efficiency Metrics

| KPI | Formula | Interpretation |
|-----|---------|----------------|
| **OpEx Ratio** | OpEx / Revenue × 100 | Lower = more efficient |
| **Revenue per Employee** | Revenue / Employee Count | Productivity measure |
| **ARPU** | Revenue / Customer Count | Customer value |

### Liquidity Ratios

| KPI | Formula | Target |
|-----|---------|--------|
| **Current Ratio** | Current Assets / Current Liabilities | 1.5-2.0x |
| **Quick Ratio** | (Cash + AR) / Current Liabilities | >1.0x |
| **Cash Runway** | Cash / Monthly Burn | 18+ months |
| **Debt-to-Equity** | Total Debt / Equity | <0.5x conservative |

---

## Example AI Outputs

### Executive Summary Example

> **Generated Narrative:**
>
> "December 2024 delivered our strongest performance of the year, with revenue reaching $2.45M (+12.5% MoM). Gross margin expanded 50bps to 40.0%, reflecting both pricing discipline and COGS efficiency. Operating leverage continues to improve as expenses grew only 3.7% against 12.5% revenue growth. Cash position strengthened to $4.2M, extending runway to 23 months.
>
> **Key Insights:**
> - Revenue acceleration indicates strong market momentum
> - Margin expansion suggests sustainable profitability path
> - OpEx discipline demonstrates operating leverage
>
> **Risks:**
> - Customer concentration in Enterprise segment (45% of revenue)
> - January seasonal decline historically 15-20%
>
> **Recommendations:**
> 1. Lock in Q1 renewals to mitigate seasonal risk
> 2. Accelerate hiring for Engineering (3 deferred positions)
> 3. Evaluate moving excess cash to higher-yield instruments"

### Variance Analysis Example

| Metric | Current | Prior | Variance | Status |
|--------|---------|-------|----------|--------|
| Revenue | $2.45M | $2.32M | +5.6% | ✅ Favorable |
| Gross Margin | 40.0% | 39.8% | +0.2pp | ✅ Favorable |
| OpEx Ratio | 17.3% | 18.2% | -0.9pp | ✅ Favorable |

**AI Driver Explanation:**
> "Revenue increased significantly (+5.6%), indicating strong momentum. Gross margin improved by 0.2pp, suggesting better pricing realization or COGS efficiency. OpEx ratio improved (lower), indicating better expense control relative to revenue."

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or cloud)

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn server:app --reload --port 8001
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
yarn install

# Start development server
yarn start
```

### Environment Variables

**Backend** (`backend/.env`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=financial_dashboard
EMERGENT_LLM_KEY=your-key-here
```

**Frontend** (`frontend/.env`):
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React, Tailwind CSS | Clean executive UI |
| **Charts** | Recharts | Interactive visualizations |
| **Backend** | FastAPI (Python) | REST API, business logic |
| **Database** | MongoDB | Store runs & narratives |
| **AI** | OpenAI GPT-5.2 | Narrative generation only |

---

## Project Structure

```
/
├── backend/
│   ├── server.py           # All API logic
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment config
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.jsx  # Main dashboard
│   │   └── components/ui/     # UI components
│   └── package.json
├── docs/
│   ├── kpi_definitions.md    # KPI reference
│   └── api_reference.md      # API documentation
├── ai_summaries/
│   ├── monthly_executive_summary.md
│   └── forecast_variance_insights.md
├── sql/
│   └── kpi_queries.sql       # Reference SQL
├── tests/
│   └── test_api.py           # API tests
└── README.md
```

---

## Acceptance Criteria

✅ Business Analyst can run locally without deep engineering knowledge

✅ Upload → KPIs → AI narrative works end-to-end

✅ Narratives sound like FP&A commentary, not generic AI

✅ Code is readable and well-commented

✅ README is recruiter- and executive-friendly

---

## Author

**[Your Name]**  
Business Analyst | Financial Analytics | AI Solutions

---

<p align="center">
  <i>From numbers to narratives—finance that speaks to leadership.</i>
</p>
