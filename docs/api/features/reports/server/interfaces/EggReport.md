[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/reports/server](../README.md) / EggReport

# Interface: EggReport

Defined in: features/reports/server.ts:114

Report on egg production and inventory.

## Properties

### period

> **period**: [`DateRange`](DateRange.md)

Defined in: features/reports/server.ts:116

The report window

---

### records

> **records**: `object`[]

Defined in: features/reports/server.ts:118

Daily egg records

#### broken

> **broken**: `number`

#### collected

> **collected**: `number`

#### date

> **date**: `Date`

#### inventory

> **inventory**: `number`

#### sold

> **sold**: `number`

---

### summary

> **summary**: `object`

Defined in: features/reports/server.ts:126

Production summary

#### averageLayingPercentage

> **averageLayingPercentage**: `number`

#### currentInventory

> **currentInventory**: `number`

#### totalBroken

> **totalBroken**: `number`

#### totalCollected

> **totalCollected**: `number`

#### totalSold

> **totalSold**: `number`
