[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / UpdateBatchData

# Interface: UpdateBatchData

Defined in: features/batches/server.ts:85

Data available for updating an existing livestock batch.
All fields are optional to allow partial updates.

## Properties

### batchName?

> `optional` **batchName**: `string` \| `null`

Defined in: features/batches/server.ts:96

Updated custom batch name or reference identifier

***

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/batches/server.ts:106

Updated additional notes or observations

***

### sourceSize?

> `optional` **sourceSize**: `string` \| `null`

Defined in: features/batches/server.ts:98

Updated source size description (e.g., 'day-old')

***

### species?

> `optional` **species**: `string`

Defined in: features/batches/server.ts:87

Updated species or breed name (e.g., 'Broiler', 'Catfish')

***

### status?

> `optional` **status**: `"active"` \| `"depleted"` \| `"sold"`

Defined in: features/batches/server.ts:94

Updated batch status.
'active' - currently growing
'depleted' - all animals died or removed without sale
'sold' - all animals sold

***

### structureId?

> `optional` **structureId**: `string` \| `null`

Defined in: features/batches/server.ts:100

Updated reference to the structure where the batch is housed

***

### target\_weight\_g?

> `optional` **target\_weight\_g**: `number` \| `null`

Defined in: features/batches/server.ts:104

Updated target weight in grams for harvest forecasting

***

### targetHarvestDate?

> `optional` **targetHarvestDate**: `Date` \| `null`

Defined in: features/batches/server.ts:102

Updated target harvest or depletion date
