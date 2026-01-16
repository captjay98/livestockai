[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / getFeedStats

# Function: getFeedStats()

> **getFeedStats**(`userId`, `farmId?`): `Promise`\<\{ `recordCount`: `number`; `totalCost`: `number`; `totalQuantityKg`: `number`; \}\>

Defined in: features/feed/server.ts:713

Generates high-level statistics for feed consumption.

## Parameters

### userId

`string`

ID of the requesting user

### farmId?

`string`

Optional specific farm to filter by

## Returns

`Promise`\<\{ `recordCount`: `number`; `totalCost`: `number`; `totalQuantityKg`: `number`; \}\>
