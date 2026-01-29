[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / updateInvoiceStatus

# Function: updateInvoiceStatus()

> **updateInvoiceStatus**(`invoiceId`, `status`): `Promise`\<`void`\>

Defined in: features/invoices/server.ts:239

Update the payment status of an invoice.

## Parameters

### invoiceId

`string`

ID of the invoice

### status

New payment status (unpaid, partial, paid)

`"paid"` | `"partial"` | `"unpaid"`

## Returns

`Promise`\<`void`\>
