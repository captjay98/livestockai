[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / CreateTreatmentInput

# Interface: CreateTreatmentInput

Defined in: features/vaccinations/server.ts:53

Input for recording a curative medical treatment.

## Properties

### batchId

> **batchId**: `string`

Defined in: features/vaccinations/server.ts:55

ID of the target batch

---

### date

> **date**: `Date`

Defined in: features/vaccinations/server.ts:61

Start date of treatment

---

### dosage

> **dosage**: `string`

Defined in: features/vaccinations/server.ts:63

Dose amount administered

---

### medicationName

> **medicationName**: `string`

Defined in: features/vaccinations/server.ts:57

Name of the medication used

---

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/vaccinations/server.ts:67

Optional treatment details

---

### reason

> **reason**: `string`

Defined in: features/vaccinations/server.ts:59

Symptom or diagnosis necessitating treatment

---

### withdrawalDays

> **withdrawalDays**: `number`

Defined in: features/vaccinations/server.ts:65

Wait period required after final dose
