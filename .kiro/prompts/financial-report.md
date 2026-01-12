---
description: 'Generate profit and loss report using MCP database queries'
argument-hint: "[batch-id or 'farm' for farm-wide]"
---

# Financial Report Generator

Generate comprehensive profit and loss analysis for OpenLivestock Manager.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Species**: Broilers, Layers, Catfish, Tilapia
**Currency**: Nigerian Naira (₦)

## Report Scope

**Scope**: $ARGUMENTS
**Period**: Specify date range or use batch lifecycle

## MCP Integration

**Use Neon MCP for all data queries:**

```
# List farms and batches
neon_run_sql "SELECT id, name FROM farms"
neon_run_sql "SELECT id, batchName, farmId, status FROM batches WHERE status IN ('active', 'sold')"
```

## Data Collection (MCP)

### 1. Revenue (Sales)

```
neon_run_sql "
  SELECT
    s.saleDate,
    s.quantity as quantitySold,
    s.pricePerUnit,
    ROUND(s.totalAmount::numeric, 2) as totalAmount,
    c.name as customerName,
    b.batchName
  FROM sales s
  LEFT JOIN customers c ON s.customerId = c.id
  LEFT JOIN batches b ON s.batchId = b.id
  WHERE s.batchId = 'batch-id'
  ORDER BY s.saleDate
"
```

### 2. Revenue Summary

```
neon_run_sql "
  SELECT
    COUNT(*) as total_sales,
    SUM(quantity) as total_quantity,
    ROUND(SUM(totalAmount)::numeric, 2) as total_revenue,
    ROUND(AVG(pricePerUnit)::numeric, 2) as avg_price
  FROM sales
  WHERE batchId = 'batch-id'
"
```

### 3. Feed Costs

```
neon_run_sql "
  SELECT
    feedType,
    ROUND(SUM(quantityKg)::numeric, 2) as total_kg,
    ROUND(SUM(costNgn)::numeric, 2) as total_cost
  FROM feed_records
  WHERE batchId = 'batch-id'
  GROUP BY feedType
"
```

### 4. Other Expenses

```
neon_run_sql "
  SELECT
    category,
    ROUND(SUM(amount)::numeric, 2) as total,
    COUNT(*) as transactions
  FROM expenses
  WHERE batchId = 'batch-id' OR farmId = 'farm-id'
  GROUP BY category
  ORDER BY total DESC
"
```

### 5. Batch Investment (Initial Costs)

```
neon_run_sql "
  SELECT
    initialQuantity,
    acquisitionCost,
    ROUND((acquisitionCost / initialQuantity)::numeric, 2) as cost_per_unit
  FROM batches
  WHERE id = 'batch-id'
"
```

## Financial Calculations

### Gross Revenue

```
Gross Revenue = Σ(Quantity Sold × Unit Price)
```

### Cost of Goods Sold (COGS)

```
COGS = Feed Cost + Chick/Fingerling Cost + Direct Labor
```

### Gross Profit

```
Gross Profit = Gross Revenue - COGS
Gross Margin % = (Gross Profit / Gross Revenue) × 100
```

### Operating Expenses

- Utilities (electricity, water)
- Medications and vaccines
- Transportation
- Labor (indirect)
- Maintenance

### Net Profit

```
Net Profit = Gross Profit - Operating Expenses
Net Margin % = (Net Profit / Gross Revenue) × 100
```

## Key Metrics

### Per Unit Metrics

```
Cost per Bird/Fish = Total Cost / Initial Quantity
Revenue per Bird/Fish = Total Revenue / Quantity Sold
Profit per Bird/Fish = Revenue per Bird - Cost per Bird
```

### Per Kilogram Metrics

```
Cost per kg = Total Cost / Total Weight Sold
Revenue per kg = Total Revenue / Total Weight Sold
Profit per kg = Revenue per kg - Cost per kg
```

## Report Format

```markdown
# Financial Report: [Batch/Farm Name]

**Period**: [Start Date] to [End Date]
**Currency**: Nigerian Naira (₦)

## Executive Summary

- **Total Revenue**: ₦X
- **Total Cost**: ₦X
- **Net Profit**: ₦X
- **Profit Margin**: X%
- **ROI**: X%

## Revenue Breakdown

| Source            | Quantity | Unit Price | Total  |
| ----------------- | -------- | ---------- | ------ |
| Live Sales        | X kg     | ₦X         | ₦X     |
| Processed         | X kg     | ₦X         | ₦X     |
| **Total Revenue** |          |            | **₦X** |

## Cost Breakdown

| Category           | Amount | % of Total |
| ------------------ | ------ | ---------- |
| Feed               | ₦X     | X%         |
| Chicks/Fingerlings | ₦X     | X%         |
| Labor              | ₦X     | X%         |
| Medications        | ₦X     | X%         |
| Utilities          | ₦X     | X%         |
| Other              | ₦X     | X%         |
| **Total Cost**     | **₦X** | **100%**   |

## Profitability Analysis

| Metric             | Value | Status   |
| ------------------ | ----- | -------- |
| Gross Profit       | ₦X    | ✅/⚠️/❌ |
| Gross Margin       | X%    | ✅/⚠️/❌ |
| Operating Expenses | ₦X    | ✅/⚠️/❌ |
| Net Profit         | ₦X    | ✅/⚠️/❌ |
| Net Margin         | X%    | ✅/⚠️/❌ |

## Per Unit Analysis

| Metric  | Per Bird/Fish | Per kg |
| ------- | ------------- | ------ |
| Revenue | ₦X            | ₦X     |
| Cost    | ₦X            | ₦X     |
| Profit  | ₦X            | ₦X     |

## Comparison to Budget

| Item       | Budget | Actual | Variance | Status   |
| ---------- | ------ | ------ | -------- | -------- |
| Revenue    | ₦X     | ₦X     | X%       | ✅/⚠️/❌ |
| Feed Cost  | ₦X     | ₦X     | X%       | ✅/⚠️/❌ |
| Net Profit | ₦X     | ₦X     | X%       | ✅/⚠️/❌ |

## Recommendations

1. [Cost reduction opportunity]
2. [Revenue improvement opportunity]
3. [Efficiency improvement]
```

## Profitability Benchmarks

| Metric       | Target | Warning | Critical |
| ------------ | ------ | ------- | -------- |
| Gross Margin | >25%   | 15-25%  | <15%     |
| Net Margin   | >15%   | 5-15%   | <5%      |
| ROI          | >30%   | 15-30%  | <15%     |
| Feed % Cost  | <65%   | 65-75%  | >75%     |

## Agent Delegation

- `@data-analyst` - Advanced financial modeling and trend analysis
- `@livestock-specialist` - Production efficiency recommendations

## Related Prompts

- `@cost-analysis` - Deep dive into cost structure
- `@sales-forecast` - Revenue projections
- `@batch-analysis` - Production metrics affecting profitability
- `@feed-optimization` - Reduce feed costs (largest expense)
