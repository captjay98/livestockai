---
description: 'Analyze feed efficiency and optimize feeding programs using MCP'
argument-hint: '[batch-id]'
---

# Feed Optimization Analysis

Analyze feed conversion efficiency and recommend feeding program improvements.

## Context

**Project**: LivestockAI - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Species**: All 6 livestock types with species-specific feed efficiency metrics
**Currency**: Multi-currency (USD, EUR, NGN, etc.) - use user's preference
**Database**: PostgreSQL (Neon) via Kysely ORM

## Step 1: Determine Analysis Scope

First, check if we're continuing a conversation:

> Are we optimizing feed for the batch we've been discussing, or a different batch?
>
> Options:
>
> - If we've been discussing a specific batch, I can optimize that
> - Provide a batch ID or name
> - Or I can list available batches

Wait for their response before proceeding.

## MCP Integration

**Use Neon MCP for all data queries:**

```
# List batches with feed records
neon__run_sql "SELECT DISTINCT b.id, b.batchName, b.species FROM batches b JOIN feed_records f ON b.id = f.batchId WHERE b.status = 'active'"
```

## Data Collection (MCP)

### 1. Feed Records

```
neon__run_sql "
  SELECT
    date,
    feedType,
    ROUND(quantityKg::numeric, 2) as quantity_kg,
    ROUND(cost::numeric, 2) as cost_ngn
  FROM feed_records
  WHERE batchId = 'batch-id'
  ORDER BY date
"
```

### 2. Feed Summary by Type

```
neon__run_sql "
  SELECT
    feedType,
    ROUND(SUM(quantityKg)::numeric, 2) as total_kg,
    ROUND(SUM(cost)::numeric, 2) as total_cost,
    ROUND(AVG(cost / NULLIF(quantityKg, 0))::numeric, 2) as cost_per_kg,
    COUNT(*) as feeding_days
  FROM feed_records
  WHERE batchId = 'batch-id'
  GROUP BY feedType
  ORDER BY total_kg DESC
"
```

### 3. Weight Gain Data

```
neon__run_sql "
  SELECT
    MIN(averageWeightKg) as start_weight,
    MAX(averageWeightKg) as current_weight,
    MAX(averageWeightKg) - MIN(averageWeightKg) as weight_gain
  FROM weight_samples
  WHERE batchId = 'batch-id'
"
```

### 4. Calculate FCR

```
neon__run_sql "
  WITH feed_total AS (
    SELECT SUM(quantityKg) as total_feed
    FROM feed_records WHERE batchId = 'batch-id'
  ),
  weight_gain AS (
    SELECT
      (MAX(averageWeightKg) - MIN(averageWeightKg)) *
      (SELECT currentQuantity FROM batches WHERE id = 'batch-id') as total_gain
    FROM weight_samples WHERE batchId = 'batch-id'
  )
  SELECT
    ROUND((f.total_feed / NULLIF(w.total_gain, 0))::numeric, 2) as fcr
  FROM feed_total f, weight_gain w
"
```

## Feed Conversion Ratio (FCR)

### Calculation

```
FCR = Total Feed Consumed (kg) / Total Weight Gain (kg)
```

### Broiler FCR Targets

| Age (days) | Cumulative FCR |
| ---------- | -------------- |
| 7          | 0.90           |
| 14         | 1.10           |
| 21         | 1.25           |
| 28         | 1.40           |
| 35         | 1.55           |
| 42         | 1.70           |

### Catfish FCR Targets

| Size       | FCR Target |
| ---------- | ---------- |
| Fingerling | 1.0-1.2    |
| Juvenile   | 1.2-1.4    |
| Table size | 1.4-1.6    |

## Feed Cost Analysis

### Cost per kg of Meat Produced

```
Cost/kg = Total Feed Cost / Total Weight Gain
```

### Feed as % of Total Cost

```
Feed % = (Feed Cost / Total Production Cost) × 100
```

Target: 60-70% for broilers, 50-60% for catfish

## Feeding Program Analysis

### Daily Feed Intake

```sql
SELECT
  date,
  SUM(quantityKg) as daily_feed,
  SUM(quantityKg) / current_stock as feed_per_bird
FROM feed_records
WHERE batchId = 'batch-id'
GROUP BY date
ORDER BY date;
```

### Feed Type Distribution

- Starter feed: Days 0-14
- Grower feed: Days 15-28
- Finisher feed: Days 29+

## Output Report

```markdown
# Feed Optimization: [Batch Name]

## Summary

- **Total Feed**: X kg
- **Total Cost**: [Currency]X
- **Current FCR**: X
- **Target FCR**: X
- **Status**: [Efficient/Average/Inefficient]

## FCR Analysis

| Period     | Feed (kg) | Gain (kg) | FCR | Target | Status   |
| ---------- | --------- | --------- | --- | ------ | -------- |
| Week 1     | X         | X         | X   | X      | ✅/⚠️/❌ |
| Week 2     | X         | X         | X   | X      | ✅/⚠️/❌ |
| Cumulative | X         | X         | X   | X      | ✅/⚠️/❌ |

## Cost Analysis

- **Feed Cost/kg Meat**: [Currency]X
- **Feed % of Total Cost**: X%
- **vs Budget**: X% (over/under)

## Feed Type Breakdown

| Type     | Quantity | Cost        | Cost/kg     |
| -------- | -------- | ----------- | ----------- |
| Starter  | X kg     | [Currency]X | [Currency]X |
| Grower   | X kg     | [Currency]X | [Currency]X |
| Finisher | X kg     | [Currency]X | [Currency]X |

## Optimization Recommendations

### Feeding Schedule

1. [Adjustment to feeding times]
2. [Quantity adjustments]

### Feed Quality

1. [Feed type recommendations]
2. [Supplier considerations]

### Management

1. [Feeder management]
2. [Waste reduction]

## Projected Savings

- **If FCR improved to target**: [Currency]X saved
- **Feed waste reduction**: [Currency]X saved
- **Total potential savings**: [Currency]X
```

## Alerts

Generate alerts for:

- FCR >10% above target → 🔴 Critical
- Feed cost/kg >20% above budget → 🟡 Warning
- Sudden increase in daily consumption → 🟡 Warning
- Feed wastage indicators → 🟡 Warning

## Agent Delegation

For specialized optimization:

- `@livestock-specialist` - Species-specific feeding programs and nutrition requirements
- `@data-analyst` - Feed cost trend analysis and optimization modeling
- `@backend-engineer` - Database query optimization for feed records
- `@qa-engineer` - Validate feed calculations and inventory accuracy

### When to Delegate

- **Nutrition issues** - @livestock-specialist for feed formulation and species requirements
- **Cost optimization** - @data-analyst for feed cost analysis and supplier comparison
- **Data issues** - @backend-engineer if feed records are incomplete or inconsistent
- **Validation** - @qa-engineer to verify FCR calculations and feed inventory

## Related Prompts

- `@batch-analysis` - Full batch performance
- `@growth-forecast` - Growth impact of feed changes
- `@cost-analysis` - Feed cost in overall expenses
- `@financial-report` - Feed impact on profitability
