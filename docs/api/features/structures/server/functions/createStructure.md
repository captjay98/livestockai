[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/structures/server](../README.md) / createStructure

# Function: createStructure()

> **createStructure**(`userId`, `input`): `Promise`\<`string`\>

Defined in: features/structures/server.ts:188

Create a new physical structure for a farm.

## Parameters

### userId

`string`

ID of the user creating the structure

### input

[`CreateStructureInput`](../interfaces/CreateStructureInput.md)

Creation details (farmId, name, type, capacity, etc.)

## Returns

`Promise`\<`string`\>

Promise resolving to the new structure record ID

## Throws

If user does not have access to the specified farm
