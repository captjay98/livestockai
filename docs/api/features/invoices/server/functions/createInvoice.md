[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / createInvoice

# Function: createInvoice()

> **createInvoice**(`input`): `Promise`\<`string`\>

Defined in: features/invoices/server.ts:95

Create a new invoice and its individual line items.
Automatically generates a unique invoice number and calculates the total amount.

## Parameters

### input

[`CreateInvoiceInput`](../interfaces/CreateInvoiceInput.md)

Billing details, customer, and items

## Returns

`Promise`\<`string`\>

Promise resolving to the new invoice ID
