[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / getFeedRecordsPaginated

# Function: getFeedRecordsPaginated()

> **getFeedRecordsPaginated**(`userId`, `query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/feed/server.ts:596

Perform a paginated query for feeding records with sorting and search support

## Parameters

### userId

`string`

ID of the user

### query

[`FeedQuery`](../interfaces/FeedQuery.md) = `{}`

Pagination and filtering parameters

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated result set
