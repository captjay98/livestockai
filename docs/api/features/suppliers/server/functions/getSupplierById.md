[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/suppliers/server](../README.md) / getSupplierById

# Function: getSupplierById()

> **getSupplierById**(`supplierId`): `Promise`\<\{ `createdAt`: `Date`; `email`: `string` \| `null`; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `products`: `string`[]; `supplierType`: `"hatchery"` \| `"feed_mill"` \| `"pharmacy"` \| `"equipment"` \| `"fingerlings"` \| `"cattle_dealer"` \| `"goat_dealer"` \| `"sheep_dealer"` \| `"bee_supplier"` \| `"other"` \| `null`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: features/suppliers/server.ts:122

Retrieve a specific supplier record by its unique ID.

## Parameters

### supplierId

`string`

ID of the supplier to retrieve

## Returns

`Promise`\<\{ `createdAt`: `Date`; `email`: `string` \| `null`; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `products`: `string`[]; `supplierType`: `"hatchery"` \| `"feed_mill"` \| `"pharmacy"` \| `"equipment"` \| `"fingerlings"` \| `"cattle_dealer"` \| `"goat_dealer"` \| `"sheep_dealer"` \| `"bee_supplier"` \| `"other"` \| `null`; `updatedAt`: `Date`; \} \| `undefined`\>

Promise resolving to the supplier or undefined
