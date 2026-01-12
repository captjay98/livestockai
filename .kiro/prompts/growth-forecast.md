---
description: 'Analyze growth data and forecast harvest timing using MCP'
argument-hint: '[batch-id]'
---

# Growth Forecast Analysis

Analyze growth trends and predict harvest timing for livestock batches.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Species**: Broilers, Layers, Catfish, Tilapia
**Currency**: Nigerian Naira (₦)

## Analysis Scope

**Batch**: $ARGUMENTS

## MCP Integration

**Use Neon MCP for all data queries:**

```
# List batches with weight samples
neon_run_sql "SELECT DISTINCT b.id, b.batchName, b.species, b.startDate FROM batches b JOIN weight_samples w ON b.id = w.batchId WHERE b.status = 'active'"
```

## Data Collection (MCP)

### 1. Batch Details

```
neon_run_sql "
  SELECT
    id, batchName, species, breed,
    initialQuantity, currentQuantity,
    startDate, targetHarvestDate,
    targetWeightKg
  FROM batches
  WHERE id = 'batch-id'
"
```

### 2. Weight Sample History

```
neon_run_sql "
  SELECT
    sampleDate,
    ROUND(avgWeightKg::numeric, 3) as avg_weight,
    ROUND(minWeightKg::numeric, 3) as min_weight,
    ROUND(maxWeightKg::numeric, 3) as max_weight,
    sampleSize
  FROM weight_samples
  WHERE batchId = 'batch-id'
  ORDER BY sampleDate
"
```

### 3. Calculate Growth Rate

```
neon_run_sql "
  WITH ordered_samples AS (
    SELECT
      sampleDate,
      avgWeightKg,
      LAG(avgWeightKg) OVER (ORDER BY sampleDate) as prev_weight,
      LAG(sampleDate) OVER (ORDER BY sampleDate) as prev_date
    FROM weight_samples
    WHERE batchId = 'batch-id'
  )
  SELECT
    sampleDate,
    ROUND(avgWeightKg::numeric, 3) as weight_kg,
    ROUND(((avgWeightKg - prev_weight) / NULLIF(EXTRACT(DAY FROM sampleDate - prev_date), 0) * 1000)::numeric, 1) as adg_grams
  FROM ordered_samples
  WHERE prev_weight IS NOT NULL
"
```

## Growth Curve Analysis

### Broiler Growth Standards (Ross 308)

| Age (days) | Target Weight (kg) |
| ---------- | ------------------ |
| 7          | 0.18               |
| 14         | 0.46               |
| 21         | 0.89               |
| 28         | 1.42               |
| 35         | 2.00               |
| 42         | 2.59               |

### Catfish Growth Standards

| Age (weeks) | Target Weight (g) |
| ----------- | ----------------- |
| 4           | 50-80             |
| 8           | 150-200           |
| 12          | 300-400           |
| 16          | 500-700           |
| 20          | 800-1000          |

## Calculations

### Average Daily Gain (ADG)

```
ADG = (Current Weight - Previous Weight) / Days Between Samples
```

### Days to Target Weight

```
Days Remaining = (Target Weight - Current Weight) / ADG
```

### Growth Rate Comparison

```
Performance % = (Actual Weight / Standard Weight) × 100
```

## Forecast Model

### Linear Projection

Simple projection based on recent ADG:

```
Projected Weight = Current Weight + (ADG × Days)
```

### Gompertz Growth Curve (More Accurate)

```
W(t) = A × exp(-b × exp(-c × t))
```

Where:

- A = Asymptotic weight
- b = Integration constant
- c = Growth rate constant

## Output Report

```markdown
# Growth Forecast: [Batch Name]

## Current Status

- **Age**: X days
- **Average Weight**: X.XX kg
- **Sample Size**: X birds/fish
- **Weight Uniformity**: X% CV (target <10%)

## Growth Performance

| Metric          | Actual   | Target   | Status |
| --------------- | -------- | -------- | ------ |
| ADG (7-day)     | Xg/day   | 50-60g   | ✅/⚠️/❌ |
| ADG (Overall)   | Xg/day   | 50-60g   | ✅/⚠️/❌ |
| vs Standard     | X%       | 100%     | ✅/⚠️/❌ |

## Harvest Forecast

- **Target Weight**: X kg
- **Current Weight**: X.XX kg
- **Projected Harvest Date**: YYYY-MM-DD
- **Days Remaining**: X days
- **Confidence**: 🟢 High / 🟡 Medium / 🔴 Low

## Revenue Projection

- **Projected Total Weight**: X,XXX kg
- **Market Price**: ₦X,XXX/kg
- **Projected Revenue**: ₦X,XXX,XXX

## Recommendations

1. **Feeding**: [Adjustment if needed]
2. **Management**: [Action if needed]
3. **Timing**: [Harvest timing advice]
```

## Alerts

Generate alerts for:
- Growth rate <80% of standard → 🔴 Critical
- High weight variance (CV >15%) → 🟡 Warning
- Declining ADG trend → 🟡 Warning
- Unlikely to reach target by planned date → 🔴 Critical

## Agent Delegation

- `@livestock-specialist` - Species-specific growth optimization
- `@data-analyst` - Advanced forecasting models

## Related Prompts

- `@batch-analysis` - Full batch performance
- `@feed-optimization` - Improve FCR for better growth
- `@sales-forecast` - Revenue projections
