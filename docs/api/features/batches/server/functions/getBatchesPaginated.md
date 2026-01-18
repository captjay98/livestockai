[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / getBatchesPaginated

# Function: getBatchesPaginated()

> **getBatchesPaginated**(`userId`, `query`): `Promise`\<[`PaginatedResult`](../interfaces/PaginatedResult.md)\<\{ `acquisitionDate`: `Date`; `costPerUnit`: `string`; `currentQuantity`: `number`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `string`; `species`: `string`; `status`: `string`; `totalCost`: `string`; \}\>\>

Defined in: features/batches/server.ts:834

Perform a paginated query for batches with support for searching, sorting, and filtering

## Parameters

### userId

`string`

ID of the user performing the query

### query

[`PaginatedQuery`](../interfaces/PaginatedQuery.md) = `{}`

Pagination and filter parameters

## Returns

`Promise`\<[`PaginatedResult`](../interfaces/PaginatedResult.md)\<\{ `acquisitionDate`: `Date`; `costPerUnit`: `string`; `currentQuantity`: `number`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `initialQuantity`: `number`; `livestockType`: `string`; `species`: `string`; `status`: `string`; `totalCost`: `string`; \}\>\>

Promise resolving to a paginated result set

## Example

```typescript
const result = await getBatchesPaginated('user_1', {
  page: 1,
  pageSize: 20,
  status: 'active',
})
```
