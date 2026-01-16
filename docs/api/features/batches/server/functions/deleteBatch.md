[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / deleteBatch

# Function: deleteBatch()

> **deleteBatch**(`userId`, `batchId`): `Promise`\<`void`\>

Defined in: features/batches/server.ts:416

Delete a batch if it has no related records (feed, sales, etc.)

## Parameters

### userId

`string`

ID of the user performing the deletion

### batchId

`string`

ID of the batch to delete

## Returns

`Promise`\<`void`\>

## Throws

If the batch is not found, access is denied, or it has related records

## Example

```typescript
await deleteBatch('user_1', 'batch_123')
```
