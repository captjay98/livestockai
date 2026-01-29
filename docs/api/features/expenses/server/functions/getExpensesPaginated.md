[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / getExpensesPaginated

# Function: getExpensesPaginated()

> **getExpensesPaginated**(`userId`, `query`): `Promise`\<[`PaginatedResult`](../../../batches/server/interfaces/PaginatedResult.md)\<\{ `amount`: `string`; `batchSpecies`: `string` \| `null`; `batchType`: `string` \| `null`; `category`: `string`; `date`: `Date`; `description`: `string`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `isRecurring`: `boolean`; `supplierName`: `string` \| `null`; \}\>\>

Defined in: features/expenses/server.ts:554

Retrieve a paginated list of expenses with full text search and advanced filters.

## Parameters

### userId

`string`

ID of the user requesting data

### query

[`ExpenseQuery`](../interfaces/ExpenseQuery.md) = `{}`

Sorting, pagination, and filter parameters

## Returns

`Promise`\<[`PaginatedResult`](../../../batches/server/interfaces/PaginatedResult.md)\<\{ `amount`: `string`; `batchSpecies`: `string` \| `null`; `batchType`: `string` \| `null`; `category`: `string`; `date`: `Date`; `description`: `string`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `isRecurring`: `boolean`; `supplierName`: `string` \| `null`; \}\>\>

Promise resolving to a paginated set of expense records with joined entity names
