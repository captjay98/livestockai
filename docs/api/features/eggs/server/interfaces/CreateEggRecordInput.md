[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / CreateEggRecordInput

# Interface: CreateEggRecordInput

Defined in: features/eggs/server.ts:9

Input for recording egg collection and wastage.

## Properties

### batchId

> **batchId**: `string`

Defined in: features/eggs/server.ts:11

ID of the layer poultry batch

***

### date

> **date**: `Date`

Defined in: features/eggs/server.ts:13

Collection date

***

### quantityBroken

> **quantityBroken**: `number`

Defined in: features/eggs/server.ts:17

Number of eggs broken or discarded during collection

***

### quantityCollected

> **quantityCollected**: `number`

Defined in: features/eggs/server.ts:15

Total quantity of good eggs collected

***

### quantitySold

> **quantitySold**: `number`

Defined in: features/eggs/server.ts:19

Number of eggs from this batch sold specifically on this date
