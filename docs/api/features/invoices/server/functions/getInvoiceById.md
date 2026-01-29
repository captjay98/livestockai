[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / getInvoiceById

# Function: getInvoiceById()

> **getInvoiceById**(`invoiceId`): `Promise`\<\{ `customerEmail`: `string` \| `null`; `customerId`: `string`; `customerLocation`: `string` \| `null`; `customerName`: `string`; `customerPhone`: `string`; `date`: `Date`; `dueDate`: `Date` \| `null`; `farmLocation`: `string`; `farmName`: `string`; `id`: `string`; `invoiceNumber`: `string`; `items`: `object`[]; `notes`: `string` \| `null`; `status`: `"paid"` \| `"partial"` \| `"unpaid"`; `totalAmount`: `string`; \} \| `null`\>

Defined in: features/invoices/server.ts:181

Retrieve full details for a single invoice including its line items and associated customer profile.

## Parameters

### invoiceId

`string`

ID of the invoice to retrieve

## Returns

`Promise`\<\{ `customerEmail`: `string` \| `null`; `customerId`: `string`; `customerLocation`: `string` \| `null`; `customerName`: `string`; `customerPhone`: `string`; `date`: `Date`; `dueDate`: `Date` \| `null`; `farmLocation`: `string`; `farmName`: `string`; `id`: `string`; `invoiceNumber`: `string`; `items`: `object`[]; `notes`: `string` \| `null`; `status`: `"paid"` \| `"partial"` \| `"unpaid"`; `totalAmount`: `string`; \} \| `null`\>

Promise resolving to the complete invoice profile or null if not found
