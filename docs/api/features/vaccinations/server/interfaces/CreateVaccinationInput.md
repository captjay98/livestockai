[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / CreateVaccinationInput

# Interface: CreateVaccinationInput

Defined in: features/vaccinations/server.ts:35

Input for recording a preventative vaccination event.

## Properties

### batchId

> **batchId**: `string`

Defined in: features/vaccinations/server.ts:37

ID of the target batch

---

### dateAdministered

> **dateAdministered**: `Date`

Defined in: features/vaccinations/server.ts:41

Date of administration

---

### dosage

> **dosage**: `string`

Defined in: features/vaccinations/server.ts:43

Dose amount administered

---

### nextDueDate?

> `optional` **nextDueDate**: `Date` \| `null`

Defined in: features/vaccinations/server.ts:45

Optional next scheduled dose

---

### notes?

> `optional` **notes**: `string` \| `null`

Defined in: features/vaccinations/server.ts:47

Optional administration notes

---

### vaccineName

> **vaccineName**: `string`

Defined in: features/vaccinations/server.ts:39

Name of the vaccine used
