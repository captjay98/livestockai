[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/weight/server](../README.md) / WeightRecord

# Interface: WeightRecord

Defined in: features/weight/server.ts:9

Represents a historical weight measurement record for a livestock batch.

## Properties

### averageWeightKg

> **averageWeightKg**: `string`

Defined in: features/weight/server.ts:21

Calculated average weight in kilograms

---

### batchId

> **batchId**: `string`

Defined in: features/weight/server.ts:13

ID of the associated livestock batch

---

### batchSpecies

> **batchSpecies**: `string` \| `null`

Defined in: features/weight/server.ts:15

Optional species name for the batch

---

### date

> **date**: `Date`

Defined in: features/weight/server.ts:17

Date the weight sample was taken

---

### id

> **id**: `string`

Defined in: features/weight/server.ts:11

Unique identifier for the weight record

---

### maxWeightKg

> **maxWeightKg**: `string` \| `null`

Defined in: features/weight/server.ts:25

Maximum weight measured in the sample (optional)

---

### minWeightKg

> **minWeightKg**: `string` \| `null`

Defined in: features/weight/server.ts:23

Minimum weight measured in the sample (optional)

---

### notes

> **notes**: `string` \| `null`

Defined in: features/weight/server.ts:27

Optional notes or observations about the sample

---

### sampleSize

> **sampleSize**: `number`

Defined in: features/weight/server.ts:19

Number of animals measured in this sample
