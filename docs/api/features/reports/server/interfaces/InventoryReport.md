[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/reports/server](../README.md) / InventoryReport

# Interface: InventoryReport

Defined in: features/reports/server.ts:42

Report detailing livestock quantities and mortality.

## Properties

### batches

> **batches**: `object`[]

Defined in: features/reports/server.ts:44

List of individual batch statuses

#### currentQuantity

> **currentQuantity**: `number`

#### id

> **id**: `string`

#### initialQuantity

> **initialQuantity**: `number`

#### livestockType

> **livestockType**: `string`

#### mortalityCount

> **mortalityCount**: `number`

#### mortalityRate

> **mortalityRate**: `number`

#### species

> **species**: `string`

#### status

> **status**: `string`

---

### summary

> **summary**: `object`

Defined in: features/reports/server.ts:55

Farm-wide totals

#### overallMortalityRate

> **overallMortalityRate**: `number`

#### totalFish

> **totalFish**: `number`

#### totalMortality

> **totalMortality**: `number`

#### totalPoultry

> **totalPoultry**: `number`
