---
description: 'Forecast sales revenue based on batch data using MCP'
argument-hint: '[batch-id]'
---

# Sales Forecast

Project revenue based on current batch performance and market conditions.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Species**: All 6 livestock types
**Currency**: Multi-currency - use user preference

## Forecast Scope

**Batch**: $ARGUMENTS

## MCP Integration

**Use Neon MCP for all data queries:**

```
# List active batches for forecasting
neon__run_sql "SELECT id, batchName, species, currentQuantity, targetHarvestDate FROM batches WHERE status = 'active'"
```

## Data Collection (MCP)

### 1. Current Batch Status

```
neon__run_sql "
  SELECT
    batchName,
    species,
    initialQuantity,
    currentQuantity,
    acquisitionDate,
    targetHarvestDate,
    targetWeightKg
  FROM batches
  WHERE id = 'batch-id'
"
```

### 2. Current Weight Data

```
neon__run_sql "
  SELECT
    ROUND(AVG(averageWeightKg)::numeric, 3) as avg_weight,
    MAX(date) as last_sample,
    COUNT(*) as sample_count
  FROM weight_samples
  WHERE batchId = 'batch-id'
  ORDER BY date DESC
  LIMIT 1
"
```

### 3. Growth Rate (ADG)

```
neon__run_sql "
  WITH recent_samples AS (
    SELECT averageWeightKg, date
    FROM weight_samples
    WHERE batchId = 'batch-id'
    ORDER BY date DESC
    LIMIT 2
  )
  SELECT
    ROUND(((MAX(averageWeightKg) - MIN(averageWeightKg)) /
      NULLIF(EXTRACT(DAY FROM MAX(date) - MIN(date)), 0) * 1000)::numeric, 1) as adg_grams
  FROM recent_samples
"
```

### 4. Historical Sales Data (Market Prices)

```
neon__run_sql "
  SELECT
    ROUND(AVG(unitPrice)::numeric, 2) as avg_price,
    ROUND(MIN(unitPrice)::numeric, 2) as min_price,
    ROUND(MAX(unitPrice)::numeric, 2) as max_price,
    COUNT(*) as sales_count
  FROM sales s
  JOIN batches b ON s.batchId = b.id
  WHERE b.species = 'Broiler'
    AND s.date > NOW() - INTERVAL '3 months'
"
```

### 5. Total Costs (for Profit Projection)

```
neon__run_sql "
  WITH costs AS (
    SELECT
      COALESCE((SELECT SUM(cost) FROM feed_records WHERE batchId = 'batch-id'), 0) as feed_cost,
      COALESCE((SELECT SUM(amount) FROM expenses WHERE batchId = 'batch-id'), 0) as other_cost,
      COALESCE((SELECT acquisitionCost FROM batches WHERE id = 'batch-id'), 0) as acquisition_cost
  )
  SELECT
    ROUND((feed_cost + other_cost + acquisition_cost)::numeric, 2) as total_cost
  FROM costs
"
```

## Forecast Inputs

### Quantity Available

```
Saleable Quantity = Current Stock - Expected Mortality
```

### Projected Weight at Harvest

```
Projected Weight = Current Weight + (ADG × Days to Harvest)
```

### Price Assumptions

- Current market price
- Seasonal adjustment
- Quality premium/discount

## Revenue Projections

### Base Case

```
Revenue = Quantity × Projected Weight × Expected Price
```

### Scenarios

| Scenario    | Price  | Quantity | Weight | Revenue     |
| ----------- | ------ | -------- | ------ | ----------- |
| Optimistic  | +10%   | 100%     | +5%    | [Currency]X |
| Base        | Market | 95%      | Target | [Currency]X |
| Pessimistic | -10%   | 90%      | -5%    | [Currency]X |

## Market Factors

### Seasonal Patterns (Nigeria)

| Period  | Demand            | Price Trend |
| ------- | ----------------- | ----------- |
| Jan-Mar | High (Dry season) | ↑           |
| Apr-Jun | Medium            | →           |
| Jul-Sep | Low (Rainy)       | ↓           |
| Oct-Dec | High (Festive)    | ↑↑          |

### Current Market Prices (Update regularly)

| Product           | Price Range              |
| ----------------- | ------------------------ |
| Broiler (live)    | [Currency]2,500-3,500/kg |
| Broiler (dressed) | [Currency]3,500-4,500/kg |
| Catfish (live)    | [Currency]1,500-2,500/kg |
| Catfish (smoked)  | [Currency]3,000-4,000/kg |

## Output Report

```markdown
# Sales Forecast: [Batch Name]

**Forecast Date**: [Date]
**Projected Harvest**: [Date]

## Batch Summary

- **Current Stock**: X birds/fish
- **Current Avg Weight**: X.XX kg
- **Days to Harvest**: X days

## Quantity Forecast

| Metric             | Value  |
| ------------------ | ------ |
| Current Stock      | X      |
| Expected Mortality | X (X%) |
| Saleable Quantity  | X      |

## Weight Forecast

| Metric         | Value    |
| -------------- | -------- |
| Current Weight | X.XX kg  |
| Projected ADG  | X g/day  |
| Harvest Weight | X.XX kg  |
| Total Weight   | X,XXX kg |

## Revenue Scenarios

### Optimistic (Best Case)

- **Price**: [Currency]X/kg (+10%)
- **Quantity**: X (100% survival)
- **Weight**: X.XX kg (+5%)
- **Revenue**: [Currency]X

### Base Case (Expected)

- **Price**: [Currency]X/kg (market)
- **Quantity**: X (95% survival)
- **Weight**: X.XX kg (target)
- **Revenue**: [Currency]X

### Pessimistic (Worst Case)

- **Price**: [Currency]X/kg (-10%)
- **Quantity**: X (90% survival)
- **Weight**: X.XX kg (-5%)
- **Revenue**: [Currency]X

## Profitability Projection

| Scenario    | Revenue     | Est. Cost   | Profit      | Margin |
| ----------- | ----------- | ----------- | ----------- | ------ |
| Optimistic  | [Currency]X | [Currency]X | [Currency]X | X%     |
| Base        | [Currency]X | [Currency]X | [Currency]X | X%     |
| Pessimistic | [Currency]X | [Currency]X | [Currency]X | X%     |

## Market Recommendations

1. **Timing**: [Best time to sell based on market]
2. **Pricing**: [Recommended price strategy]
3. **Channels**: [Recommended sales channels]

## Risk Factors

- [Market risk]
- [Production risk]
- [Price volatility]

## Action Items

1. [Pre-sales preparation]
2. [Customer outreach]
3. [Logistics planning]
```

## Confidence Level

Rate forecast confidence:

- 🟢 **High**: Recent weight data (<7 days), stable market, >3 historical sales
- 🟡 **Medium**: Some data gaps, normal volatility, 1-3 historical sales
- 🔴 **Low**: Limited data (>14 days old), high market uncertainty, no historical sales

## Agent Delegation

- `@data-analyst` - Advanced forecasting models and statistical analysis
- `@livestock-specialist` - Production factors affecting saleable quantity

## Related Prompts

- `@growth-forecast` - Weight projections for revenue calculation
- `@financial-report` - Full P&L including this forecast
- `@batch-analysis` - Production metrics affecting forecast
- `@cost-analysis` - Cost data for profit projection
