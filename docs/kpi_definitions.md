# KPI Definitions Reference
## Financial Forecasting & KPI Dashboard

---

This document provides detailed definitions for all KPIs calculated by the dashboard. Use this as a reference when interpreting results.

---

## Revenue & Growth KPIs

### Revenue
- **Definition**: Total recognized revenue for the period
- **Formula**: Sum of all revenue line items
- **Interpretation**: The primary top-line performance metric
- **Target**: Growth depends on company stage; 10-20% YoY for growth companies

### Month-over-Month (MoM) Growth
- **Definition**: Percentage change in revenue from prior month
- **Formula**: `(Current Month Revenue - Prior Month Revenue) / Prior Month Revenue × 100`
- **Interpretation**: 
  - Positive = Growth momentum
  - Negative = Contraction
  - Compare to historical average for context
- **Caution**: Subject to seasonality; Q4→Q1 drops are common

### Year-over-Year (YoY) Growth
- **Definition**: Percentage change vs same month in prior year
- **Formula**: `(Current Month Revenue - Same Month Last Year) / Same Month Last Year × 100`
- **Interpretation**: Removes seasonality; more reliable for trend analysis
- **Target**: Industry-dependent; 15%+ indicates strong performance

---

## Profitability KPIs

### Gross Profit
- **Definition**: Revenue remaining after direct costs
- **Formula**: `Revenue - Cost of Goods Sold (COGS)`
- **Interpretation**: Measures production/delivery efficiency
- **Example**: If Revenue = $2.45M and COGS = $1.47M, Gross Profit = $980K

### Gross Margin
- **Definition**: Gross profit as a percentage of revenue
- **Formula**: `Gross Profit / Revenue × 100`
- **Interpretation**:
  - Higher = Better pricing power or cost efficiency
  - Declining = Pricing pressure or rising input costs
- **Benchmarks**:
  - Software/SaaS: 70-85%
  - Manufacturing: 25-35%
  - Retail: 25-35%
  - Services: 40-60%

### Operating Income
- **Definition**: Profit from core business operations
- **Formula**: `Gross Profit - Operating Expenses`
- **Also called**: EBIT (Earnings Before Interest and Taxes)
- **Interpretation**: Core business profitability before financing costs

### Operating Margin
- **Definition**: Operating income as a percentage of revenue
- **Formula**: `Operating Income / Revenue × 100`
- **Interpretation**:
  - Shows how efficiently you convert revenue to operating profit
  - Improving margin = Operating leverage
- **Target**: 15-25% is healthy; 25%+ is excellent

### EBITDA
- **Definition**: Earnings Before Interest, Taxes, Depreciation, and Amortization
- **Formula**: `Operating Income + Depreciation + Amortization`
- **In this tool**: Approximated as Operating Income (assumes minimal D&A)
- **Use case**: Comparing companies with different capital structures

### EBITDA Margin
- **Definition**: EBITDA as a percentage of revenue
- **Formula**: `EBITDA / Revenue × 100`
- **Target**: 20%+ indicates strong operating performance

### Net Income
- **Definition**: Bottom-line profit after all expenses
- **Formula**: `Revenue - All Expenses (COGS, OpEx, Interest, Taxes)`
- **In this tool**: Uses provided value or estimates from EBITDA
- **Interpretation**: Ultimate measure of profitability

### Net Margin (Net Profit Margin)
- **Definition**: Net income as a percentage of revenue
- **Formula**: `Net Income / Revenue × 100`
- **Interpretation**:
  - <0% = Losing money
  - 0-5% = Low profitability
  - 5-10% = Moderate profitability
  - 10%+ = Strong profitability

---

## Efficiency KPIs

### Operating Expense Ratio (OpEx Ratio)
- **Definition**: Operating expenses as a percentage of revenue
- **Formula**: `Operating Expenses / Revenue × 100`
- **Interpretation**:
  - Lower = More efficient
  - Increasing = Expenses growing faster than revenue
  - Decreasing = Operating leverage improving
- **Target**: <25% shows good expense control

### Revenue per Employee
- **Definition**: Revenue generated per full-time employee
- **Formula**: `Total Revenue / Number of Employees`
- **Interpretation**:
  - Higher = More productive workforce
  - Increasing = Scaling efficiently
