[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / getMortalityRecordsPaginated

# Function: getMortalityRecordsPaginated()

> **getMortalityRecordsPaginated**(`userId`, `query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/mortality/server.ts:306

Perform a paginated query for mortality records with sorting and search support

## Parameters

### userId

`string`

ID of the user

### query

[`MortalityQuery`](../interfaces/MortalityQuery.md) = `{}`

Pagination and filtering parameters

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated result set
