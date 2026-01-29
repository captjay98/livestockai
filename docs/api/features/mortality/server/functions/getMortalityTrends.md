[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / getMortalityTrends

# Function: getMortalityTrends()

> **getMortalityTrends**(`userId`, `batchId`, `period`, `days`): `Promise`\<`object`[]\>

Defined in: features/mortality/server.ts:246

Get mortality trends for a batch (daily/weekly/monthly)

## Parameters

### userId

`string`

ID of the user

### batchId

`string`

ID of the batch

### period

Time grouping (daily, weekly, monthly)

`"daily"` | `"weekly"` | `"monthly"`

### days

`number` = `30`

Number of days to look back

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of trend data points
