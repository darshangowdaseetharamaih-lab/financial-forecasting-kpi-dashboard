-- Liquidity Ratio Analysis
-- Evaluates short-term financial health using current assets and liabilities

SELECT
    year,
    month,
    SUM(current_assets) AS total_current_assets,
    SUM(current_liabilities) AS total_current_liabilities,
    SUM(current_assets) * 1.0 / SUM(current_liabilities) AS liquidity_ratio
FROM fact_cash
GROUP BY year, month
ORDER BY year, month;
