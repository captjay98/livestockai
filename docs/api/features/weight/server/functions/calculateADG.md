[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/weight/server](../README.md) / calculateADG

# Function: calculateADG()

> **calculateADG**(`userId`, `farmId`, `batchId`): `Promise`\<\{ `adg`: `number`; `daysBetween`: `number`; `weightGain`: `number`; \} \| `null`\>

Defined in: features/weight/server.ts:211

Calculate the Average Daily Gain (ADG) for a specific livestock batch.
Calculates growth rate based on the first and last recorded weight samples.

## Parameters

### userId

`string`

ID of the user

### farmId

`string`

ID of the farm

### batchId

`string`

ID of the batch

## Returns

`Promise`\<\{ `adg`: `number`; `daysBetween`: `number`; `weightGain`: `number`; \} \| `null`\>

Promise resolving to an ADG summary or null if insufficient data
