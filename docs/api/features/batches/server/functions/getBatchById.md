[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / getBatchById

# Function: getBatchById()

> **getBatchById**(`userId`, `batchId`): `Promise`\<\{ `acquisitionDate`: `Date`; `batchName`: `string` \| `null`; `costPerUnit`: `string`; `createdAt`: `Date`; `currentQuantity`: `number`; `farmId`: `string`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `"poultry"` \| `"fish"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"`; `notes`: `string` \| `null`; `sourceSize`: `string` \| `null`; `species`: `string`; `status`: `"active"` \| `"depleted"` \| `"sold"`; `structureName`: `string` \| `null`; `supplierName`: `string` \| `null`; `targetHarvestDate`: `Date` \| `null`; `totalCost`: `string`; `updatedAt`: `Date`; \} \| `null`\>

Defined in: features/batches/server.ts:281

Get a single batch by its unique ID

## Parameters

### userId

`string`

ID of the user requesting the batch

### batchId

`string`

Unique ID of the batch

## Returns

`Promise`\<\{ `acquisitionDate`: `Date`; `batchName`: `string` \| `null`; `costPerUnit`: `string`; `createdAt`: `Date`; `currentQuantity`: `number`; `farmId`: `string`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `"poultry"` \| `"fish"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"`; `notes`: `string` \| `null`; `sourceSize`: `string` \| `null`; `species`: `string`; `status`: `"active"` \| `"depleted"` \| `"sold"`; `structureName`: `string` \| `null`; `supplierName`: `string` \| `null`; `targetHarvestDate`: `Date` \| `null`; `totalCost`: `string`; `updatedAt`: `Date`; \} \| `null`\>

Promise resolving to the batch data or null if not found

## Throws

If the user lacks access to the batch's farm

## Example

```typescript
const batch = await getBatchById('user_1', 'batch_123')
```
