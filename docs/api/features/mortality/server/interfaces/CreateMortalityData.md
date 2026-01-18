[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / CreateMortalityData

# Interface: CreateMortalityData

Defined in: features/mortality/server.ts:29

Data required to record a new mortality event

## Properties

### batchId

> **batchId**: `string`

Defined in: features/mortality/server.ts:31

ID of the affected livestock batch

---

### cause

> **cause**: `"other"` \| `"disease"` \| `"predator"` \| `"weather"` \| `"unknown"`

Defined in: features/mortality/server.ts:37

Categorized cause of death

---

### date

> **date**: `Date`

Defined in: features/mortality/server.ts:35

Date of occurrence

---

### notes?

> `optional` **notes**: `string`

Defined in: features/mortality/server.ts:39

Optional descriptive notes

---

### quantity

> **quantity**: `number`

Defined in: features/mortality/server.ts:33

Number of heads lost
