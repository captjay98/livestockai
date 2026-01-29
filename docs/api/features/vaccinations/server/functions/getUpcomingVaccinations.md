[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / getUpcomingVaccinations

# Function: getUpcomingVaccinations()

> **getUpcomingVaccinations**(`userId`, `farmId?`, `daysAhead?`): `Promise`\<`object`[]\>

Defined in: features/vaccinations/server.ts:376

retrieves upcoming vaccinations (due within X days) for active batches.

## Parameters

### userId

`string`

ID of the user

### farmId?

`string`

Optional farm filter

### daysAhead?

`number` = `7`

Number of days to look ahead (default: 7)

## Returns

`Promise`\<`object`[]\>

Promise resolving to list of upcoming vaccinations
