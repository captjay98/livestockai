[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / MortalityRecord

# Interface: MortalityRecord

Defined in: features/mortality/server.ts:9

Core interface representing a single mortality record

## Properties

### batchId

> **batchId**: `string`

Defined in: features/mortality/server.ts:13

ID of the batch affected

---

### batchSpecies

> **batchSpecies**: `string` \| `null`

Defined in: features/mortality/server.ts:15

Species of the batch (joined)

---

### cause

> **cause**: `string`

Defined in: features/mortality/server.ts:21

Cause of death

---

### date

> **date**: `Date`

Defined in: features/mortality/server.ts:19

Date of the mortality event

---

### id

> **id**: `string`

Defined in: features/mortality/server.ts:11

Unique record ID

---

### notes

> **notes**: `string` \| `null`

Defined in: features/mortality/server.ts:23

Optional notes

---

### quantity

> **quantity**: `number`

Defined in: features/mortality/server.ts:17

Number of animals deceased
