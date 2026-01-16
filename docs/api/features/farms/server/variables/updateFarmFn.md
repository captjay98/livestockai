[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/farms/server](../README.md) / updateFarmFn

# Variable: updateFarmFn

> `const` **updateFarmFn**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `contactPhone`: `string` \| `null`; `createdAt`: `Date`; `id`: `string`; `location`: `string`; `name`: `string`; `notes`: `string` \| `null`; `type`: `"poultry"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"` \| `"aquaculture"` \| `"mixed"` \| `"multi"`; `updatedAt`: `Date`; \} \| `undefined`\>\>

Defined in: features/farms/server.ts:233

Server function to update a farm's details.

## Param

Farm ID and updated details

## Returns

Promise resolving to the updated farm object
