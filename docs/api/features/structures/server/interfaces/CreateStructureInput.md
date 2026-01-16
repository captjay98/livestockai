[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/structures/server](../README.md) / CreateStructureInput

# Interface: CreateStructureInput

Defined in: features/structures/server.ts:38

Data required to create a new physical structure on a farm.

## Properties

### areaSqm?

> `optional` **areaSqm**: `number` \| `null`

Defined in: features/structures/server.ts:48

Floor or surface area in square meters

***

### capacity?

> `optional` **capacity**: `number` \| `null`

Defined in: features/structures/server.ts:46

Maximum number of animals the structure can hold

***

### farmId

> **farmId**: `string`

Defined in: features/structures/server.ts:40

ID of the farm owning the structure

***

### name

> **name**: `string`

Defined in: features/structures/server.ts:42

Unique name or number of the structure on the farm

***

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/structures/server.ts:52

Optional notes about the construction or features

***

### status

> **status**: [`StructureStatus`](../type-aliases/StructureStatus.md)

Defined in: features/structures/server.ts:50

Initial operational status

***

### type

> **type**: [`StructureType`](../type-aliases/StructureType.md)

Defined in: features/structures/server.ts:44

Type of housing (e.g., pond, pen)
