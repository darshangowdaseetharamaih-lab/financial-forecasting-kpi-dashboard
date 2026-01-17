-- =============================================================================
-- FINANCIAL FORECASTING & KPI DASHBOARD - SQL QUERIES
-- =============================================================================
-- Purpose: Core analytics queries for KPI calculations and variance analysis
-- Database: Athena/Redshift/PostgreSQL compatible
-- Author: AI Business Analyst Copilot
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. REVENUE ANALYSIS QUERIES
-- -----------------------------------------------------------------------------

-- Monthly Revenue Summary
SELECT 
    DATE_TRUNC('month', transaction_date) AS month,
    SUM(amount) AS total_revenue,
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(amount) / COUNT(DISTINCT customer_id) AS arpu,
    LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', transaction_date)) AS prev_month_revenue,
    (SUM(amount) - LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', transaction_date))) 
        / LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', transaction_date)) * 100 AS mom_growth
FROM revenue_transactions
WHERE transaction_date >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', transaction_date)
ORDER BY month DESC;

-- Revenue by Customer Segment
SELECT 
    c.segment,
    COUNT(DISTINCT r.customer_id) AS customer_count,
    SUM(r.amount) AS total_revenue,
    SUM(r.amount) / COUNT(DISTINCT r.customer_id) AS avg_revenue_per_customer,
    SUM(r.amount) * 100.0 / SUM(SUM(r.amount)) OVER () AS revenue_share_pct
FROM revenue_transactions r
JOIN customers c ON r.customer_id = c.id
WHERE r.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY c.segment
ORDER BY total_revenue DESC;

-- Revenue by Product Line
SELECT 
    product_category,
    SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
             THEN amount ELSE 0 END) AS current_month,
    SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' 
             THEN amount ELSE 0 END) AS prev_month,
    SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
             THEN amount ELSE 0 END) - 
    SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' 
             THEN amount ELSE 0 END) AS mom_change
FROM revenue_transactions
WHERE transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months'
GROUP BY product_category
ORDER BY current_month DESC;

-- -----------------------------------------------------------------------------
-- 2. VARIANCE ANALYSIS QUERIES
-- -----------------------------------------------------------------------------

-- Budget vs Actual Variance
SELECT 
    b.account_name,
    b.account_category,
    b.budget_amount,
    COALESCE(a.actual_amount, 0) AS actual_amount,
    COALESCE(a.actual_amount, 0) - b.budget_amount AS variance_amount,
    CASE 
        WHEN b.budget_amount = 0 THEN 0
        ELSE (COALESCE(a.actual_amount, 0) - b.budget_amount) / b.budget_amount * 100 
    END AS variance_pct,
    CASE 
        WHEN b.account_category = 'Revenue' AND COALESCE(a.actual_amount, 0) > b.budget_amount THEN 'Favorable'
        WHEN b.account_category = 'Expense' AND COALESCE(a.actual_amount, 0) < b.budget_amount THEN 'Favorable'
        ELSE 'Unfavorable'
    END AS variance_status
FROM budget b
LEFT JOIN (
    SELECT account_name, SUM(amount) AS actual_amount
    FROM actuals
    WHERE period = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY account_name
) a ON b.account_name = a.account_name
WHERE b.period = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY ABS(COALESCE(a.actual_amount, 0) - b.budget_amount) DESC;

-- Forecast Accuracy by Month
SELECT 
    f.period,
    f.line_item,
    f.forecast_amount,
    a.actual_amount,
    a.actual_amount - f.forecast_amount AS variance,
    CASE 
        WHEN f.forecast_amount = 0 THEN 0
        ELSE 100 - ABS((a.actual_amount - f.forecast_amount) / f.forecast_amount * 100)
    END AS accuracy_pct,
    CASE 
        WHEN a.actual_amount > f.forecast_amount THEN 'Under-forecast'
        WHEN a.actual_amount < f.forecast_amount THEN 'Over-forecast'
        ELSE 'Accurate'
    END AS bias
FROM forecast f
JOIN (
    SELECT period, line_item, SUM(amount) AS actual_amount
    FROM actuals
    GROUP BY period, line_item
) a ON f.period = a.period AND f.line_item = a.line_item
WHERE f.period >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '6 months'
ORDER BY f.period DESC, f.line_item;

