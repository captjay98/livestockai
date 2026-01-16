[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/customers/server](../README.md) / getCustomerById

# Function: getCustomerById()

> **getCustomerById**(`customerId`): `Promise`\<\{ `createdAt`: `Date`; `customerType`: `"individual"` \| `"restaurant"` \| `"retailer"` \| `"wholesaler"` \| `"processor"` \| `"exporter"` \| `"government"` \| `null`; `email`: `string` \| `null`; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: features/customers/server.ts:109

Retrieve a single customer record by its unique ID.

## Parameters

### customerId

`string`

ID of the customer to retrieve

## Returns

`Promise`\<\{ `createdAt`: `Date`; `customerType`: `"individual"` \| `"restaurant"` \| `"retailer"` \| `"wholesaler"` \| `"processor"` \| `"exporter"` \| `"government"` \| `null`; `email`: `string` \| `null`; `id`: `string`; `location`: `string` \| `null`; `name`: `string`; `phone`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

Promise resolving to the customer or undefined
