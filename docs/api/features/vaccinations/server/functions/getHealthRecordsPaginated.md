[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / getHealthRecordsPaginated

# Function: getHealthRecordsPaginated()

> **getHealthRecordsPaginated**(`userId`, `query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/vaccinations/server.ts:216

Retrieve paginated health records (vaccinations and treatments) with filtering and sorting.

## Parameters

### userId

`string`

ID of the user

### query

[`PaginatedQuery`](../interfaces/PaginatedQuery.md) = `{}`

Pagination and filter parameters

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated list of health records