-- -----------------------------------------------------------------------------
-- 3. KPI CALCULATION QUERIES
-- -----------------------------------------------------------------------------

-- Core Financial KPIs
WITH monthly_financials AS (
    SELECT 
        period,
        SUM(CASE WHEN account_category = 'Revenue' THEN amount ELSE 0 END) AS revenue,
        SUM(CASE WHEN account_category = 'COGS' THEN amount ELSE 0 END) AS cogs,
        SUM(CASE WHEN account_category = 'Operating Expense' THEN amount ELSE 0 END) AS opex,
        SUM(CASE WHEN account_category IN ('Revenue', 'COGS', 'Operating Expense') 
                 THEN amount ELSE 0 END) AS operating_income
    FROM actuals
    GROUP BY period
)
SELECT 
    period,
    revenue,
    cogs,
    opex,
    revenue - cogs AS gross_profit,
    (revenue - cogs) / NULLIF(revenue, 0) * 100 AS gross_margin_pct,
    revenue - cogs - opex AS operating_income,
    (revenue - cogs - opex) / NULLIF(revenue, 0) * 100 AS operating_margin_pct,
    opex / NULLIF(revenue, 0) * 100 AS opex_ratio_pct
FROM monthly_financials
ORDER BY period DESC;

-- Customer Unit Economics
WITH customer_metrics AS (
    SELECT 
        DATE_TRUNC('month', r.transaction_date) AS month,
        COUNT(DISTINCT r.customer_id) AS active_customers,
        SUM(r.amount) AS total_revenue,
        COUNT(DISTINCT CASE WHEN c.created_date >= DATE_TRUNC('month', r.transaction_date) 
                            THEN c.id END) AS new_customers,
        COUNT(DISTINCT CASE WHEN c.churned_date IS NOT NULL 
                            AND c.churned_date BETWEEN DATE_TRUNC('month', r.transaction_date) 
                            AND DATE_TRUNC('month', r.transaction_date) + INTERVAL '1 month'
                            THEN c.id END) AS churned_customers
    FROM revenue_transactions r
    JOIN customers c ON r.customer_id = c.id
    GROUP BY DATE_TRUNC('month', r.transaction_date)
)
SELECT 
    month,
    active_customers,
    total_revenue,
    total_revenue / NULLIF(active_customers, 0) AS arpu,
    new_customers,
    churned_customers,
    churned_customers * 100.0 / NULLIF(active_customers, 0) AS churn_rate_pct,
    (total_revenue / NULLIF(active_customers, 0)) * 12 * 3 AS estimated_ltv  -- Assuming 3yr avg lifetime
FROM customer_metrics
ORDER BY month DESC;

-- Liquidity Metrics
SELECT 
    period,
    SUM(CASE WHEN account_type = 'Cash' THEN balance ELSE 0 END) AS cash_balance,
    SUM(CASE WHEN account_type = 'Accounts Receivable' THEN balance ELSE 0 END) AS ar_balance,
    SUM(CASE WHEN account_type = 'Accounts Payable' THEN balance ELSE 0 END) AS ap_balance,
    SUM(CASE WHEN account_type IN ('Cash', 'Accounts Receivable', 'Inventory') 
             THEN balance ELSE 0 END) AS current_assets,
    SUM(CASE WHEN account_type IN ('Accounts Payable', 'Accrued Expenses', 'Short-term Debt') 
             THEN balance ELSE 0 END) AS current_liabilities,
    SUM(CASE WHEN account_type IN ('Cash', 'Accounts Receivable', 'Inventory') THEN balance ELSE 0 END) /
    NULLIF(SUM(CASE WHEN account_type IN ('Accounts Payable', 'Accrued Expenses', 'Short-term Debt') 
                    THEN balance ELSE 0 END), 0) AS current_ratio,
    (SUM(CASE WHEN account_type = 'Cash' THEN balance ELSE 0 END) + 
     SUM(CASE WHEN account_type = 'Accounts Receivable' THEN balance ELSE 0 END)) /
    NULLIF(SUM(CASE WHEN account_type IN ('Accounts Payable', 'Accrued Expenses', 'Short-term Debt') 
                    THEN balance ELSE 0 END), 0) AS quick_ratio
