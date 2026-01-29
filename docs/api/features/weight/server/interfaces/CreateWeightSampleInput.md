[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/weight/server](../README.md) / CreateWeightSampleInput

# Interface: CreateWeightSampleInput

Defined in: features/weight/server.ts:33

Input data required to create a new weight measurement record.

## Properties

### averageWeightKg

> **averageWeightKg**: `number`

Defined in: features/weight/server.ts:41

Average weight of the animals in kilograms

---

### batchId

> **batchId**: `string`

Defined in: features/weight/server.ts:35

ID of the batch being measured

---

### date

> **date**: `Date`

Defined in: features/weight/server.ts:37

Date of the measurement

---

### maxWeightKg?

> `optional` **maxWeightKg**: `number` \| `null`

Defined in: features/weight/server.ts:45

Largest individual weight recorded in the sample

---

### minWeightKg?

> `optional` **minWeightKg**: `number` \| `null`

Defined in: features/weight/server.ts:43

Smallest individual weight recorded in the sample

---

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/weight/server.ts:47

Optional descriptive notes

---

### sampleSize

> **sampleSize**: `number`

Defined in: features/weight/server.ts:39

Number of animals included in the sample
