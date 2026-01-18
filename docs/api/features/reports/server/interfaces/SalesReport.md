[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/reports/server](../README.md) / SalesReport

# Interface: SalesReport

Defined in: features/reports/server.ts:66

Detailed record of sales over a period.

## Properties

### period

> **period**: [`DateRange`](DateRange.md)

Defined in: features/reports/server.ts:68

The report window

---

### sales

> **sales**: `object`[]

Defined in: features/reports/server.ts:70

Individual sales transactions

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

---

### summary

> **summary**: `object`

Defined in: features/reports/server.ts:80

Sales summary

#### byType

> **byType**: `object`[]

Revenue aggregated by livestock type

#### totalRevenue

> **totalRevenue**: `number`

#### totalSales

> **totalSales**: `number`
