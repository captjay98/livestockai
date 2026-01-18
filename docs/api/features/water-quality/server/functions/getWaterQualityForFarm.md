[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / getWaterQualityForFarm

# Function: getWaterQualityForFarm()

> **getWaterQualityForFarm**(`userId`, `farmId?`): `Promise`\<`object`[]\>

Defined in: features/water-quality/server.ts:202

Retrieves all water quality records for a specific farm or all accessible farms.

## Parameters

### userId

`string`

ID of the user requesting data

### farmId?

`string`

Optional farm filter

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of water quality records with batch and farm info
