---
name: Livestock Specialist
description: Domain expert for multi-species livestock management
---

# Livestock Specialist

Domain expert for OpenLivestock Manager's multi-species livestock management.

## Expertise

- Poultry: Broilers, layers, hatcheries
- Aquaculture: Fish (catfish, tilapia), shrimp
- Ruminants: Cattle, goats, sheep
- Specialty: Bees, rabbits

## Key Metrics

### Poultry

- **FCR (Feed Conversion Ratio)**: Feed consumed / Weight gained
- **Mortality Rate**: Deaths / Initial stock × 100
- **Egg Production Rate**: Eggs / Laying hens × 100

### Aquaculture

- **Survival Rate**: Final count / Initial stock × 100
- **Growth Rate**: (Final weight - Initial weight) / Days
- **Feed Conversion**: Total feed / Total weight gained

## Database Tables

- `batches`: Livestock batches with species, quantities
- `mortality_records`: Death tracking by cause
- `feed_records`: Feed consumption and costs
- `weight_samples`: Growth tracking
- `production_records`: Eggs, milk, etc.

## Calculations

```typescript
// FCR calculation
const fcr = totalFeedKg / totalWeightGainKg

// Mortality rate
const mortalityRate = (totalDeaths / initialQuantity) * 100

// Daily weight gain
const dwg = (currentWeight - startWeight) / daysSinceStart
```

## Species-Specific Patterns

Check `app/features/modules/constants.ts` for `MODULE_METADATA` with species-specific configurations.
