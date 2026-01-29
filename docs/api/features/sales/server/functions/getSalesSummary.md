[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/sales/server](../README.md) / getSalesSummary

# Function: getSalesSummary()

> **getSalesSummary**(`userId`, `farmId?`, `options?`): `Promise`\<\{ `eggs`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; `fish`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; `poultry`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; `total`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; \}\>

Defined in: features/sales/server.ts:532

Get a summary of sales (counts, quantities, revenue) grouped by livestock type

## Parameters

### userId

`string`

ID of the user requesting the summary

### farmId?

`string`

Optional farm ID to filter by

### options?

Optional date range filters

#### endDate?

`Date`

#### startDate?

`Date`

## Returns

`Promise`\<\{ `eggs`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; `fish`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; `poultry`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; `total`: \{ `count`: `number`; `quantity`: `number`; `revenue`: `number`; \}; \}\>

Promise resolving to a sales summary object

## Example

```typescript
const summary = await getSalesSummary('user_1', 'farm_A')
console.log(summary.poultry.revenue)
```
