[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/farms/server](../README.md) / getFarmStats

# Function: getFarmStats()

> **getFarmStats**(`farmId`, `userId`): `Promise`\<\{ `batches`: \{ `active`: `number`; `total`: `number`; `totalLivestock`: `number`; \}; `expenses`: \{ `amount`: `number`; `count`: `number`; \}; `sales`: \{ `count`: `number`; `revenue`: `number`; \}; \}\>

Defined in: features/farms/server.ts:303

Calculate and retrieve key statistics for a farm, including livestock count,
recent sales volume, and expense totals.

## Parameters

### farmId

`string`

ID of the farm

### userId

`string`

ID of the user requesting stats

## Returns

`Promise`\<\{ `batches`: \{ `active`: `number`; `total`: `number`; `totalLivestock`: `number`; \}; `expenses`: \{ `amount`: `number`; `count`: `number`; \}; `sales`: \{ `count`: `number`; `revenue`: `number`; \}; \}\>

Promise resolving to a statistics summary object

## Throws

If access is denied
