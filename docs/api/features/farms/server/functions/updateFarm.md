[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/farms/server](../README.md) / updateFarm

# Function: updateFarm()

> **updateFarm**(`farmId`, `userId`, `data`): `Promise`\<\{ `contactPhone`: `string` \| `null`; `createdAt`: `Date`; `id`: `string`; `location`: `string`; `name`: `string`; `notes`: `string` \| `null`; `type`: `"poultry"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"` \| `"aquaculture"` \| `"mixed"` \| `"multi"`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: features/farms/server.ts:186

Update a farm

## Parameters

### farmId

`string`

### userId

`string`

### data

[`UpdateFarmData`](../interfaces/UpdateFarmData.md)

## Returns

`Promise`\<\{ `contactPhone`: `string` \| `null`; `createdAt`: `Date`; `id`: `string`; `location`: `string`; `name`: `string`; `notes`: `string` \| `null`; `type`: `"poultry"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"` \| `"aquaculture"` \| `"mixed"` \| `"multi"`; `updatedAt`: `Date`; \} \| `undefined`\>
