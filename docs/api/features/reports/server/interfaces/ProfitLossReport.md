[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/reports/server](../README.md) / ProfitLossReport

# Interface: ProfitLossReport

Defined in: features/reports/server.ts:16

Multi-dimensional financial overview for the farm.

## Properties

### expenses

> **expenses**: `object`

Defined in: features/reports/server.ts:27

Expense breakdown

#### byCategory

> **byCategory**: `object`[]

Costs categorized by ledger item

#### total

> **total**: `number`

Combined operational cost

***

### period

> **period**: [`DateRange`](DateRange.md)

Defined in: features/reports/server.ts:18

The report window

***

### profit

> **profit**: `number`

Defined in: features/reports/server.ts:34

Net profit (Revenue - Expenses)

***

### profitMargin

> **profitMargin**: `number`

Defined in: features/reports/server.ts:36

Profit as a percentage of revenue

***

### revenue

> **revenue**: `object`

Defined in: features/reports/server.ts:20

Revenue breakdown

#### byType

> **byType**: `object`[]

Revenue categorized by product or livestock type

#### total

> **total**: `number`

Combined revenue
