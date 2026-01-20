---
name: Mortality Analysis
description: Analyze mortality patterns and causes
---

# Mortality Analysis

Analyze livestock mortality to identify patterns and reduce losses.

## When to Use

- Investigating unusual death rates
- Trend analysis over time
- Cause-of-death analysis

## Key Metrics

- **Mortality Rate**: Deaths / Initial Stock × 100
- **Daily Mortality**: Deaths per day
- **Cause Distribution**: Deaths by cause category

## Mortality Causes

From `mortality_records.cause`:

- Disease
- Predation
- Heat stress
- Cold stress
- Accident
- Unknown

## Analysis Process

1. **Query mortality data**

   ```typescript
   const records = await db
     .selectFrom('mortality_records')
     .where('batchId', '=', batchId)
     .select(['date', 'quantity', 'cause'])
     .execute()
   ```

2. **Calculate rates**

   ```typescript
   const totalDeaths = records.reduce((sum, r) => sum + r.quantity, 0)
   const rate = (totalDeaths / initialQuantity) * 100
   ```

3. **Identify patterns**
   - Spikes in mortality
   - Correlations with weather/conditions
   - Common causes

4. **Generate recommendations**
   - Preventive measures
   - Management changes
   - Veterinary consultation if needed

## Benchmarks

- Poultry: <5% for broilers
- Layers: <1% per month
- Fish: <10% for production cycle
