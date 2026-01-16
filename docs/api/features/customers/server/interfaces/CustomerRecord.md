[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/customers/server](../README.md) / CustomerRecord

# Interface: CustomerRecord

Defined in: features/customers/server.ts:10

Represents a customer record with aggregated sales metrics.
Used for CRM and reporting.

## Properties

### createdAt

> **createdAt**: `Date`

Defined in: features/customers/server.ts:27

Timestamp when the customer was first recorded

***

### customerType

> **customerType**: `string` \| `null`

Defined in: features/customers/server.ts:25

Categorization of the customer.
Helps in targeted marketing and pricing.

***

### email

> **email**: `string` \| `null`

Defined in: features/customers/server.ts:18

Optional email address

***

### id

> **id**: `string`

Defined in: features/customers/server.ts:12

Unique identifier for the customer

***

### location

> **location**: `string` \| `null`

Defined in: features/customers/server.ts:20

Optional physical or delivery address

***

### name

> **name**: `string`

Defined in: features/customers/server.ts:14

Full name of the customer or business

***

### phone

> **phone**: `string`

Defined in: features/customers/server.ts:16

Contact phone number

***

### salesCount

> **salesCount**: `number`

Defined in: features/customers/server.ts:29

Aggregate count of sales made to this customer

***

### totalSpent

> **totalSpent**: `number`

Defined in: features/customers/server.ts:31

Aggregate total amount spent by this customer in system currency
