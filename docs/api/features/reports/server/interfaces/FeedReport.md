[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/reports/server](../README.md) / FeedReport

# Interface: FeedReport

Defined in: features/reports/server.ts:91

Report on feed consumption and costs.

## Properties

### period

> **period**: [`DateRange`](DateRange.md)

Defined in: features/reports/server.ts:93

The report window

---

### records

> **records**: `object`[]

Defined in: features/reports/server.ts:95

Feed consumption records

#### batchId

> **batchId**: `string`

#### feedType

> **feedType**: `string`

#### species

> **species**: `string`

#### totalCost

> **totalCost**: `number`

#### totalQuantityKg

> **totalQuantityKg**: `number`

---

### summary

> **summary**: `object`

Defined in: features/reports/server.ts:103

Feed summary

#### byFeedType

> **byFeedType**: `object`[]

Consumption aggregated by feed type

#### totalCost

> **totalCost**: `number`

#### totalFeedKg

> **totalFeedKg**: `number`
