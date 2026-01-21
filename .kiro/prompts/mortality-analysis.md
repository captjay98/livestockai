---
description: 'Analyze mortality patterns and identify causes using MCP'
argument-hint: "[batch-id or 'farm' for farm-wide]"
---

# Mortality Analysis

Analyze mortality patterns to identify causes and recommend preventive measures.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Species**: All 6 livestock types with species-specific mortality patterns
**Currency**: Multi-currency (USD, EUR, NGN, etc.) - use user's preference
**Database**: PostgreSQL (Neon) via Kysely ORM

## Step 1: Determine Analysis Scope

First, check if we're continuing a conversation:

> Are we analyzing the mortality data we've been discussing, or would you like a different analysis?
>
> Options:
>
> - If we've been discussing specific batches/farms, I can analyze those
> - Provide a specific scope (batch, farm, time period)
> - `all` for complete mortality analysis
> - Or describe what you'd like to see

Wait for their response before proceeding.

## MCP Integration

**Use Neon MCP for all data queries:**

```
# List batches with mortality
neon__run_sql "SELECT DISTINCT b.id, b.batchName, b.species FROM batches b JOIN mortality_records m ON b.id = m.batchId"
```

## Data Collection (MCP)

### 1. Mortality Records

```
neon__run_sql "
  SELECT
    m.date,
    m.quantity,
    m.cause,
    m.notes,
    b.batchName
  FROM mortality_records m
  JOIN batches b ON m.batchId = b.id
  WHERE m.batchId = 'batch-id'
  ORDER BY m.date
"
```

### 2. Mortality by Cause

```
neon__run_sql "
  SELECT
    cause,
    SUM(quantity) as total_deaths,
    COUNT(*) as incidents,
    ROUND(AVG(quantity)::numeric, 1) as avg_per_incident
  FROM mortality_records
  WHERE batchId = 'batch-id'
  GROUP BY cause
  ORDER BY total_deaths DESC
"
```

### 3. Mortality Trend (Weekly)

```
neon__run_sql "
  SELECT
    DATE_TRUNC('week', date) as week,
    SUM(quantity) as weekly_deaths,
    COUNT(*) as incidents
  FROM mortality_records
  WHERE batchId = 'batch-id'
  GROUP BY DATE_TRUNC('week', date)
  ORDER BY week
"
```

### 4. Farm-Wide Analysis

```
neon__run_sql "
  SELECT
    b.batchName,
    b.species,
    SUM(m.quantity) as total_deaths,
    ROUND((SUM(m.quantity)::numeric / b.initialQuantity * 100), 2) as mortality_rate
  FROM mortality_records m
  JOIN batches b ON m.batchId = b.id
  WHERE b.farmId = 'farm-id'
  GROUP BY b.id, b.batchName, b.species, b.initialQuantity
  ORDER BY mortality_rate DESC
"
```

## Mortality Benchmarks

### Broilers

| Phase     | Days  | Acceptable Rate |
| --------- | ----- | --------------- |
| Brooding  | 0-14  | <1.5%           |
| Growing   | 15-28 | <1.0%           |
| Finishing | 29-42 | <0.5%           |
| **Total** | 0-42  | **<3-5%**       |

### Catfish

| Phase      | Acceptable Rate |
| ---------- | --------------- |
| Fingerling | <10%            |
| Juvenile   | <5%             |
| Grow-out   | <3%             |
| **Total**  | **<10%**        |

## Common Causes Analysis

### Broiler Mortality Causes

1. **Disease** - Respiratory, enteric, viral
2. **Environmental** - Heat stress, cold stress, ventilation
3. **Nutritional** - Feed quality, water quality
4. **Management** - Overcrowding, handling
5. **Predation** - Rodents, wild birds

### Catfish Mortality Causes

1. **Water Quality** - Low oxygen, ammonia, pH
2. **Disease** - Bacterial, parasitic, fungal
3. **Handling** - Stress during grading/transfer
4. **Predation** - Birds, snakes
5. **Cannibalism** - Size variation

## Analysis Output

```markdown
# Mortality Analysis: [Batch/Farm Name]

## Summary

- **Total Deaths**: X
- **Mortality Rate**: X%
- **Status**: 🟢 Acceptable / 🟡 Concerning / 🔴 Critical
- **Trend**: ↑ Increasing / → Stable / ↓ Decreasing

## Mortality by Cause

| Cause         | Deaths | % of Total | Trend |
| ------------- | ------ | ---------- | ----- |
| Disease       | X      | X%         | ↑/↓/→ |
| Environmental | X      | X%         | ↑/↓/→ |
| Unknown       | X      | X%         | ↑/↓/→ |

## Weekly Trend

| Week   | Deaths | Cumulative Rate |
| ------ | ------ | --------------- |
| Week 1 | X      | X%              |
| Week 2 | X      | X%              |

## Root Cause Analysis

### Primary Issue: [Cause]

- **Evidence**: [Data supporting this conclusion]
- **Impact**: [Currency]X,XXX lost value
- **Recommendation**: [Specific action]

**Note**: All financial values use user's currency preference

## Preventive Recommendations

1. **Immediate**: [Action to take now]
2. **Short-term**: [Action within 1 week]
3. **Long-term**: [Systemic improvement]
```

## Agent Delegation

For specialized analysis:

- `@livestock-specialist` - Species-specific disease identification and prevention strategies
- `@data-analyst` - Statistical trend analysis and mortality forecasting
- `@backend-engineer` - Database query optimization for mortality data
- `@qa-engineer` - Validate mortality data accuracy and completeness

### When to Delegate

- **Disease outbreaks** - @livestock-specialist for diagnosis and treatment protocols
- **Pattern analysis** - @data-analyst for identifying trends and risk factors
- **Data issues** - @backend-engineer if mortality records are incomplete or inconsistent
- **Validation** - @qa-engineer to verify mortality calculations and rates

## Related Prompts

- `@batch-analysis` - Full batch performance review
- `@growth-forecast` - Impact on harvest projections
- `@financial-report` - Economic impact of mortality
- `@feed-optimization` - Nutrition-related mortality factors
  | Environmental | X | X% | ↑/↓/→ |
  | Unknown | X | X% | ↑/↓/→ |

## Timeline Analysis

- **Peak Period**: [Date range with highest mortality]
- **Pattern**: [Daily/Weekly pattern if any]

## Root Cause Analysis

1. **Primary Cause**: [Most significant factor]
   - Evidence: [Data supporting this]
   - Impact: X deaths (X%)

2. **Secondary Cause**: [Second factor]
   - Evidence: [Data supporting this]
   - Impact: X deaths (X%)

## Recommendations

### Immediate Actions

1. [Urgent action if needed]

### Preventive Measures

1. [Long-term improvement]
2. [Management change]
3. [Infrastructure improvement]

## Financial Impact

- **Lost Revenue**: [Currency]X (X animals × [Currency]X/unit)
- **Additional Costs**: [Currency]X (treatment, disposal)
- **Total Loss**: [Currency]X

**Note**: All financial values use user's currency preference

```

## Alerts

Generate alerts for:

- Daily mortality >0.5%
- Weekly mortality >2%
- Sudden spike (3x normal)
- Unknown cause >30% of deaths
```
