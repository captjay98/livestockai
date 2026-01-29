[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / getEggRecords

# Function: getEggRecords()

> **getEggRecords**(`userId`, `farmId?`, `options?`): `Promise`\<`object`[]\>

Defined in: features/eggs/server.ts:204

Retrieves egg records for a user, optionally filtered by farm ID and date range.
Supports cross-farm data aggregation.

## Parameters

### userId

`string`

ID of the requesting user

### farmId?

`string`

Optional farm filter

### options?

Start and end date filters

#### endDate?

`Date`

#### startDate?

`Date`

## Returns

`Promise`\<`object`[]\>

Array of production records with batch and farm details
