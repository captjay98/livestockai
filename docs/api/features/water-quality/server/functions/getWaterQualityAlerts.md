[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / getWaterQualityAlerts

# Function: getWaterQualityAlerts()

> **getWaterQualityAlerts**(`userId`, `farmId?`): `Promise`\<`object`[]\>

Defined in: features/water-quality/server.ts:246

Computes active alerts for all fish batches based on their most recent water quality readings.

## Parameters

### userId

`string`

ID of the user requesting alerts

### farmId?

`string`

Optional farm filter

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of active alerts with issues and severity
