[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / createVaccination

# Function: createVaccination()

> **createVaccination**(`userId`, `farmId`, `input`): `Promise`\<`string`\>

Defined in: features/vaccinations/server.ts:100

Records a new vaccination event for a batch.

## Parameters

### userId

`string`

ID of the user performing the action

### farmId

`string`

ID of the farm owning the batch

### input

[`CreateVaccinationInput`](../interfaces/CreateVaccinationInput.md)

Vaccination details including next due date

## Returns

`Promise`\<`string`\>

Promise resolving to the new vaccination ID