- **Benchmarks**:
  - Software: $200K-$400K
  - Services: $100K-$200K
  - Retail: $100K-$150K

### ARPU (Average Revenue Per User)
- **Definition**: Revenue generated per customer
- **Formula**: `Total Revenue / Number of Customers`
- **Interpretation**:
  - Higher = More valuable customers
  - Increasing = Successful upselling/pricing
- **Use case**: SaaS, subscription, and customer-centric businesses

---

## Liquidity KPIs

### Current Ratio
- **Definition**: Ability to pay short-term obligations
- **Formula**: `Current Assets / Current Liabilities`
- **Interpretation**:
  - <1.0 = May struggle to pay bills
  - 1.0-1.5 = Tight but manageable
  - 1.5-2.0 = Healthy
  - >2.0 = Very liquid (possibly too conservative)

### Quick Ratio (Acid Test)
- **Definition**: Ability to pay obligations without selling inventory
- **Formula**: `(Cash + Accounts Receivable) / Current Liabilities`
- **More conservative** than Current Ratio
- **Interpretation**:
  - <0.5 = Liquidity risk
  - 0.5-1.0 = Tight
  - >1.0 = Healthy

### Cash Runway
- **Definition**: How many months can you operate with current cash
- **Formula**: `Cash Balance / Monthly Burn Rate`
- **Interpretation**:
  - <6 months = Urgent fundraising needed
  - 6-12 months = Planning fundraise
  - 12-18 months = Comfortable
  - 18+ months = Strategic flexibility
- **Note**: Burn rate = Cash out - Cash in (or approximated from losses)

### Debt-to-Equity Ratio
- **Definition**: Financial leverage measure
- **Formula**: `Total Debt / Shareholder Equity`
- **Interpretation**:
  - <0.5 = Conservative, low risk
  - 0.5-1.0 = Moderate leverage
  - >1.0 = High leverage
  - >2.0 = Significant financial risk

---

## Variance Analysis Terms

### Variance
- **Definition**: Difference between actual and comparison (prior period or budget)
- **Formula**: `Actual - Comparison`
- **Types**:
  - **Favorable**: Better than expected (higher revenue, lower costs)
  - **Unfavorable**: Worse than expected

### Variance Percent
- **Definition**: Variance as a percentage of the comparison value
- **Formula**: `(Actual - Comparison) / |Comparison| × 100`

### Variance Drivers
- **Definition**: Underlying causes explaining the variance
- **Categories**:
  - **Volume**: Changes in quantity/units sold
  - **Price**: Changes in selling price or rates
  - **Mix**: Changes in product/customer composition
  - **Timing**: Acceleration or delays

---

## Forecast Scenarios

### Base Case
- **Assumption**: Continue current growth trajectory
- **Use**: Default planning scenario
- **Growth rate**: Historical average MoM growth

### Upside Case
- **Assumption**: Accelerated growth with margin improvement
- **Use**: Best-case planning, stretch goals
- **Growth rate**: 150% of historical average

### Downside Case
- **Assumption**: Slower growth with margin pressure
- **Use**: Conservative planning, risk assessment
- **Growth rate**: 50% of historical average

### Stress Case
- **Assumption**: Revenue decline with cost pressure
- **Use**: Worst-case planning, crisis preparation
- **Growth rate**: Negative growth (e.g., -5% MoM)

---

## How KPIs Are Calculated in This Tool

All calculations happen **server-side** in Python for transparency and auditability.

```python
# Example: Gross Margin calculation
gross_profit = revenue - cogs
gross_margin = (gross_profit / revenue) * 100 if revenue > 0 else 0
```

The formulas are documented in `backend/server.py` with comments explaining each step.

---

## Using KPIs for Decision-Making

| Situation | Key KPIs to Monitor |
|-----------|---------------------|
| **Board Meeting** | Revenue, Margins, Cash Runway |
| **Monthly Review** | MoM Growth, Variance Analysis |
| **Fundraising** | Growth Rate, Burn Rate, Runway |
| **Cost Cutting** | OpEx Ratio, Revenue per Employee |
| **Pricing Decisions** | Gross Margin, ARPU |
| **Liquidity Crisis** | Current Ratio, Quick Ratio, Cash |

---

*This reference document accompanies the Financial Forecasting & KPI Dashboard. For questions about specific calculations, review the server.py source code.*
