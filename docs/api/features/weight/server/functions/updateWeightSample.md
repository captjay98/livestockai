[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/weight/server](../README.md) / updateWeightSample

# Function: updateWeightSample()

> **updateWeightSample**(`userId`, `recordId`, `input`): `Promise`\<`void`\>

Defined in: features/weight/server.ts:460

Update an existing weight measurement record.

## Parameters

### userId

`string`

ID of the user

### recordId

`string`

ID of the record to update

### input

[`UpdateWeightSampleInput`](../interfaces/UpdateWeightSampleInput.md)

Updated measurement details

## Returns

`Promise`\<`void`\>

## Throws

If record not found or access denied
