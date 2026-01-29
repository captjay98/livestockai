[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / CreateWaterQualityInput

# Interface: CreateWaterQualityInput

Defined in: features/water-quality/server.ts:38

Data structure for creating a new water quality record.

## Properties

### ammoniaMgL

> **ammoniaMgL**: `number`

Defined in: features/water-quality/server.ts:50

Ammonia in mg/L

---

### batchId

> **batchId**: `string`

Defined in: features/water-quality/server.ts:40

ID of the fish batch

---

### date

> **date**: `Date`

Defined in: features/water-quality/server.ts:42

Measurement date

---

### dissolvedOxygenMgL

> **dissolvedOxygenMgL**: `number`

Defined in: features/water-quality/server.ts:48

Dissolved Oxygen in mg/L

---

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/water-quality/server.ts:52

Optional notes

---

### ph

> **ph**: `number`

Defined in: features/water-quality/server.ts:44

pH value

---

### temperatureCelsius

> **temperatureCelsius**: `number`

Defined in: features/water-quality/server.ts:46

Temperature in Celsius
