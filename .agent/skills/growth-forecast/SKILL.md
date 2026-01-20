---
name: Growth Forecast
description: Forecast livestock growth and production
---

# Growth Forecast

Forecast livestock growth patterns for planning.

## When to Use

- Planning harvests/sales
- Estimating feed requirements
- Production scheduling

## Forecasting Methods

### Weight Projection

```typescript
// Linear projection
const projectedWeight = currentWeight + dwg * daysRemaining

// Based on species growth curves
const targetWeight = getSpeciesTargetWeight(species, ageInDays)
```

### Feed Requirements

```typescript
const estimatedFeed = projectedWeightGain * targetFCR
const feedCost = estimatedFeed * pricePerKg
```

## Data Inputs

- Current batch weight (from `weight_samples`)
- Historical DWG (Daily Weight Gain)
- Species growth benchmarks
- Current age of batch

## Output

- Projected weight at target date
- Estimated days to target weight
- Feed requirements forecast
- Revenue projection at market weight
