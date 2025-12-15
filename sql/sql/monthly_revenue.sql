-- Monthly Revenue Trend
-- Calculates total revenue by month for financial performance tracking

SELECT
    year,
    month,
    SUM(revenue_amount) AS total_revenue
FROM fact_revenue
GROUP BY year, month
ORDER BY year, month;
