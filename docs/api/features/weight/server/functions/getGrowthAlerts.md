[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/weight/server](../README.md) / getGrowthAlerts

# Function: getGrowthAlerts()

> **getGrowthAlerts**(`userId`, `farmId?`): `Promise`\<`object`[]\>

Defined in: features/weight/server.ts:259

Generate alerts for batches with growth rates significantly below expectations.

## Parameters

### userId

`string`

ID of the user

### farmId?

`string`

Optional ID of a specific farm

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of growth alerts
