[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/finance/calculations](../README.md) / calculateBatchProfit

# Function: calculateBatchProfit()

> **calculateBatchProfit**(`financials`): `number`

Defined in: features/finance/calculations.ts:27

Calculates the net profit or loss for a livestock batch.
Formula: Revenue - (Initial Cost + Feed Cost + Other Expenses)

## Parameters

### financials

[`BatchFinancials`](../interfaces/BatchFinancials.md)

Object containing revenue and cost components

## Returns

`number`

The calculated net profit/loss
