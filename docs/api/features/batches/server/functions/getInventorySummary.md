[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / getInventorySummary

# Function: getInventorySummary()

> **getInventorySummary**(`userId`, `farmId?`): `Promise`\<\{ `currentWeight`: `null`; `feed`: \{ `fcr`: `number`; `totalCost`: `number`; `totalFeedings`: `number`; `totalKg`: `number`; \}; `fish`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `overall`: \{ `activeBatches`: `number`; `depletedBatches`: `number`; `totalBatches?`: `undefined`; `totalInvestment`: `number`; `totalQuantity`: `number`; \}; `poultry`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `sales`: \{ `totalQuantity`: `number`; `totalRevenue`: `number`; `totalSales`: `number`; \}; \} \| \{ `currentWeight`: `number` \| `null`; `feed`: \{ `fcr`: `number`; `totalCost`: `number`; `totalFeedings`: `number`; `totalKg`: `number`; \}; `fish`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `overall`: \{ `activeBatches`: `number`; `depletedBatches`: `number`; `totalBatches`: `number`; `totalInvestment`: `number`; `totalQuantity`: `number`; \}; `poultry`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `sales`: \{ `totalQuantity`: `number`; `totalRevenue`: `number`; `totalSales`: `number`; \}; \}\>

Defined in: features/batches/server.ts:632

Get inventory summary across all farms or for a specific farm

## Parameters

### userId

`string`

ID of the user requesting the summary

### farmId?

`string`

Optional farm ID to filter by

## Returns

`Promise`\<\{ `currentWeight`: `null`; `feed`: \{ `fcr`: `number`; `totalCost`: `number`; `totalFeedings`: `number`; `totalKg`: `number`; \}; `fish`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `overall`: \{ `activeBatches`: `number`; `depletedBatches`: `number`; `totalBatches?`: `undefined`; `totalInvestment`: `number`; `totalQuantity`: `number`; \}; `poultry`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `sales`: \{ `totalQuantity`: `number`; `totalRevenue`: `number`; `totalSales`: `number`; \}; \} \| \{ `currentWeight`: `number` \| `null`; `feed`: \{ `fcr`: `number`; `totalCost`: `number`; `totalFeedings`: `number`; `totalKg`: `number`; \}; `fish`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `overall`: \{ `activeBatches`: `number`; `depletedBatches`: `number`; `totalBatches`: `number`; `totalInvestment`: `number`; `totalQuantity`: `number`; \}; `poultry`: \{ `batches`: `number`; `investment`: `number`; `quantity`: `number`; \}; `sales`: \{ `totalQuantity`: `number`; `totalRevenue`: `number`; `totalSales`: `number`; \}; \}\>

Promise resolving to an inventory summary (overall, poultry, fish, etc.)

## Example

```typescript
const summary = await getInventorySummary('user_1')
```
