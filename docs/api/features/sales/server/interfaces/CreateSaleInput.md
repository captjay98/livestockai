[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / CreateSaleInput

# Interface: CreateSaleInput

Defined in: features/sales/server.ts:53

Input data for creating a new sales record

## Properties

### ageWeeks?

> `optional` **ageWeeks**: `number` \| `null`

Defined in: features/sales/server.ts:74

Optional age of the livestock in weeks at time of sale

***

### averageWeightKg?

> `optional` **averageWeightKg**: `number` \| `null`

Defined in: features/sales/server.ts:76

Optional average weight in kilograms at time of sale

***

### batchId?

> `optional` **batchId**: `string` \| `null`

Defined in: features/sales/server.ts:57

Optional ID of the specific batch being sold from

***

### customerId?

> `optional` **customerId**: `string` \| `null`

Defined in: features/sales/server.ts:59

Optional ID of the customer who made the purchase

***

### date

> **date**: `Date`

Defined in: features/sales/server.ts:67

Date of the transaction

***

### farmId

> **farmId**: `string`

Defined in: features/sales/server.ts:55

ID of the farm the sale belongs to

***

### livestockType

> **livestockType**: `"poultry"` \| `"fish"` \| `"eggs"`

Defined in: features/sales/server.ts:61

The type of item sold (poultry, fish, or eggs)

***

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/sales/server.ts:69

Optional transaction notes

***

### paymentMethod?

> `optional` **paymentMethod**: [`PaymentMethod`](../type-aliases/PaymentMethod.md) \| `null`

Defined in: features/sales/server.ts:80

Method of payment used (cash, transfer, credit)

***

### paymentStatus?

> `optional` **paymentStatus**: [`PaymentStatus`](../type-aliases/PaymentStatus.md) \| `null`

Defined in: features/sales/server.ts:78

Status of the payment (paid, pending, partial)

***

### quantity

> **quantity**: `number`

Defined in: features/sales/server.ts:63

Quantity of items sold

***

### unitPrice

> **unitPrice**: `number`

Defined in: features/sales/server.ts:65

Unit price for the item sold

***

### unitType?

> `optional` **unitType**: [`UnitType`](../type-aliases/UnitType.md) \| `null`

Defined in: features/sales/server.ts:72

The unit of measurement for quantity (bird, kg, crate, piece)
