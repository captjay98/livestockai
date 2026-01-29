[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / updateWaterQualityRecord

# Function: updateWaterQualityRecord()

> **updateWaterQualityRecord**(`userId`, `recordId`, `input`): `Promise`\<`void`\>

Defined in: features/water-quality/server.ts:456

Updates an existing water quality record.

## Parameters

### userId

`string`

ID of the user performing the update

### recordId

`string`

ID of the record to update

### input

[`UpdateWaterQualityInput`](../interfaces/UpdateWaterQualityInput.md)

Partial update parameters

## Returns

`Promise`\<`void`\>

Promise resolving when update is complete

## Throws

If record not found or user unauthorized
