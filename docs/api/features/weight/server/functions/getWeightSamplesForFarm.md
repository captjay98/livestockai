[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/weight/server](../README.md) / getWeightSamplesForFarm

# Function: getWeightSamplesForFarm()

> **getWeightSamplesForFarm**(`userId`, `farmId?`): `Promise`\<`object`[]\>

Defined in: features/weight/server.ts:165

Retrieve all weight samples across a farm or for all farms assigned to a user.

## Parameters

### userId

`string`

ID of the user

### farmId?

`string`

Optional ID of a specific farm to filter by

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of weight records with batch and farm details
