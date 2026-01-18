[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / createTreatment

# Function: createTreatment()

> **createTreatment**(`userId`, `farmId`, `input`): `Promise`\<`string`\>

Defined in: features/vaccinations/server.ts:158

Records a medical treatment for a batch.

## Parameters

### userId

`string`

ID of the user performing the action

### farmId

`string`

ID of the farm owning the batch

### input

[`CreateTreatmentInput`](../interfaces/CreateTreatmentInput.md)

Treatment details including withdrawal period

## Returns

`Promise`\<`string`\>

Promise resolving to the new treatment ID
