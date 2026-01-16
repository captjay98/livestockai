[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/reports/server](../README.md) / SalesReport

# Interface: SalesReport

Defined in: features/reports/server.ts:58

## Properties

### period

> **period**: [`DateRange`](DateRange.md)

Defined in: features/reports/server.ts:59

***

### sales

> **sales**: `object`[]

Defined in: features/reports/server.ts:60

#### customerName

> **customerName**: `string` \| `null`

#### date

> **date**: `Date`

#### id

> **id**: `string`

#### livestockType

> **livestockType**: `string`

#### quantity

> **quantity**: `number`

#### totalAmount

> **totalAmount**: `number`

#### unitPrice

> **unitPrice**: `number`

***

### summary

> **summary**: `object`

Defined in: features/reports/server.ts:69

#### byType

> **byType**: `object`[]

#### totalRevenue

> **totalRevenue**: `number`

#### totalSales

> **totalSales**: `number`
