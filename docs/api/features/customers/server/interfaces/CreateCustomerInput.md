[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/customers/server](../README.md) / CreateCustomerInput

# Interface: CreateCustomerInput

Defined in: features/customers/server.ts:37

Data structure for creating a new customer record.

## Properties

### customerType?

> `optional` **customerType**: `"individual"` \| `"restaurant"` \| `"retailer"` \| `"wholesaler"` \| `null`

Defined in: features/customers/server.ts:47

Optional classification of the customer

---

### email?

> `optional` **email**: `string` \| `null`

Defined in: features/customers/server.ts:43

Optional contact email

---

### location?

> `optional` **location**: `string` \| `null`

Defined in: features/customers/server.ts:45

Optional delivery or business address

---

### name

> **name**: `string`

Defined in: features/customers/server.ts:39

Customer's full name

---

### phone

> **phone**: `string`

Defined in: features/customers/server.ts:41

Contact phone number
