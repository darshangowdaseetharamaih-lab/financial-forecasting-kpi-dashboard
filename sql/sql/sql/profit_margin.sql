-- Profit and Profit Margin Analysis
-- Calculates profitability metrics for financial performance evaluation

SELECT
    r.year,
    r.month,
    SUM(r.revenue_amount) AS total_revenue,
    SUM(e.expense_amount) AS total_expenses,
    SUM(r.revenue_amount) - SUM(e.expense_amount) AS profit,
    (SUM(r.revenue_amount) - SUM(e.expense_amount)) * 1.0 / SUM(r.revenue_amount) AS profit_margin
FROM fact_revenue r
JOIN fact_expenses e
    ON r.year = e.year
   AND r.month = e.month
GROUP BY r.year, r.month
ORDER BY r.year, r.month;
