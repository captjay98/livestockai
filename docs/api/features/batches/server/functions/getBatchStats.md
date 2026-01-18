[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / getBatchStats

# Function: getBatchStats()

> **getBatchStats**(`userId`, `batchId`): `Promise`\<\{ `batch`: \{ `acquisitionDate`: `Date`; `batchName`: `string` \| `null`; `costPerUnit`: `string`; `createdAt`: `Date`; `currentQuantity`: `number`; `farmId`: `string`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `"poultry"` \| `"fish"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"`; `notes`: `string` \| `null`; `sourceSize`: `string` \| `null`; `species`: `string`; `status`: `"active"` \| `"depleted"` \| `"sold"`; `structureName`: `string` \| `null`; `supplierName`: `string` \| `null`; `targetHarvestDate`: `Date` \| `null`; `totalCost`: `string`; `updatedAt`: `Date`; \}; `currentWeight`: `number` \| `null`; `expenses`: \{ `total`: `number`; \}; `feed`: \{ `fcr`: `number` \| `null`; `totalCost`: `number`; `totalFeedings`: `number`; `totalKg`: `number`; \}; `mortality`: \{ `rate`: `number`; `totalDeaths`: `number`; `totalQuantity`: `number`; \}; `sales`: \{ `totalQuantity`: `number`; `totalRevenue`: `number`; `totalSales`: `number`; \}; \}\>

Defined in: features/batches/server.ts:515

Retrieve comprehensive statistics for a specific batch, including mortality, feed, and sales

## Parameters

### userId

`string`

ID of the user requesting stats

### batchId

`string`

ID of the batch

## Returns

`Promise`\<\{ `batch`: \{ `acquisitionDate`: `Date`; `batchName`: `string` \| `null`; `costPerUnit`: `string`; `createdAt`: `Date`; `currentQuantity`: `number`; `farmId`: `string`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `"poultry"` \| `"fish"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"`; `notes`: `string` \| `null`; `sourceSize`: `string` \| `null`; `species`: `string`; `status`: `"active"` \| `"depleted"` \| `"sold"`; `structureName`: `string` \| `null`; `supplierName`: `string` \| `null`; `targetHarvestDate`: `Date` \| `null`; `totalCost`: `string`; `updatedAt`: `Date`; \}; `currentWeight`: `number` \| `null`; `expenses`: \{ `total`: `number`; \}; `feed`: \{ `fcr`: `number` \| `null`; `totalCost`: `number`; `totalFeedings`: `number`; `totalKg`: `number`; \}; `mortality`: \{ `rate`: `number`; `totalDeaths`: `number`; `totalQuantity`: `number`; \}; `sales`: \{ `totalQuantity`: `number`; `totalRevenue`: `number`; `totalSales`: `number`; \}; \}\>

Promise resolving to a statistical summary object

## Throws

If the batch is not found or access is denied

## Example

```typescript
const stats = await getBatchStats('user_1', 'batch_123')
console.log(stats.mortality.rate)
```
