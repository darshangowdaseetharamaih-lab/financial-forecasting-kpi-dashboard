# Architecture Documentation
## AI Business Analyst Copilot - Technical Overview

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Browser   │  │   Mobile    │  │   PDF Export Engine     │ │
│  │  (React)    │  │  (Future)   │  │   (jsPDF/html2canvas)   │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                             │
│                    (Kubernetes Ingress)                         │
│              /api/* → Backend (8001)                            │
│              /*     → Frontend (3000)                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────────┐
│   FRONTEND SERVICE  │               │    BACKEND SERVICE      │
│   ────────────────  │               │    ────────────────     │
│   React 19          │               │    FastAPI (Python)     │
│   Tailwind CSS      │    REST API   │    Motor (Async Mongo)  │
│   Shadcn/UI         │◄─────────────►│    Pydantic Models      │
│   Recharts          │               │    ReportLab (PDF)      │
│   Framer Motion     │               │                         │
│   Port: 3000        │               │    Port: 8001           │
└─────────────────────┘               └───────────┬─────────────┘
                                                  │
                              ┌───────────────────┴─────────────┐
                              ▼                                 ▼
                    ┌─────────────────┐             ┌───────────────────┐
                    │    MongoDB      │             │   OpenAI API      │
                    │    ──────────   │             │   ───────────     │
                    │    Collections: │             │   GPT-5.2         │
                    │    - metrics    │             │   via Emergent    │
                    │    - timeseries │             │   LLM Key         │
                    │    - segments   │             │                   │
                    │    - insights   │             │                   │
                    │    - datasets   │             │                   │
                    └─────────────────┘             └───────────────────┘
```

---

## Data Flow

### 1. Analytics Data Flow
```
User Request → Frontend → API Call → Backend → MongoDB Query → Response → Chart Render
```

### 2. AI Insight Generation Flow
```
User Clicks "Generate" 
    → Frontend collects context
    → POST /api/insights/generate
    → Backend builds prompt with metrics
    → GPT-5.2 API call via Emergent
    → Parse JSON response
    → Store in MongoDB
    → Return to Frontend
    → Render insight card
```

### 3. PDF Export Flow
```
User Clicks "Export PDF"
    → Frontend collects report data
    → POST /api/export/pdf
    → Backend builds PDF with ReportLab
    → Stream PDF bytes
    → Browser downloads file
```

---

## Database Schema

### Collections

#### `metrics`
```json
{
  "id": "uuid",
  "name": "Total Revenue",
  "value": 2450000,
  "category": "revenue",
  "trend": 12.5,
  "period": "monthly",
  "date": "2024-12",
  "metadata": {},
  "created_at": "ISO datetime"
}
```

#### `timeseries`
```json
{
  "month": "Dec",
  "revenue": 2450000,
  "expenses": 425000,
  "profit": 555000
}
```

#### `customer_segments`
```json
{
  "segment": "Enterprise",
  "count": 45,
  "revenue": 1100000,
  "ltv": 24444
}
```

#### `insights`
```json
{
  "insight_id": "uuid",
  "executive_summary": "...",
  "key_findings": ["...", "..."],
  "recommendations": ["...", "..."],
  "generated_at": "ISO datetime"
}
```

#### `business_framing`
```json
{
  "id": "uuid",
  "stakeholder": "CFO",
  "business_question": "...",
  "decision_impact": "...",
  "data_sources": ["...", "..."],
  "success_criteria": "...",
  "created_at": "ISO datetime"
}
```

---

## API Endpoints

### Core Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | Fetch all metrics |
| POST | `/api/metrics` | Create metric |
| DELETE | `/api/metrics/{id}` | Delete metric |
| GET | `/api/timeseries` | Fetch time series |
| GET | `/api/customer-segments` | Fetch segments |

### AI & Reporting
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/insights/generate` | Generate AI insights |
| GET | `/api/insights/history` | Fetch past insights |
| POST | `/api/export/pdf` | Generate PDF report |

### Business Framing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/business-framing` | Fetch framings |
| POST | `/api/business-framing` | Create framing |
| DELETE | `/api/business-framing/{id}` | Delete framing |

### Data Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seed-data` | Load sample data |
| POST | `/api/datasets/upload` | Upload dataset |
| GET | `/api/datasets` | List datasets |

---

## Frontend Components

### Page Structure
```
src/
├── pages/
│   ├── Dashboard.jsx      # Layout with sidebar navigation
│   ├── OverviewPage.jsx   # Main KPI dashboard
│   ├── FinancialPage.jsx  # Financial analytics
│   ├── CustomerPage.jsx   # Customer analytics
│   ├── InsightsPage.jsx   # AI insights generator
│   ├── ReportsPage.jsx    # PDF export & framing
│   └── DataPage.jsx       # Data management
├── components/
│   └── ui/                # Shadcn components
└── App.js                 # Router setup
```

### Key Libraries
- **Recharts**: Interactive charts (Area, Bar, Pie, Composed)
- **Framer Motion**: Page transitions and animations
- **Shadcn/UI**: Form inputs, cards, buttons, dialogs
- **Axios**: API communication
- **Sonner**: Toast notifications

---

## AI Integration

### Emergent Integration
```python
from emergentintegrations.llm.chat import LlmChat, UserMessage

chat = LlmChat(
    api_key=EMERGENT_LLM_KEY,
    session_id="unique-session",
    system_message="You are a senior financial analyst..."
).with_model("openai", "gpt-5.2")

response = await chat.send_message(UserMessage(text=prompt))
```

### Prompt Engineering
The system uses structured prompts with:
1. **Role definition**: Senior financial analyst persona
2. **Output format**: JSON schema enforcement
3. **Context injection**: Business framing + metrics data
4. **Specific instructions**: What to analyze and generate

---

## Deployment

### Environment Variables

#### Backend (`/app/backend/.env`)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY="sk-emergent-xxxxx"
```

#### Frontend (`/app/frontend/.env`)
```
REACT_APP_BACKEND_URL=https://your-domain.com
```

### Supervisor Configuration
```
[program:backend]
command=uvicorn server:app --host 0.0.0.0 --port 8001 --reload

[program:frontend]
command=yarn start
directory=/app/frontend
```

---

## Security Considerations

1. **API Keys**: Stored in environment variables, never in code
2. **CORS**: Configured for production origins
3. **Input Validation**: Pydantic models validate all inputs
4. **MongoDB**: Exclude `_id` from responses to prevent ObjectId serialization issues

---

## Performance Optimizations

1. **Async Database**: Motor for non-blocking MongoDB operations
2. **Lazy Loading**: Charts render after data fetch
3. **Response Caching**: Consider adding Redis for frequent queries
4. **PDF Streaming**: Generate and stream PDF without temp files

---

**Document Version**: 1.0  
**Last Updated**: December 2024
