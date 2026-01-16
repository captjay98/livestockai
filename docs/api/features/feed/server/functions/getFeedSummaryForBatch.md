[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / getFeedSummaryForBatch

# Function: getFeedSummaryForBatch()

> **getFeedSummaryForBatch**(`userId`, `farmId`, `batchId`): `Promise`\<\{ `byType`: \{\[`key`: `string`\]: \{ `cost`: `number`; `quantityKg`: `number`; \} \| `undefined`; \}; `recordCount`: `number`; `totalCost`: `number`; `totalQuantityKg`: `number`; \}\>

Defined in: features/feed/server.ts:451

Get summary of total feed consumption and costs for a batch, grouped by feed type

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

`Promise`\<\{ `byType`: \{\[`key`: `string`\]: \{ `cost`: `number`; `quantityKg`: `number`; \} \| `undefined`; \}; `recordCount`: `number`; `totalCost`: `number`; `totalQuantityKg`: `number`; \}\>

Promise resolving to a feed summary object
