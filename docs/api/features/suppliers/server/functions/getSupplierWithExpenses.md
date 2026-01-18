[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/suppliers/server](../README.md) / getSupplierWithExpenses

# Function: getSupplierWithExpenses()

> **getSupplierWithExpenses**(`supplierId`): `Promise`\<\{ `createdAt`: `Date`; `email`: `string` \| `null`; `expenseCount`: `number`; `expenses`: `object`[]; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `products`: `string`[]; `supplierType`: `"hatchery"` \| `"feed_mill"` \| `"pharmacy"` \| `"equipment"` \| `"fingerlings"` \| `"cattle_dealer"` \| `"goat_dealer"` \| `"sheep_dealer"` \| `"bee_supplier"` \| `"other"` \| `null`; `totalSpent`: `number`; `updatedAt`: `Date`; \} \| `null`\>

Defined in: features/suppliers/server.ts:188

Retrieve a supplier's profile along with a history of all tracked expenses (sourcing).

## Parameters

### supplierId

`string`

ID of the supplier

## Returns

`Promise`\<\{ `createdAt`: `Date`; `email`: `string` \| `null`; `expenseCount`: `number`; `expenses`: `object`[]; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `products`: `string`[]; `supplierType`: `"hatchery"` \| `"feed_mill"` \| `"pharmacy"` \| `"equipment"` \| `"fingerlings"` \| `"cattle_dealer"` \| `"goat_dealer"` \| `"sheep_dealer"` \| `"bee_supplier"` \| `"other"` \| `null`; `totalSpent`: `number`; `updatedAt`: `Date`; \} \| `null`\>

Promise resolving to supplier details with expense history and total spent
