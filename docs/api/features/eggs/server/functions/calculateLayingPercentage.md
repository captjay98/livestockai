[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / calculateLayingPercentage

# Function: calculateLayingPercentage()

> **calculateLayingPercentage**(`userId`, `farmId`, `batchId`, `date?`): `Promise`\<`number` \| `null`\>

Defined in: features/eggs/server.ts:378

Calculates what percentage of the current flock produced eggs on a given date.

## Parameters

### userId

`string`

ID of the calling user

### farmId

`string`

ID of the farm

### batchId

`string`

ID of the layer batch

### date?

`Date`

Optional specific date (defaults to most recent collection)

## Returns

`Promise`\<`number` \| `null`\>

Average laying percentage (0-100) or null if no flock present
