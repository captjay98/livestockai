[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/suppliers/server](../README.md) / getSuppliersPaginated

# Function: getSuppliersPaginated()

> **getSuppliersPaginated**(`query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/suppliers/server.ts:213

Retrieve a paginated list of suppliers with search and classification filtering.

## Parameters

### query

[`SupplierQuery`](../interfaces/SupplierQuery.md) = `{}`

Query parameters (search, pagination, sorting, supplierType)

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated set of supplier records
