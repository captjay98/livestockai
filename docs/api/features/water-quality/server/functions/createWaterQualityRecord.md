[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / createWaterQualityRecord

# Function: createWaterQualityRecord()

> **createWaterQualityRecord**(`userId`, `farmId`, `input`): `Promise`\<`string`\>

Defined in: features/water-quality/server.ts:137

Saves a new water quality record to the database.
Verifies that the batch belongs to the farm and is of type 'fish'.

## Parameters

### userId

`string`

ID of the user performing the action

### farmId

`string`

ID of the farm owning the batch

### input

[`CreateWaterQualityInput`](../interfaces/CreateWaterQualityInput.md)

Water quality metrics

## Returns

`Promise`\<`string`\>

Promise resolving to the new record ID

## Throws

If batch not found or is not a fish batch
