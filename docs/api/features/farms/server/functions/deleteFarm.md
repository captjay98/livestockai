[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/farms/server](../README.md) / deleteFarm

# Function: deleteFarm()

> **deleteFarm**(`farmId`): `Promise`\<`void`\>

Defined in: features/farms/server.ts:259

Permanently delete a farm and its associated user mappings.
Fails if the farm still has active batches, sales, or expenses.

## Parameters

### farmId

`string`

ID of the farm to delete

## Returns

`Promise`\<`void`\>

## Throws

If the farm has dependent records
