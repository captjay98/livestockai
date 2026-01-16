[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / CreateFeedRecordInput

# Interface: CreateFeedRecordInput

Defined in: features/feed/server.ts:28

Data required to create a new feed consumption record.

## Properties

### bagSizeKg?

> `optional` **bagSizeKg**: `number` \| `null`

Defined in: features/feed/server.ts:46

Optional individual bag size in kilograms

***

### batchId

> **batchId**: `string`

Defined in: features/feed/server.ts:30

ID of the livestock batch being fed

***

### brandName?

> `optional` **brandName**: `string` \| `null`

Defined in: features/feed/server.ts:44

Optional name of the feed brand

***

### cost

> **cost**: `number`

Defined in: features/feed/server.ts:36

Total cost of the feed consumed in the system currency

***

### date

> **date**: `Date`

Defined in: features/feed/server.ts:38

Date of the feeding event

***

### feedType

> **feedType**: `"starter"` \| `"grower"` \| `"finisher"` \| `"layer_mash"` \| `"fish_feed"`

Defined in: features/feed/server.ts:32

The specific category of feed used

***

### inventoryId?

> `optional` **inventoryId**: `string` \| `null`

Defined in: features/feed/server.ts:42

Optional ID of the feed inventory item to deduct from

***

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/feed/server.ts:50

Optional additional notes or observations

***

### numberOfBags?

> `optional` **numberOfBags**: `number` \| `null`

Defined in: features/feed/server.ts:48

Optional number of bags consumed

***

### quantityKg

> **quantityKg**: `number`

Defined in: features/feed/server.ts:34

Total weight of feed consumed in kilograms

***

### supplierId?

> `optional` **supplierId**: `string` \| `null`

Defined in: features/feed/server.ts:40

Optional ID of the supplier of the feed
