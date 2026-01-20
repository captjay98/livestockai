---
name: Sales Forecast
description: Forecast sales and revenue projections
---

# Sales Forecast

Project future sales based on production and market trends.

## When to Use

- Business planning
- Cash flow projections
- Production scheduling

## Method

### 1. Production Projection

```typescript
// Expected harvest quantity
const harvestQty = currentQty * (1 - expectedMortalityRate)
const harvestWeight = harvestQty * targetWeightKg
```

### 2. Market Price Analysis

- Current market prices
- Seasonal trends
- Historical price data

### 3. Revenue Projection

```typescript
const projectedRevenue = harvestWeight * expectedPricePerKg
// Or for eggs
const projectedRevenue = expectedEggs * pricePerEgg
```

## Inputs Required

- Current batch status
- Target market date
- Current market prices
- Historical sales data

## Output Format

- Projected units for sale
- Expected revenue range (low/mid/high)
- Optimal market timing
- Cash flow timeline