FROM balance_sheet
WHERE period = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY period;

-- -----------------------------------------------------------------------------
-- 4. TREND ANALYSIS QUERIES
-- -----------------------------------------------------------------------------

-- 6-Month Rolling Metrics
SELECT 
    period,
    revenue,
    AVG(revenue) OVER (ORDER BY period ROWS BETWEEN 5 PRECEDING AND CURRENT ROW) AS revenue_6mo_avg,
    gross_margin,
    AVG(gross_margin) OVER (ORDER BY period ROWS BETWEEN 5 PRECEDING AND CURRENT ROW) AS margin_6mo_avg,
    revenue - LAG(revenue) OVER (ORDER BY period) AS mom_revenue_change,
    (revenue - LAG(revenue, 12) OVER (ORDER BY period)) / 
        NULLIF(LAG(revenue, 12) OVER (ORDER BY period), 0) * 100 AS yoy_growth_pct
FROM (
    SELECT 
        period,
        SUM(CASE WHEN account_category = 'Revenue' THEN amount ELSE 0 END) AS revenue,
        (SUM(CASE WHEN account_category = 'Revenue' THEN amount ELSE 0 END) - 
         SUM(CASE WHEN account_category = 'COGS' THEN amount ELSE 0 END)) /
        NULLIF(SUM(CASE WHEN account_category = 'Revenue' THEN amount ELSE 0 END), 0) * 100 AS gross_margin
    FROM actuals
    GROUP BY period
) monthly_data
ORDER BY period DESC
LIMIT 12;

-- Revenue Cohort Analysis
SELECT 
    DATE_TRUNC('month', c.created_date) AS cohort_month,
    EXTRACT(MONTH FROM AGE(r.transaction_date, c.created_date)) AS months_since_acquisition,
    COUNT(DISTINCT r.customer_id) AS active_customers,
    SUM(r.amount) AS cohort_revenue
FROM customers c
JOIN revenue_transactions r ON c.id = r.customer_id
WHERE c.created_date >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', c.created_date), 
         EXTRACT(MONTH FROM AGE(r.transaction_date, c.created_date))
ORDER BY cohort_month, months_since_acquisition;

-- -----------------------------------------------------------------------------
-- 5. EXECUTIVE DASHBOARD QUERIES
-- -----------------------------------------------------------------------------

-- Executive Summary View (Single Query)
WITH current_month AS (
    SELECT 
        SUM(CASE WHEN account_category = 'Revenue' THEN amount ELSE 0 END) AS revenue,
        SUM(CASE WHEN account_category = 'COGS' THEN amount ELSE 0 END) AS cogs,
        SUM(CASE WHEN account_category = 'Operating Expense' THEN amount ELSE 0 END) AS opex
    FROM actuals
    WHERE period = DATE_TRUNC('month', CURRENT_DATE)
),
prev_month AS (
    SELECT 
        SUM(CASE WHEN account_category = 'Revenue' THEN amount ELSE 0 END) AS revenue,
        SUM(CASE WHEN account_category = 'COGS' THEN amount ELSE 0 END) AS cogs,
        SUM(CASE WHEN account_category = 'Operating Expense' THEN amount ELSE 0 END) AS opex
    FROM actuals
    WHERE period = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
),
cash_position AS (
    SELECT SUM(balance) AS cash_balance
    FROM balance_sheet
    WHERE account_type = 'Cash' AND period = DATE_TRUNC('month', CURRENT_DATE)
)
SELECT 
    c.revenue AS current_revenue,
    p.revenue AS prev_revenue,
    (c.revenue - p.revenue) / NULLIF(p.revenue, 0) * 100 AS revenue_growth_pct,
    (c.revenue - c.cogs) / NULLIF(c.revenue, 0) * 100 AS gross_margin_pct,
    (c.revenue - c.cogs - c.opex) / NULLIF(c.revenue, 0) * 100 AS operating_margin_pct,
    cp.cash_balance,
    cp.cash_balance / NULLIF((c.opex - (c.revenue - c.cogs - c.opex)), 0) AS runway_months
FROM current_month c, prev_month p, cash_position cp;

-- =============================================================================
-- END OF QUERIES
-- =============================================================================
