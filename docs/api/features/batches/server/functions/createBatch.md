[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/batches/server](../README.md) / createBatch

# Function: createBatch()

> **createBatch**(`userId`, `data`): `Promise`\<`string`\>

Defined in: features/batches/server.ts:129

Create a new livestock batch and log an audit record

## Parameters

### userId

`string`

ID of the user performing the action

### data

[`CreateBatchData`](../interfaces/CreateBatchData.md)

Batch creation data

## Returns

`Promise`\<`string`\>

Promise resolving to the created batch ID

## Throws

If the user lacks access to the specified farm

## Example

```typescript
const id = await createBatch('user_1', {
  farmId: 'farm_A',
  livestockType: 'poultry',
  species: 'Broiler',
  initialQuantity: 100,
  acquisitionDate: new Date(),
  costPerUnit: 500,
})
```
