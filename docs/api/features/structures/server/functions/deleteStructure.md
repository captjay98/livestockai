[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/structures/server](../README.md) / deleteStructure

# Function: deleteStructure()

> **deleteStructure**(`userId`, `id`): `Promise`\<`boolean`\>

Defined in: features/structures/server.ts:292

Permanently delete a structure record from a farm.
Operation fails if the structure has any active livestock batches assigned to it.

## Parameters

### userId

`string`

ID of the user requesting deletion

### id

`string`

ID of the structure to delete

## Returns

`Promise`\<`boolean`\>

Promise resolving to true on successful deletion

## Throws

If structure is not found, user is unauthorized, or structure has active batches
