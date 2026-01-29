[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / getInvoiceByIdFn

# Variable: getInvoiceByIdFn

> `const` **getInvoiceByIdFn**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `customerEmail`: `string` \| `null`; `customerId`: `string`; `customerLocation`: `string` \| `null`; `customerName`: `string`; `customerPhone`: `string`; `date`: `Date`; `dueDate`: `Date` \| `null`; `farmLocation`: `string`; `farmName`: `string`; `id`: `string`; `invoiceNumber`: `string`; `items`: `object`[]; `notes`: `string` \| `null`; `status`: `"paid"` \| `"partial"` \| `"unpaid"`; `totalAmount`: `string`; \} \| `null`\>\>

Defined in: features/invoices/server.ts:227

Server function to retrieve an invoice by ID.
