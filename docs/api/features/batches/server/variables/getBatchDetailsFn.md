[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / getBatchDetailsFn

# Variable: getBatchDetailsFn

> `const` **getBatchDetailsFn**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `batch`: \{ `acquisitionDate`: `Date`; `batchName`: `string` \| `null`; `costPerUnit`: `string`; `createdAt`: `Date`; `currentQuantity`: `number`; `farmId`: `string`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `"poultry"` \| `"fish"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"`; `notes`: `string` \| `null`; `sourceSize`: `string` \| `null`; `species`: `string`; `status`: `"active"` \| `"depleted"` \| `"sold"`; `structureName`: `string` \| `null`; `supplierName`: `string` \| `null`; `targetHarvestDate`: `Date` \| `null`; `totalCost`: `string`; `updatedAt`: `Date`; \}; `currentWeight`: `number` \| `null`; `expenses`: \{ `total`: `number`; \}; `feed`: \{ `fcr`: `number` \| `null`; `totalCost`: `number`; `totalFeedings`: `number`; `totalKg`: `number`; \}; `mortality`: \{ `rate`: `number`; `totalDeaths`: `number`; `totalQuantity`: `number`; \}; `sales`: \{ `totalQuantity`: `number`; `totalRevenue`: `number`; `totalSales`: `number`; \}; \}\>\>

Defined in: features/batches/server.ts:991
