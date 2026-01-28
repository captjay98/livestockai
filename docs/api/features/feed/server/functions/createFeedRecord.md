[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / createFeedRecord

# Function: createFeedRecord()

> **createFeedRecord**(`userId`, `farmId`, `input`): `Promise`\<`string`\>

Defined in: features/feed/server.ts:81

Create a new feed record, optionally deduct from inventory, and log audit

## Parameters

### userId

`string`

ID of the user creating the record

### farmId

`string`

ID of the farm

### input

[`CreateFeedRecordInput`](../interfaces/CreateFeedRecordInput.md)

Feed record data

## Returns

`Promise`\<`string`\>

Promise resolving to the created record ID

## Throws

If user lacks access to the farm or inventory is insufficient

## Example

```typescript
const recordId = await createFeedRecord('user_1', 'farm_A', {
    batchId: 'batch_123',
    feedType: 'starter',
    quantityKg: 25,
    cost: 15000,
    date: new Date(),
})
```
