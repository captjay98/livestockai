[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/weight/server](../README.md) / getWeightRecordsPaginated

# Function: getWeightRecordsPaginated()

> **getWeightRecordsPaginated**(`userId`, `query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/weight/server.ts:337

Retrieve a paginated list of weight records for a user's farms.

## Parameters

### userId

`string`

ID of the user

### query

[`WeightQuery`](../interfaces/WeightQuery.md) = `{}`

Query parameters (search, pagination, sorting)

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated set of weight records
