[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/structures/server](../README.md) / getStructures

# Function: getStructures()

> **getStructures**(`userId`, `farmId`): `Promise`\<`object`[]\>

Defined in: features/structures/server.ts:81

Retrieve all physical structures belonging to a specific farm.

## Parameters

### userId

`string`

ID of the user requesting the data

### farmId

`string`

ID of the farm

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of structures

## Throws

If user does not have access to the farm
