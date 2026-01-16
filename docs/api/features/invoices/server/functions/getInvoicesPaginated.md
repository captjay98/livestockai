[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / getInvoicesPaginated

# Function: getInvoicesPaginated()

> **getInvoicesPaginated**(`query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/invoices/server.ts:324

Retrieve a paginated list of invoices with advanced searching, status filtering, and sorting.

## Parameters

### query

[`InvoiceQuery`](../interfaces/InvoiceQuery.md) = `{}`

Query and pagination parameters

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated set of invoice records
