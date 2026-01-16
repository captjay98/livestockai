[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / updateMortalityRecord

# Function: updateMortalityRecord()

> **updateMortalityRecord**(`userId`, `recordId`, `input`): `Promise`\<`void`\>

Defined in: features/mortality/server.ts:482

Update a mortality record and adjust batch quantity if the mortality count changed

## Parameters

### userId

`string`

ID of the user

### recordId

`string`

ID of the mortality record to update

### input

[`UpdateMortalityInput`](../interfaces/UpdateMortalityInput.md)

Updated data

## Returns

`Promise`\<`void`\>

## Throws

If record not found, or access denied
