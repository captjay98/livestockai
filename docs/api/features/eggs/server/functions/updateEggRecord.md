[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / updateEggRecord

# Function: updateEggRecord()

> **updateEggRecord**(`userId`, `recordId`, `data`): `Promise`\<`boolean`\>

Defined in: features/eggs/server.ts:152

Updates an existing production entry.

## Parameters

### userId

`string`

ID of the user performing the update

### recordId

`string`

ID of the record to update

### data

[`UpdateEggRecordInput`](../interfaces/UpdateEggRecordInput.md)

Partial update parameters

## Returns

`Promise`\<`boolean`\>

Promise resolving to true on success
