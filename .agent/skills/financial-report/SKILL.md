---
name: Financial Report
description: Generate financial reports for farm operations
---

# Financial Report

Generate comprehensive financial reports for farm management.

## When to Use

- Monthly/quarterly reporting
- Profitability analysis
- Investor updates

## Report Sections

### 1. Revenue Summary

- Sales by batch/product
- Revenue trends
- Top performing batches

### 2. Expense Breakdown

- Feed costs (usually largest)
- Labor costs
- Veterinary/medicine
- Utilities
- Other operational

### 3. Profitability

- Gross profit = Revenue - COGS
- Net profit = Gross - Operating expenses
- Profit margin %

### 4. Key Ratios

- Cost per unit produced
- Revenue per unit
- ROI per batch

## Data Sources

- `sales` table for revenue
- `expenses` table for costs
- `feed_records` for feed costs
- `batches` for batch-level analysis

## Output Format

```markdown
# Financial Report - [Period]

## Summary

- Total Revenue: ₦X
- Total Expenses: ₦Y
- Net Profit: ₦Z

## Revenue Breakdown

[Table of sales by category]

## Expense Breakdown

[Table of costs by category]

## Recommendations

[Actionable insights]
```
