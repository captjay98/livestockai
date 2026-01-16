[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/suppliers/server](../README.md) / CreateSupplierInput

# Interface: CreateSupplierInput

Defined in: features/suppliers/server.ts:33

Data structure for creating a new supplier record.

## Properties

### email?

> `optional` **email**: `string` \| `null`

Defined in: features/suppliers/server.ts:39

Optional contact email

***

### location?

> `optional` **location**: `string` \| `null`

Defined in: features/suppliers/server.ts:41

Optional location description

***

### name

> **name**: `string`

Defined in: features/suppliers/server.ts:35

Supplier's full name

***

### phone

> **phone**: `string`

Defined in: features/suppliers/server.ts:37

Contact phone number

***

### products

> **products**: `string`[]

Defined in: features/suppliers/server.ts:43

List of products supplied

***

### supplierType?

> `optional` **supplierType**: `"hatchery"` \| `"feed_mill"` \| `"pharmacy"` \| `"equipment"` \| `"fingerlings"` \| `"other"` \| `null`

Defined in: features/suppliers/server.ts:45

Category of supply provided
