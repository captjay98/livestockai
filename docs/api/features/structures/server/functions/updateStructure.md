[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/structures/server](../README.md) / updateStructure

# Function: updateStructure()

> **updateStructure**(`userId`, `id`, `input`): `Promise`\<`boolean`\>

Defined in: features/structures/server.ts:233

Update an existing structure's configuration or status.

## Parameters

### userId

`string`

ID of the user performing the update

### id

`string`

ID of the structure to update

### input

[`UpdateStructureInput`](../interfaces/UpdateStructureInput.md)

Partial update parameters

## Returns

`Promise`\<`boolean`\>

Promise resolving to true on success
