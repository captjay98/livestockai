---
description: 'Analyze costs and identify optimization opportunities using MCP'
argument-hint: "[batch-id or 'farm']"
---

# Cost Analysis

Deep dive into cost structure and identify savings opportunities.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Species**: All 6 livestock types
**Currency**: Multi-currency - use user preference

## Analysis Scope

**Scope**: $ARGUMENTS

## MCP Integration

**Use Neon MCP for all data queries:**

```
# List farms and batches with expenses
neon__run_sql "SELECT DISTINCT f.id, f.name FROM farms f JOIN expenses e ON f.id = e.farmId"
```

## Data Collection (MCP)

### 1. All Costs by Category

```
neon__run_sql "
  SELECT
    category,
    ROUND(SUM(amount)::numeric, 2) as total,
    COUNT(*) as transactions,
    MIN(date) as first_expense,
    MAX(date) as last_expense
  FROM expenses
  WHERE farmId = 'farm-id'
  GROUP BY category
  ORDER BY total DESC
"
```

### 2. Feed Cost Details

```
neon__run_sql "
  SELECT
    feedType,
    ROUND(SUM(quantityKg)::numeric, 2) as total_kg,
    ROUND(SUM(cost)::numeric, 2) as total_cost,
    ROUND(AVG(cost / NULLIF(quantityKg, 0))::numeric, 2) as avg_price_per_kg
  FROM feed_records
  WHERE batchId = 'batch-id'
  GROUP BY feedType
"
```

### 3. Cost Trends (Monthly)

```
neon__run_sql "
  SELECT
    DATE_TRUNC('month', date) as month,
    category,
    ROUND(SUM(amount)::numeric, 2) as monthly_cost
  FROM expenses
  WHERE farmId = 'farm-id'
    AND date >= NOW() - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', date), category
  ORDER BY month, category
"
```

### 4. Total Cost Summary

```
neon__run_sql "
  WITH feed_costs AS (
    SELECT SUM(cost) as feed_total FROM feed_records WHERE batchId = 'batch-id'
  ),
  other_costs AS (
    SELECT SUM(amount) as other_total FROM expenses WHERE batchId = 'batch-id'
  ),
  acquisition AS (
    SELECT acquisitionCost FROM batches WHERE id = 'batch-id'
  )
  SELECT
    ROUND(f.feed_total::numeric, 2) as feed_cost,
    ROUND(o.other_total::numeric, 2) as other_cost,
    ROUND(a.acquisitionCost::numeric, 2) as acquisition_cost,
    ROUND((COALESCE(f.feed_total, 0) + COALESCE(o.other_total, 0) + COALESCE(a.acquisitionCost, 0))::numeric, 2) as total_cost
  FROM feed_costs f, other_costs o, acquisition a
"
```

## Cost Categories

### Direct Costs (Variable)

- **Feed**: 60-70% of total cost
- **Day-old chicks/Fingerlings**: 10-15%
- **Medications/Vaccines**: 3-5%
- **Direct Labor**: 5-10%

### Indirect Costs (Fixed)

- **Utilities**: Electricity, water
- **Rent/Depreciation**: Housing, equipment
- **Administrative**: Office, communication
- **Maintenance**: Repairs, cleaning

## Analysis Metrics

### Cost per Unit

```
Cost per Bird = Total Cost / Number of Birds Placed
Cost per kg = Total Cost / Total Weight Produced
```

### Cost Efficiency

```
Feed Cost % = Feed Cost / Total Cost × 100
Labor Cost % = Labor Cost / Total Cost × 100
```

### Cost Trends

- Month-over-month change
- Year-over-year comparison
- Seasonal patterns

## Output Report

```markdown
# Cost Analysis: [Batch/Farm Name]

**Period**: [Date Range]

## Cost Summary

- **Total Cost**: [Currency]X
- **Cost per Bird/Fish**: [Currency]X
- **Cost per kg Produced**: [Currency]X

## Cost Breakdown

| Category    | Amount      | %   | vs Budget | Trend |
| ----------- | ----------- | --- | --------- | ----- |
| Feed        | [Currency]X | X%  | +X%       | ↑     |
| Stock       | [Currency]X | X%  | -X%       | ↓     |
| Labor       | [Currency]X | X%  | 0%        | →     |
| Medications | [Currency]X | X%  | +X%       | ↑     |
| Utilities   | [Currency]X | X%  | +X%       | ↑     |
| Other       | [Currency]X | X%  | -X%       | ↓     |

## Feed Cost Analysis

| Feed Type | Qty (kg) | Cost        | [Currency]/kg | Supplier |
| --------- | -------- | ----------- | ------------- | -------- |
| Starter   | X        | [Currency]X | [Currency]X   | ABC      |
| Grower    | X        | [Currency]X | [Currency]X   | ABC      |
| Finisher  | X        | [Currency]X | [Currency]X   | XYZ      |

## Cost Trends (Monthly)

| Month | Feed        | Labor       | Other       | Total       |
| ----- | ----------- | ----------- | ----------- | ----------- |
| Jan   | [Currency]X | [Currency]X | [Currency]X | [Currency]X |
| Feb   | [Currency]X | [Currency]X | [Currency]X | [Currency]X |

## Optimization Opportunities

### High Impact

1. **Feed Cost Reduction**
   - Current: [Currency]X/kg
   - Target: [Currency]X/kg
   - Potential Savings: [Currency]X

2. **[Other opportunity]**
   - Current: [Currency]X
   - Target: [Currency]X
   - Potential Savings: [Currency]X

### Medium Impact

1. [Opportunity description]
2. [Opportunity description]

## Recommendations

1. [Specific action with expected savings]
2. [Specific action with expected savings]
3. [Specific action with expected savings]

## Total Potential Savings: [Currency]X
```

## Benchmarks

### Broiler Cost Structure (Nigeria)

| Category    | Target % | Warning % | Critical % |
| ----------- | -------- | --------- | ---------- |
| Feed        | <65%     | 65-75%    | >75%       |
| DOC         | <15%     | 15-20%    | >20%       |
| Labor       | <8%      | 8-12%     | >12%       |
| Medications | <5%      | 5-8%      | >8%        |
| Utilities   | <5%      | 5-8%      | >8%        |

### Catfish Cost Structure

| Category    | Target % | Warning % | Critical % |
| ----------- | -------- | --------- | ---------- |
| Feed        | <60%     | 60-70%    | >70%       |
| Fingerlings | <18%     | 18-25%    | >25%       |
| Labor       | <10%     | 10-15%    | >15%       |
| Pond/Water  | <8%      | 8-12%     | >12%       |

## Agent Delegation

- `@data-analyst` - Statistical trend analysis and forecasting
- `@livestock-specialist` - Production efficiency recommendations

## Related Prompts

- `@financial-report` - Full P&L analysis
- `@feed-optimization` - Reduce feed costs (largest expense)
- `@batch-analysis` - Production metrics affecting costs
- `@sales-forecast` - Revenue to offset costs
