[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/finance/calculations](../README.md) / calculateCostPerUnit

# Function: calculateCostPerUnit()

> **calculateCostPerUnit**(`totalInvestment`, `quantity`): `number`

Defined in: features/finance/calculations.ts:55

Calculates the cost per unit (e.g., cost per bird or cost per kg).
Useful for determining pricing strategies.
Formula: Total Investment / Current Quantity

## Parameters

### totalInvestment

`number`

The sum of all costs assigned to the batch

### quantity

`number`

The number of units (livestock) currently in the batch

## Returns

`number`

Cost per individual unit
