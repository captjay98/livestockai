[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/farms/server](../README.md) / getFarmById

# Function: getFarmById()

> **getFarmById**(`farmId`, `userId`): `Promise`\<\{ `contactPhone`: `string` \| `null`; `createdAt`: `Date`; `id`: `string`; `location`: `string`; `name`: `string`; `notes`: `string` \| `null`; `type`: `"poultry"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"` \| `"aquaculture"` \| `"mixed"` \| `"multi"`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: features/farms/server.ts:152

Retrieve a single farm by its ID, with a security check to ensure the user has access.

## Parameters

### farmId

`string`

ID of the farm to retrieve

### userId

`string`

ID of the user requesting the farm

## Returns

`Promise`\<\{ `contactPhone`: `string` \| `null`; `createdAt`: `Date`; `id`: `string`; `location`: `string`; `name`: `string`; `notes`: `string` \| `null`; `type`: `"poultry"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"` \| `"aquaculture"` \| `"mixed"` \| `"multi"`; `updatedAt`: `Date`; \} \| `undefined`\>

Promise resolving to the farm object or undefined if not found/denied

## Throws

If user does not have access to the farm
