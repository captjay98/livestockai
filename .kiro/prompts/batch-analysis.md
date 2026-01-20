---
description: 'Analyze batch performance metrics and provide insights using MCP'
argument-hint: "[batch-id or 'all']"
---

# Batch Performance Analysis

Analyze livestock batch performance and provide actionable insights.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Species**: All 6 livestock types with species-specific metrics
**Currency**: Multi-currency (USD, EUR, NGN, etc.) - use user's preference
**Database**: PostgreSQL (Neon) via Kysely ORM

## Analysis Scope

**Batch**: $ARGUMENTS (or analyze all active batches if not specified)

## MCP Integration

**Use Neon MCP for all data queries:**

```
# Get batch overview
neon__run_sql "SELECT id, batchName, species, status, initialQuantity, currentQuantity, acquisitionDate FROM batches WHERE status = 'active'"

# Get specific batch
neon__run_sql "SELECT * FROM batches WHERE id = 'batch-id'"
```

## Data to Gather

### 1. Batch Overview (MCP)

```
neon__run_sql "
  SELECT
    b.id, b.batchName, b.species, b.livestockType, b.status,
    b.initialQuantity, b.currentQuantity,
    b.acquisitionDate, b.targetHarvestDate,
    f.name as farmName
  FROM batches b
  JOIN farms f ON b.farmId = f.id
  WHERE b.id = 'batch-id'
"
```

### 2. Mortality Analysis (MCP)

```
neon__run_sql "
  SELECT
    SUM(quantity) as total_deaths,
    ROUND((SUM(quantity)::numeric / b.initialQuantity * 100), 2) as mortality_rate,
    cause,
    COUNT(*) as incidents
  FROM mortality_records m
  JOIN batches b ON m.batchId = b.id
  WHERE m.batchId = 'batch-id'
  GROUP BY cause, b.initialQuantity
  ORDER BY total_deaths DESC
"
```

### 3. Growth Performance (MCP)

```
neon__run_sql "
  SELECT
    date,
    ROUND(averageWeightKg::numeric, 3) as avg_weight,
    ROUND(minWeightKg::numeric, 3) as min_weight,
    ROUND(maxWeightKg::numeric, 3) as max_weight,
    sampleSize
  FROM weight_samples
  WHERE batchId = 'batch-id'
  ORDER BY date
"
```

### 4. Feed Consumption (MCP)

```
neon__run_sql "
  SELECT
    feedType,
    ROUND(SUM(quantityKg::numeric), 2) as total_feed_kg,
    ROUND(SUM(cost::numeric), 2) as total_feed_cost
  FROM feed_records
  WHERE batchId = 'batch-id'
  GROUP BY feedType
"
```

### 5. Sales Revenue (MCP)

```
neon__run_sql "
  SELECT
    SUM(quantity) as total_sold,
    ROUND(SUM(totalAmount::numeric), 2) as total_revenue,
    ROUND(AVG(unitPrice::numeric), 2) as avg_price
  FROM sales
  WHERE batchId = 'batch-id'
"
```

## Key Metrics to Calculate

### For Broilers (Ross 308 Standards)

| Metric         | Formula                        | Target     | Warning  |
| -------------- | ------------------------------ | ---------- | -------- |
| Mortality Rate | (Deaths / Initial) × 100       | <5%        | >8%      |
| FCR            | Total Feed / Total Weight Gain | 1.6-1.8    | >2.0     |
| ADG            | Weight Gain / Days             | 50-60g/day | <40g/day |
| Days to 2kg    | Days from start to 2kg avg     | 35-42 days | >50 days |

### For Catfish

| Metric        | Formula                        | Target         | Warning |
| ------------- | ------------------------------ | -------------- | ------- |
| Survival Rate | (Current / Initial) × 100      | >90%           | <85%    |
| FCR           | Total Feed / Total Weight Gain | 1.2-1.5        | >1.8    |
| Growth Rate   | Weight Gain / Days             | Varies by size | -       |

## Analysis Output Format

### Performance Summary

```markdown
## Batch Performance: [Batch Name]

### Status: 🟢 Good / 🟡 Warning / 🔴 Critical

| Metric         | Actual | Target  | Status   |
| -------------- | ------ | ------- | -------- |
| Mortality Rate | X%     | <5%     | ✅/⚠️/❌ |
| FCR            | X.XX   | 1.6-1.8 | ✅/⚠️/❌ |
| ADG            | Xg/day | 50-60g  | ✅/⚠️/❌ |

### Financial Summary

- **Feed Cost**: [Currency Symbol]X,XXX (based on user settings)
- **Revenue (if sold)**: [Currency Symbol]X,XXX
- **Projected Profit**: [Currency Symbol]X,XXX

**Note**: Currency display uses user's preference from settings (USD, EUR, NGN, etc.)

### Issues Identified

1. [Issue with severity and recommendation]
2. [Issue with severity and recommendation]

### Recommendations

1. [Actionable recommendation]
2. [Actionable recommendation]
```

## Agent Delegation

For comprehensive analysis, delegate to specialized agents:

- `@livestock-specialist` - Domain expertise on species-specific issues
- `@data-analyst` - Advanced statistical analysis and forecasting

## Related Prompts

- `@mortality-analysis` - Deep dive into mortality patterns
- `@growth-forecast` - Predict harvest timing
- `@feed-optimization` - Improve feed efficiency
- `@financial-report` - Full P&L analysis

### Recommendations

- Specific actions to improve performance
- Feed adjustments
- Management changes

### Financial Impact

- Projected profit/loss
- Cost per kg produced
- Revenue forecast

## Report Format

```markdown
# Batch Analysis: [Batch Name]

## Summary

- **Status**: [Good/Warning/Critical]
- **Days Active**: X days
- **Current Stock**: X birds/fish

## Key Metrics

| Metric    | Value | Target  | Status   |
| --------- | ----- | ------- | -------- |
| Mortality | X%    | <5%     | ✅/⚠️/❌ |
| FCR       | X     | 1.6-1.8 | ✅/⚠️/❌ |
| ADG       | Xg    | 50-60g  | ✅/⚠️/❌ |

## Issues

1. [Issue description]
2. [Issue description]

## Recommendations

1. [Action item]
2. [Action item]

## Financial Projection

- Estimated Revenue: [Currency]X
- Estimated Cost: [Currency]X
- Projected Profit: [Currency]X

**Note**: All financial values use user's currency preference
```
