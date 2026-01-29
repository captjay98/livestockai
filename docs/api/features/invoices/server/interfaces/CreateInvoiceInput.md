[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / CreateInvoiceInput

# Interface: CreateInvoiceInput

Defined in: features/invoices/server.ts:29

Data structure for creating a new invoice.

## Properties

### customerId

> **customerId**: `string`

Defined in: features/invoices/server.ts:31

ID of the customer being billed

---

### dueDate?

> `optional` **dueDate**: `Date` \| `null`

Defined in: features/invoices/server.ts:44

Optional payment deadline

---

### farmId

> **farmId**: `string`

Defined in: features/invoices/server.ts:33

ID of the farm issuing the invoice

---

### items

> **items**: `object`[]

Defined in: features/invoices/server.ts:35

List of line items to include

#### description

> **description**: `string`

Description of the product or service

#### quantity

> **quantity**: `number`

Quantity sold

#### unitPrice

> **unitPrice**: `number`

Price per unit

---

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/invoices/server.ts:46

Optional internal or external notes
