[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/customers/server](../README.md) / getCustomerWithSales

# Function: getCustomerWithSales()

> **getCustomerWithSales**(`customerId`): `Promise`\<\{ `createdAt`: `Date`; `customerType`: `"individual"` \| `"restaurant"` \| `"retailer"` \| `"wholesaler"` \| `"processor"` \| `"exporter"` \| `"government"` \| `null`; `email`: `string` \| `null`; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `sales`: `object`[]; `salesCount`: `number`; `totalSpent`: `number`; `updatedAt`: `Date`; \} \| `null`\>

Defined in: features/customers/server.ts:177

Retrieve a customer's full profile including their entire purchase history.

## Parameters

### customerId

`string`

ID of the customer

## Returns

`Promise`\<\{ `createdAt`: `Date`; `customerType`: `"individual"` \| `"restaurant"` \| `"retailer"` \| `"wholesaler"` \| `"processor"` \| `"exporter"` \| `"government"` \| `null`; `email`: `string` \| `null`; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `sales`: `object`[]; `salesCount`: `number`; `totalSpent`: `number`; `updatedAt`: `Date`; \} \| `null`\>

Promise resolving to customer details with sales history and total spent
