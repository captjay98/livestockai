[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / CreateExpenseInput

# Interface: CreateExpenseInput

Defined in: features/expenses/server.ts:13

Data structure for recording a new financial expense.
Supports linking to specific batches, suppliers, and feed inventory.

## Properties

### amount

> **amount**: `number`

Defined in: features/expenses/server.ts:33

Monetary amount in system currency

***

### batchId?

> `optional` **batchId**: `string` \| `null`

Defined in: features/expenses/server.ts:17

Optional ID of a specific livestock batch for cost attribution

***

### category

> **category**: `"maintenance"` \| `"equipment"` \| `"other"` \| `"feed"` \| `"medicine"` \| `"utilities"` \| `"labor"` \| `"transport"` \| `"livestock"` \| `"livestock_chicken"` \| `"livestock_fish"` \| `"marketing"`

Defined in: features/expenses/server.ts:19

Specific expense classification

***

### date

> **date**: `Date`

Defined in: features/expenses/server.ts:35

Date the expense occurred

***

### description

> **description**: `string`

Defined in: features/expenses/server.ts:37

Brief description or item name

***

### farmId

> **farmId**: `string`

Defined in: features/expenses/server.ts:15

ID of the farm incurred the expense

***

### feedQuantityKg?

> `optional` **feedQuantityKg**: `number`

Defined in: features/expenses/server.ts:45

Feed weight in kilograms for inventory tracking

***

### feedType?

> `optional` **feedType**: `"starter"` \| `"grower"` \| `"finisher"` \| `"layer_mash"` \| `"fish_feed"`

Defined in: features/expenses/server.ts:43

Specific feed category when category is 'feed'

***

### isRecurring?

> `optional` **isRecurring**: `boolean`

Defined in: features/expenses/server.ts:41

Whether this is a recurring monthly/weekly cost

***

### supplierId?

> `optional` **supplierId**: `string` \| `null`

Defined in: features/expenses/server.ts:39

Optional ID of the supplier for sourcing history
