---
description: 'Analyze costs and identify optimization opportunities using MCP'
argument-hint: "[batch-id or 'farm']"
---

# Cost Analysis

Deep dive into cost structure and identify savings opportunities.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Species**: Broilers, Layers, Catfish, Tilapia
**Currency**: Nigerian Naira (₦)

## Analysis Scope

**Scope**: $ARGUMENTS

## MCP Integration

**Use Neon MCP for all data queries:**

```
# List farms and batches with expenses
neon_run_sql "SELECT DISTINCT f.id, f.name FROM farms f JOIN expenses e ON f.id = e.farmId"
```

## Data Collection (MCP)

### 1. All Costs by Category

```
neon_run_sql "
  SELECT
    category,
    ROUND(SUM(amount)::numeric, 2) as total,
    COUNT(*) as transactions,
    MIN(recordDate) as first_expense,
    MAX(recordDate) as last_expense
  FROM expenses
  WHERE farmId = 'farm-id'
  GROUP BY category
  ORDER BY total DESC
"
```

### 2. Feed Cost Details

```
neon_run_sql "
  SELECT
    feedType,
    ROUND(SUM(quantityKg)::numeric, 2) as total_kg,
    ROUND(SUM(costNgn)::numeric, 2) as total_cost,
    ROUND(AVG(costNgn / NULLIF(quantityKg, 0))::numeric, 2) as avg_price_per_kg
  FROM feed_records
  WHERE batchId = 'batch-id'
  GROUP BY feedType
"
```

### 3. Cost Trends (Monthly)

```
neon_run_sql "
  SELECT
    DATE_TRUNC('month', recordDate) as month,
    category,
    ROUND(SUM(amount)::numeric, 2) as monthly_cost
  FROM expenses
  WHERE farmId = 'farm-id'
    AND recordDate >= NOW() - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', recordDate), category
  ORDER BY month, category
"
```

### 4. Total Cost Summary

```
neon_run_sql "
  WITH feed_costs AS (
    SELECT SUM(costNgn) as feed_total FROM feed_records WHERE batchId = 'batch-id'
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

- **Total Cost**: ₦X
- **Cost per Bird/Fish**: ₦X
- **Cost per kg Produced**: ₦X

## Cost Breakdown

| Category    | Amount | %   | vs Budget | Trend |
| ----------- | ------ | --- | --------- | ----- |
| Feed        | ₦X     | X%  | +X%       | ↑     |
| Stock       | ₦X     | X%  | -X%       | ↓     |
| Labor       | ₦X     | X%  | 0%        | →     |
| Medications | ₦X     | X%  | +X%       | ↑     |
| Utilities   | ₦X     | X%  | +X%       | ↑     |
| Other       | ₦X     | X%  | -X%       | ↓     |

## Feed Cost Analysis

| Feed Type | Qty (kg) | Cost | ₦/kg | Supplier |
| --------- | -------- | ---- | ---- | -------- |
| Starter   | X        | ₦X   | ₦X   | ABC      |
| Grower    | X        | ₦X   | ₦X   | ABC      |
| Finisher  | X        | ₦X   | ₦X   | XYZ      |

## Cost Trends (Monthly)

| Month | Feed | Labor | Other | Total |
| ----- | ---- | ----- | ----- | ----- |
| Jan   | ₦X   | ₦X    | ₦X    | ₦X    |
| Feb   | ₦X   | ₦X    | ₦X    | ₦X    |

## Optimization Opportunities

### High Impact

1. **Feed Cost Reduction**
   - Current: ₦X/kg
   - Target: ₦X/kg
   - Potential Savings: ₦X

2. **[Other opportunity]**
   - Current: ₦X
   - Target: ₦X
   - Potential Savings: ₦X

### Medium Impact

1. [Opportunity description]
2. [Opportunity description]

## Recommendations

1. [Specific action with expected savings]
2. [Specific action with expected savings]
3. [Specific action with expected savings]

## Total Potential Savings: ₦X
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
