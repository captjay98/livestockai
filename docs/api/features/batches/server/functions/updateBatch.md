[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/batches/server](../README.md) / updateBatch

# Function: updateBatch()

> **updateBatch**(`userId`, `batchId`, `data`): `Promise`\<\{ `acquisitionDate`: `Date`; `batchName`: `string` \| `null`; `costPerUnit`: `string`; `createdAt`: `Date`; `currentQuantity`: `number`; `farmId`: `string`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `"poultry"` \| `"fish"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"`; `notes`: `string` \| `null`; `sourceSize`: `string` \| `null`; `species`: `string`; `status`: `"active"` \| `"depleted"` \| `"sold"`; `structureName`: `string` \| `null`; `supplierName`: `string` \| `null`; `targetHarvestDate`: `Date` \| `null`; `totalCost`: `string`; `updatedAt`: `Date`; \} \| `null`\>

Defined in: features/batches/server.ts:339

Update an existing livestock batch

## Parameters

### userId

`string`

ID of the user performing the update

### batchId

`string`

ID of the batch to update

### data

[`UpdateBatchData`](../interfaces/UpdateBatchData.md)

Updated batch fields

## Returns

`Promise`\<\{ `acquisitionDate`: `Date`; `batchName`: `string` \| `null`; `costPerUnit`: `string`; `createdAt`: `Date`; `currentQuantity`: `number`; `farmId`: `string`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `"poultry"` \| `"fish"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"`; `notes`: `string` \| `null`; `sourceSize`: `string` \| `null`; `species`: `string`; `status`: `"active"` \| `"depleted"` \| `"sold"`; `structureName`: `string` \| `null`; `supplierName`: `string` \| `null`; `targetHarvestDate`: `Date` \| `null`; `totalCost`: `string`; `updatedAt`: `Date`; \} \| `null`\>

Promise resolving to the updated batch data

## Throws

If the batch is not found or access is denied

## Example

```typescript
await updateBatch('user_1', 'batch_123', { status: 'depleted' })
```
