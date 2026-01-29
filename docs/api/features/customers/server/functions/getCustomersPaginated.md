[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/customers/server](../README.md) / getCustomersPaginated

# Function: getCustomersPaginated()

> **getCustomersPaginated**(`query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/customers/server.ts:254

Retrieve a paginated list of customers with search and filter capabilities.
Includes aggregated sales metrics for each customer.

## Parameters

### query

[`CustomerQuery`](../interfaces/CustomerQuery.md) = `{}`

Query parameters (search, pagination, sorting, customerType)

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated set of customer records
