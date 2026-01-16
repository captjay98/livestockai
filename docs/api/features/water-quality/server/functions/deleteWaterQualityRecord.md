[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / deleteWaterQualityRecord

# Function: deleteWaterQualityRecord()

> **deleteWaterQualityRecord**(`userId`, `recordId`): `Promise`\<`void`\>

Defined in: features/water-quality/server.ts:520

Deletes a water quality record from the database.

## Parameters

### userId

`string`

ID of the user requesting deletion

### recordId

`string`

ID of the record to delete

## Returns

`Promise`\<`void`\>

Promise resolving when deletion is complete

## Throws

If record not found or user unauthorized
