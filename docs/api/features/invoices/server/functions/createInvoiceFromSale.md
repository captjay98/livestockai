[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / createInvoiceFromSale

# Function: createInvoiceFromSale()

> **createInvoiceFromSale**(`saleId`): `Promise`\<`string` \| `null`\>

Defined in: features/invoices/server.ts:285

Utility function to convert a sales transaction into a professional invoice.
Automatically maps livestock type and quantity to an invoice line item.

## Parameters

### saleId

`string`

ID of the sale to bill for

## Returns

`Promise`\<`string` \| `null`\>

Promise resolving to the new invoice ID or null if sale/customer invalid
