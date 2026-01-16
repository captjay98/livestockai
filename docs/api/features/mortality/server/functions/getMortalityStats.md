[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / getMortalityStats

# Function: getMortalityStats()

> **getMortalityStats**(`userId`, `batchId`): `Promise`\<\{ `batch`: \{ `currentQuantity`: `number`; `initialQuantity`: `number`; `lost`: `number`; `remaining`: `number`; \}; `byCause`: `object`[]; `recent`: \{ `quantity`: `number`; `rate`: `number`; `records`: `number`; \}; `total`: \{ `quantity`: `number`; `rate`: `number`; `records`: `number`; \}; \}\>

Defined in: features/mortality/server.ts:150

Get mortality statistics for a batch

## Parameters

### userId

`string`

### batchId

`string`

## Returns

`Promise`\<\{ `batch`: \{ `currentQuantity`: `number`; `initialQuantity`: `number`; `lost`: `number`; `remaining`: `number`; \}; `byCause`: `object`[]; `recent`: \{ `quantity`: `number`; `rate`: `number`; `records`: `number`; \}; `total`: \{ `quantity`: `number`; `rate`: `number`; `records`: `number`; \}; \}\>
