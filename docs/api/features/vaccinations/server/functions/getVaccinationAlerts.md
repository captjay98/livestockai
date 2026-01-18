[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / getVaccinationAlerts

# Function: getVaccinationAlerts()

> **getVaccinationAlerts**(`userId`, `farmId?`): `Promise`\<\{ `overdue`: `object`[]; `totalAlerts`: `number`; `upcoming`: `object`[]; \}\>

Defined in: features/vaccinations/server.ts:469

Gets a summary of vaccination alerts (upcoming and overdue).

## Parameters

### userId

`string`

ID of the user

### farmId?

`string`

Optional farm filter

## Returns

`Promise`\<\{ `overdue`: `object`[]; `totalAlerts`: `number`; `upcoming`: `object`[]; \}\>

Promise with upcoming, overdue, and total alert count
