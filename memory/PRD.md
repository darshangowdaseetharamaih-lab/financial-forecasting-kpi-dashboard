# Data Analytics Portfolio - PRD

## Original Problem Statement
Build a Data Analytics Portfolio Project with 4 phases:
1. Business Framing (stakeholder, business question, decision impact)
2. Data & Analysis (clean data, metrics, validate assumptions)
3. AI Integration (executive summaries, plain English insights, recommendations)
4. Presentation (Dashboard, Executive memo PDF)

## User Choices
- Domain: Financial Analytics with E-commerce/Customer Analytics overlay
- LLM: OpenAI GPT-5.2 with Emergent LLM key
- Dashboard: Interactive charts + KPI summary cards
- Design: Light theme, enterprise-style, professional
- PDF: AI-generated summaries + recommendations

## User Personas
1. **Hiring Managers** - Reviewing technical/business skills of candidates
2. **Executives/CFOs** - Need quick executive summaries and KPIs
3. **Business Analysts** - Deep dive into financial/customer data

## Core Requirements
- [x] Executive Dashboard with KPI cards
- [x] Financial Analytics with filtering
- [x] Customer Analytics with segmentation
- [x] AI-powered insights via GPT-5.2
- [x] Business Framing framework
- [x] PDF Report Export
- [x] Data Management/Upload

## What's Been Implemented (Jan 2025)
- Full-stack dashboard with 6 pages
- FastAPI backend with MongoDB
- GPT-5.2 integration via Emergent
- Interactive Recharts visualizations
- PDF generation with ReportLab
- Sample data seeding
- Business framing CRUD

## Architecture
- Backend: FastAPI + MongoDB + Emergent LLM
- Frontend: React + Tailwind + Shadcn/UI + Recharts
- Design: Swiss Enterprise Light theme (Manrope + Inter fonts)

## Prioritized Backlog
### P0 (Complete)
- Dashboard, charts, KPIs, AI insights, PDF export

### P1 (Next)
- Demo video recording capability
- Custom data CSV import
- More chart types

### P2 (Future)
- User authentication
- Saved report templates
- Email report delivery
