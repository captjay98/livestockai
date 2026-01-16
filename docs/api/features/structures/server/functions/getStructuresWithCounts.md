[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/structures/server](../README.md) / getStructuresWithCounts

# Function: getStructuresWithCounts()

> **getStructuresWithCounts**(`userId`, `farmId`): `Promise`\<`object`[]\>

Defined in: features/structures/server.ts:344

Retrieve a list of farm structures including aggregated livestock counts for each.
Calculates both the number of active batches and the total animal headcount per structure.

## Parameters

### userId

`string`

ID of the user requesting the data

### farmId

`string`

ID of the farm

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of structures with batch and animal totals
