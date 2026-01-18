[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/invoices/server](../README.md) / getInvoices

# Function: getInvoices()

> **getInvoices**(`farmId?`): `Promise`\<`object`[]\>

Defined in: features/invoices/server.ts:152

Retrieve all invoices, optionally filtered by farm.

## Parameters

### farmId?

`string`

Optional ID of the farm to filter by

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of invoices with customer names
