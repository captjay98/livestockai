[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/farms/server](../README.md) / createFarm

# Function: createFarm()

> **createFarm**(`data`, `creatorUserId?`): `Promise`\<`string`\>

Defined in: features/farms/server.ts:56

Create a new farm and assign the creator as the owner.
Automatically initializes default modules for the farm.

## Parameters

### data

[`CreateFarmData`](../interfaces/CreateFarmData.md)

Farm details (name, location, type)

### creatorUserId?

`string`

ID of the user creating the farm (optional)

## Returns

`Promise`\<`string`\>

Promise resolving to the new farm's ID
