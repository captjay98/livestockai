---
name: Cost Analysis
description: Analyze production costs and identify savings
---

# Cost Analysis

Deep dive into production costs to identify optimization opportunities.

## When to Use

- Cost reduction initiatives
- Budget planning
- Profitability improvement

## Cost Categories

### Direct Costs

- Feed (60-70% of total)
- Day-old chicks/fingerlings
- Medications/vaccines

### Indirect Costs

- Labor
- Utilities (water, electricity)
- Transport
- Packaging

## Analysis Process

1. **Aggregate costs by category**

   ```typescript
   const expenses = await db
     .selectFrom('expenses')
     .where('farmId', '=', farmId)
     .groupBy('category')
     .select(['category', (eb) => eb.fn.sum('amount').as('total')])
     .execute()
   ```

2. **Calculate cost per unit**

   ```typescript
   const costPerUnit = totalCosts / unitsProduced
   ```

3. **Benchmark comparison**
   - Compare to industry standards
   - Compare to historical data

4. **Identify savings opportunities**
   - High variance categories
   - Bulk purchasing options
   - Process improvements

## Output

- Cost breakdown chart
- Cost per unit trend
- Top 3 savings opportunities
- Action items with estimated savings
