-- Forecast vs Actual Revenue Analysis
-- Compares actual performance against forecasted revenue

SELECT
    r.year,
    r.month,
    SUM(r.revenue_amount) AS actual_revenue,
    SUM(f.forecast_revenue) AS forecast_revenue,
    SUM(r.revenue_amount) - SUM(f.forecast_revenue) AS revenue_variance
FROM fact_revenue r
JOIN fact_forecast f
    ON r.year = f.year
   AND r.month = f.month
GROUP BY r.year, r.month
ORDER BY r.year, r.month;
