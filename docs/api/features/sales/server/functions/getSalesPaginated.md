[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / getSalesPaginated

# Function: getSalesPaginated()

> **getSalesPaginated**(`userId`, `query`): `Promise`\<[`PaginatedResult`](../../../batches/server/interfaces/PaginatedResult.md)\<\{ `ageWeeks`: `number` \| `null`; `averageWeightKg`: `string` \| `null`; `batchSpecies`: `string` \| `null`; `customerId`: `string` \| `null`; `customerName`: `string` \| `null`; `date`: `Date`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `livestockType`: `string`; `notes`: `string` \| `null`; `paymentMethod`: `string` \| `null`; `paymentStatus`: `string` \| `null`; `quantity`: `number`; `totalAmount`: `string`; `unitPrice`: `string`; `unitType`: `string` \| `null`; \}\>\>

Defined in: features/sales/server.ts:669

Perform a paginated query for sales with support for searching, sorting, and filtering

## Parameters

### userId

`string`

ID of the user performing the query

### query

[`SalesQuery`](../interfaces/SalesQuery.md) = `{}`

Pagination and filter parameters

## Returns

`Promise`\<[`PaginatedResult`](../../../batches/server/interfaces/PaginatedResult.md)\<\{ `ageWeeks`: `number` \| `null`; `averageWeightKg`: `string` \| `null`; `batchSpecies`: `string` \| `null`; `customerId`: `string` \| `null`; `customerName`: `string` \| `null`; `date`: `Date`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `livestockType`: `string`; `notes`: `string` \| `null`; `paymentMethod`: `string` \| `null`; `paymentStatus`: `string` \| `null`; `quantity`: `number`; `totalAmount`: `string`; `unitPrice`: `string`; `unitType`: `string` \| `null`; \}\>\>

Promise resolving to a paginated result set

## Example

```typescript
const result = await getSalesPaginated('user_1', { page: 1, pageSize: 20, livestockType: 'poultry' })
```
