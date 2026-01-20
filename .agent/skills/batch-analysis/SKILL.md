---
name: Batch Analysis
description: Analyze batch performance and generate insights
---

# Batch Analysis

Analyze livestock batch performance for OpenLivestock Manager.

## When to Use

- Evaluating batch performance
- Comparing batches across time
- Identifying issues and trends

## Key Metrics

### Core Performance

- **FCR**: Feed Conversion Ratio (lower is better)
- **Mortality Rate**: Deaths as % of initial stock
- **Daily Weight Gain**: Average growth per day
- **Survival Rate**: % of animals surviving

### Financial

- **Cost per Unit**: Total costs / surviving units
- **Revenue per Unit**: Sales / units sold
- **Profit Margin**: (Revenue - Costs) / Revenue

## Analysis Process

1. **Gather Data**
   - Query batch from database
   - Get feed records, mortality, weights, sales

2. **Calculate Metrics**

   ```typescript
   const fcr = totalFeedKg / (currentWeight - startWeight)
   const mortalityRate = (deaths / initialQty) * 100
   const dwg = weightGain / daysSinceStart
   ```

3. **Compare Benchmarks**
   - Compare against species standards
   - Compare against historical batches

4. **Generate Report**
   - Summary statistics
   - Trend visualizations
   - Recommendations

## Output Format

Provide analysis with:

- Executive summary
- Key metrics table
- Trends and patterns
- Actionable recommendations
