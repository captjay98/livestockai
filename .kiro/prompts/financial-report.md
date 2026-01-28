---
description: 'Generate profit and loss report using MCP database queries'
argument-hint: "[batch-id or 'farm' for farm-wide]"
---

# Financial Report Generator

Generate comprehensive profit and loss analysis for OpenLivestock Manager.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Species**: All 6 livestock types with species-specific financial metrics
**Currency**: Multi-currency - use user preference
**Database**: PostgreSQL (Neon) via Kysely ORM

## Step 0: Determine Report Scope

**Ask user interactively:**

> What financial report would you like to generate?
>
> 1. **Specific batch** - P&L for a single batch
> 2. **Farm-wide** - All batches for a farm
> 3. **Time period** - Custom date range (e.g., last month, Q1 2024)
> 4. **Comparison** - Compare multiple periods or batches
> 5. **Current conversation** - Continue analyzing what we've been discussing

**Then ask about timeframe (if not specified):**

- Last 7 days
- Last 30 days
- Last quarter
- Custom date range

Wait for response before proceeding.

## Step 1: Verify Data Availability

## MCP Integration

**Use Neon MCP for all data queries:**

**If MCP available:**

```
# List farms and batches
neon__run_sql "SELECT id, name FROM farms"
neon__run_sql "SELECT id, batchName, farmId, status FROM batches WHERE status IN ('active', 'sold')"
```

**If MCP unavailable (fallback):**

Ask user to:

1. Check database connection manually
2. Provide data via CSV export
3. Use app's built-in reports feature

**Error handling:**

- If query fails: "Database connection issue. Check Neon project status."
- If no data: "No financial data found for this period. Adjust date range?"
- If incomplete data: "Some records missing. Continue with available data? (y/n)"

## Data Collection (MCP)

### 1. Revenue (Sales)

```
neon__run_sql "
  SELECT
    s.date,
    s.quantity as quantitySold,
    s.unitPrice,
    ROUND(s.totalAmount::numeric, 2) as totalAmount,
    c.name as customerName,
    b.batchName
  FROM sales s
  LEFT JOIN customers c ON s.customerId = c.id
  LEFT JOIN batches b ON s.batchId = b.id
  WHERE s.batchId = 'batch-id'
  ORDER BY s.date
"
```

### 2. Revenue Summary

```
neon__run_sql "
  SELECT
    COUNT(*) as total_sales,
    SUM(quantity) as total_quantity,
    ROUND(SUM(totalAmount)::numeric, 2) as total_revenue,
    ROUND(AVG(unitPrice)::numeric, 2) as avg_price
  FROM sales
  WHERE batchId = 'batch-id'
"
```

### 3. Feed Costs

```
neon__run_sql "
  SELECT
    feedType,
    ROUND(SUM(quantityKg)::numeric, 2) as total_kg,
    ROUND(SUM(cost)::numeric, 2) as total_cost
  FROM feed_records
  WHERE batchId = 'batch-id'
  GROUP BY feedType
"
```

### 4. Other Expenses

```
neon__run_sql "
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
neon__run_sql "
  SELECT
    initialQuantity,
    totalCost,
    ROUND((totalCost / initialQuantity)::numeric, 2) as cost_per_unit
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
**Currency**: Nigerian Naira ([Currency])

## Executive Summary

- **Total Revenue**: [Currency]X
- **Total Cost**: [Currency]X
- **Net Profit**: [Currency]X
- **Profit Margin**: X%
- **ROI**: X%

## Revenue Breakdown

| Source            | Quantity | Unit Price  | Total           |
| ----------------- | -------- | ----------- | --------------- |
| Live Sales        | X kg     | [Currency]X | [Currency]X     |
| Processed         | X kg     | [Currency]X | [Currency]X     |
| **Total Revenue** |          |             | **[Currency]X** |

## Cost Breakdown

| Category           | Amount          | % of Total |
| ------------------ | --------------- | ---------- |
| Feed               | [Currency]X     | X%         |
| Chicks/Fingerlings | [Currency]X     | X%         |
| Labor              | [Currency]X     | X%         |
| Medications        | [Currency]X     | X%         |
| Utilities          | [Currency]X     | X%         |
| Other              | [Currency]X     | X%         |
| **Total Cost**     | **[Currency]X** | **100%**   |

## Profitability Analysis

| Metric             | Value       | Status   |
| ------------------ | ----------- | -------- |
| Gross Profit       | [Currency]X | ✅/⚠️/❌ |
| Gross Margin       | X%          | ✅/⚠️/❌ |
| Operating Expenses | [Currency]X | ✅/⚠️/❌ |
| Net Profit         | [Currency]X | ✅/⚠️/❌ |
| Net Margin         | X%          | ✅/⚠️/❌ |

## Per Unit Analysis

| Metric  | Per Bird/Fish | Per kg      |
| ------- | ------------- | ----------- |
| Revenue | [Currency]X   | [Currency]X |
| Cost    | [Currency]X   | [Currency]X |
| Profit  | [Currency]X   | [Currency]X |

## Comparison to Budget

| Item       | Budget      | Actual      | Variance | Status   |
| ---------- | ----------- | ----------- | -------- | -------- |
| Revenue    | [Currency]X | [Currency]X | X%       | ✅/⚠️/❌ |
| Feed Cost  | [Currency]X | [Currency]X | X%       | ✅/⚠️/❌ |
| Net Profit | [Currency]X | [Currency]X | X%       | ✅/⚠️/❌ |

## Recommendations

1. [Cost reduction opportunity]
2. [Revenue improvement opportunity]
3. [Efficiency improvement]

## Validation & Next Steps

**Validate report accuracy:**

1. **Cross-check totals:**
    - Revenue = Sum of all sales
    - Expenses = Sum of all costs
    - Profit = Revenue - Expenses

2. **Verify currency:**
    - All amounts in user's preferred currency
    - Exchange rates applied correctly (if applicable)

3. **Check completeness:**
    - All batches included
    - All transactions in date range
    - No missing categories

**Ask user:**

> Report generated. Does this match your expectations?
>
> - (y) Yes, looks good
> - (e) Export to CSV/PDF
> - (d) Drill down into specific category
> - (c) Compare with another period

**If issues found:**

- Offer to regenerate with different parameters
- Suggest checking for missing transactions
- Recommend reviewing expense categorization
```

## Profitability Benchmarks

| Metric       | Target | Warning | Critical |
| ------------ | ------ | ------- | -------- |
| Gross Margin | >25%   | 15-25%  | <15%     |
| Net Margin   | >15%   | 5-15%   | <5%      |
| ROI          | >30%   | 15-30%  | <15%     |
| Feed % Cost  | <65%   | 65-75%  | >75%     |

## Agent Delegation

For comprehensive financial analysis:

- `@data-analyst` - Advanced financial modeling, trend analysis, and forecasting
- `@livestock-specialist` - Production efficiency recommendations and cost optimization
- `@backend-engineer` - Database query optimization for financial data
- `@qa-engineer` - Validate financial calculations and report accuracy

### When to Delegate

- **Complex forecasting** - @data-analyst for predictive financial modeling
- **Production issues** - @livestock-specialist for efficiency improvements
- **Data issues** - @backend-engineer if financial data is incomplete or slow
- **Validation** - @qa-engineer to verify all financial calculations

## Related Prompts

- `@cost-analysis` - Deep dive into cost structure
- `@sales-forecast` - Revenue projections
- `@batch-analysis` - Production metrics affecting profitability
- `@feed-optimization` - Reduce feed costs (largest expense)
