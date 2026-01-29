[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/weight/server](../README.md) / getWeightSamplesForBatch

# Function: getWeightSamplesForBatch()

> **getWeightSamplesForBatch**(`userId`, `farmId`, `batchId`): `Promise`\<`object`[]\>

Defined in: features/weight/server.ts:128

Retrieve all weight samples for a specific livestock batch.

## Parameters

### userId

`string`

ID of the user

### farmId

`string`

ID of the farm

### batchId

`string`

ID of the batch

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of weight records
