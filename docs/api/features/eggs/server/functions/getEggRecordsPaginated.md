[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / getEggRecordsPaginated

# Function: getEggRecordsPaginated()

> **getEggRecordsPaginated**(`userId`, `query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/eggs/server.ts:467

Retrieves a filtered and sorted list of production entries.

## Parameters

### userId

`string`

ID of the requesting user

### query

[`EggQuery`](../interfaces/EggQuery.md) = `{}`

Sorting, searches, and pagination params

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Paginated result set of egg collection entries
