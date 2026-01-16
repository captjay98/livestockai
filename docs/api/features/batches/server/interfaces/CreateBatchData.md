[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / CreateBatchData

# Interface: CreateBatchData

Defined in: features/batches/server.ts:52

Data required to create a new livestock batch

## Properties

### acquisitionDate

> **acquisitionDate**: `Date`

Defined in: features/batches/server.ts:62

Date when the batch was acquired or started

***

### batchName?

> `optional` **batchName**: `string` \| `null`

Defined in: features/batches/server.ts:66

Optional custom name for the batch

***

### costPerUnit

> **costPerUnit**: `number`

Defined in: features/batches/server.ts:64

Cost per unit/animal in the system's currency

***

### farmId

> **farmId**: `string`

Defined in: features/batches/server.ts:54

The ID of the farm where the batch will be located

***

### initialQuantity

> **initialQuantity**: `number`

Defined in: features/batches/server.ts:60

Initial number of units in the batch

***

### livestockType

> **livestockType**: [`LivestockType`](../../../modules/types/type-aliases/LivestockType.md)

Defined in: features/batches/server.ts:56

The type of livestock (poultry, fish, etc.)

***

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/batches/server.ts:78

Optional additional notes

***

### sourceSize?

> `optional` **sourceSize**: `string` \| `null`

Defined in: features/batches/server.ts:68

Optional starting size/age description

***

### species

> **species**: `string`

Defined in: features/batches/server.ts:58

The specific species or breed (e.g., 'Broiler', 'Catfish')

***

### structureId?

> `optional` **structureId**: `string` \| `null`

Defined in: features/batches/server.ts:70

Optional reference to the structure where the batch is housed

***

### supplierId?

> `optional` **supplierId**: `string` \| `null`

Defined in: features/batches/server.ts:76

Optional ID of the supplier

***

### target\_weight\_g?

> `optional` **target\_weight\_g**: `number` \| `null`

Defined in: features/batches/server.ts:74

Optional target weight in grams for harvest

***

### targetHarvestDate?

> `optional` **targetHarvestDate**: `Date` \| `null`

Defined in: features/batches/server.ts:72

Optional expected harvest or depletion date
