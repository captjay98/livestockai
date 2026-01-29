[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / getOverdueVaccinations

# Function: getOverdueVaccinations()

> **getOverdueVaccinations**(`userId`, `farmId?`): `Promise`\<`object`[]\>

Defined in: features/vaccinations/server.ts:426

Retrieves overdue vaccination events.

## Parameters

### userId

`string`

ID of the user

### farmId?

`string`

Optional farm filter

## Returns

`Promise`\<`object`[]\>

Promise resolving to list of overdue vaccinations
