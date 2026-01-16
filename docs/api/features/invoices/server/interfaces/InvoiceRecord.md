[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / InvoiceRecord

# Interface: InvoiceRecord

Defined in: features/invoices/server.ts:9

Represents a summarized invoice record for listing and reporting.

## Properties

### customerName

> **customerName**: `string`

Defined in: features/invoices/server.ts:23

Name of the customer associated with this invoice

***

### date

> **date**: `Date`

Defined in: features/invoices/server.ts:19

Date the invoice was issued

***

### dueDate

> **dueDate**: `Date` \| `null`

Defined in: features/invoices/server.ts:21

Optional date by which payment is expected

***

### id

> **id**: `string`

Defined in: features/invoices/server.ts:11

Unique identifier for the invoice

***

### invoiceNumber

> **invoiceNumber**: `string`

Defined in: features/invoices/server.ts:13

Human-readable invoice number (e.g., INV-2024-0001)

***

### status

> **status**: `"paid"` \| `"partial"` \| `"unpaid"`

Defined in: features/invoices/server.ts:17

Payment status of the invoice

***

### totalAmount

> **totalAmount**: `number`

Defined in: features/invoices/server.ts:15

Total value of all items in the invoice
