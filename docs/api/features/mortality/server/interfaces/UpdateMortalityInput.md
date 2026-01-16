[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / UpdateMortalityInput

# Interface: UpdateMortalityInput

Defined in: features/mortality/server.ts:453

Data available for updating an existing mortality record.

## Properties

### cause?

> `optional` **cause**: `"other"` \| `"disease"` \| `"predator"` \| `"weather"` \| `"unknown"` \| `"starvation"` \| `"injury"` \| `"poisoning"` \| `"suffocation"` \| `"culling"`

Defined in: features/mortality/server.ts:459

Updated cause of death

***

### date?

> `optional` **date**: `Date`

Defined in: features/mortality/server.ts:457

Updated date of occurrence

***

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/mortality/server.ts:471

Updated optional notes

***

### quantity?

> `optional` **quantity**: `number`

Defined in: features/mortality/server.ts:455

Updated number of animals lost
