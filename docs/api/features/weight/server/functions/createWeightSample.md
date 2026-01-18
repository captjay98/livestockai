[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/weight/server](../README.md) / createWeightSample

# Function: createWeightSample()

> **createWeightSample**(`userId`, `farmId`, `input`): `Promise`\<`string`\>

Defined in: features/weight/server.ts:67

Create a new weight measurement record for a batch.

## Parameters

### userId

`string`

ID of the user performing the action

### farmId

`string`

ID of the farm the batch belongs to

### input

[`CreateWeightSampleInput`](../interfaces/CreateWeightSampleInput.md)

Weight measurement details

## Returns

`Promise`\<`string`\>

Promise resolving to the new record's ID

## Throws

If farm access is denied or batch not found
