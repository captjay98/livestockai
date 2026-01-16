[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / deleteFeedRecord

# Function: deleteFeedRecord()

> **deleteFeedRecord**(`userId`, `farmId`, `recordId`): `Promise`\<`void`\>

Defined in: features/feed/server.ts:193

Delete a feeding record and restore the consumed quantity back to inventory

## Parameters

### userId

`string`

ID of the user performing the deletion

### farmId

`string`

ID of the farm

### recordId

`string`

ID of the feed record to delete

## Returns

`Promise`\<`void`\>

## Throws

If record is not found or access is denied
