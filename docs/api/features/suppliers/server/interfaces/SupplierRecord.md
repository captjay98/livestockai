[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/suppliers/server](../README.md) / SupplierRecord

# Interface: SupplierRecord

Defined in: features/suppliers/server.ts:9

Represents a supplier record with aggregated spending metrics.

## Properties

### createdAt

> **createdAt**: `Date`

Defined in: features/suppliers/server.ts:25

Timestamp when the supplier was registered

---

### email

> **email**: `string` \| `null`

Defined in: features/suppliers/server.ts:17

Optional contact email address

---

### id

> **id**: `string`

Defined in: features/suppliers/server.ts:11

Unique identifier for the supplier

---

### location

> **location**: `string` \| `null`

Defined in: features/suppliers/server.ts:19

Optional physical address or headquarters

---

### name

> **name**: `string`

Defined in: features/suppliers/server.ts:13

Name of the supplier or business entity

---

### phone

> **phone**: `string`

Defined in: features/suppliers/server.ts:15

Primary contact phone number

---

### products

> **products**: `string`[]

Defined in: features/suppliers/server.ts:21

List of products or services provided by this supplier

---

### supplierType

> **supplierType**: `string` \| `null`

Defined in: features/suppliers/server.ts:23

Specific classification (e.g., hatchery, feed mill)

---

### totalSpent

> **totalSpent**: `number`

Defined in: features/suppliers/server.ts:27

Aggregate total amount spent with this supplier in system currency
