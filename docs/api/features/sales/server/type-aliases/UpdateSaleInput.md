[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/sales/server](../README.md) / UpdateSaleInput

# Type Alias: UpdateSaleInput

> **UpdateSaleInput** = `object`

Defined in: features/sales/server.ts:254

Input data for updating an existing sales record

## Properties

### ageWeeks?

> `optional` **ageWeeks**: `number` \| `null`

Defined in: features/sales/server.ts:267

Updated age in weeks

---

### averageWeightKg?

> `optional` **averageWeightKg**: `number` \| `null`

Defined in: features/sales/server.ts:269

Updated average weight in kg

---

### date?

> `optional` **date**: `Date`

Defined in: features/sales/server.ts:260

Updated transaction date

---

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/sales/server.ts:262

Updated transaction notes

---

### paymentMethod?

> `optional` **paymentMethod**: [`PaymentMethod`](PaymentMethod.md) \| `null`

Defined in: features/sales/server.ts:273

Updated payment method

---

### paymentStatus?

> `optional` **paymentStatus**: [`PaymentStatus`](PaymentStatus.md) \| `null`

Defined in: features/sales/server.ts:271

Updated payment status

---

### quantity?

> `optional` **quantity**: `number`

Defined in: features/sales/server.ts:256

Updated quantity sold

---

### unitPrice?

> `optional` **unitPrice**: `number`

Defined in: features/sales/server.ts:258

Updated unit price

---

### unitType?

> `optional` **unitType**: [`UnitType`](UnitType.md) \| `null`

Defined in: features/sales/server.ts:265

Updated unit type
