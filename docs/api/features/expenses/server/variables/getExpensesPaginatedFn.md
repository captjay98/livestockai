[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / getExpensesPaginatedFn

# Variable: getExpensesPaginatedFn

> `const` **getExpensesPaginatedFn**: `RequiredFetcher`\<`undefined`, (`data`) => [`ExpenseQuery`](../interfaces/ExpenseQuery.md), `Promise`\<[`PaginatedResult`](../../../batches/server/interfaces/PaginatedResult.md)\<\{ `amount`: `string`; `batchSpecies`: `string` \| `null`; `batchType`: `string` \| `null`; `category`: `string`; `date`: `Date`; `description`: `string`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `isRecurring`: `boolean`; `supplierName`: `string` \| `null`; \}\>\>\>

Defined in: features/expenses/server.ts:707

Server function to retrieve paginated expense records.
