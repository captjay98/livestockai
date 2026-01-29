[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/farms/server](../README.md) / getFarmByIdFn

# Variable: getFarmByIdFn

> `const` **getFarmByIdFn**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `contactPhone`: `string` \| `null`; `createdAt`: `Date`; `id`: `string`; `location`: `string`; `name`: `string`; `notes`: `string` \| `null`; `type`: `"poultry"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"` \| `"aquaculture"` \| `"mixed"` \| `"multi"`; `updatedAt`: `Date`; \} \| `undefined`\>\>

Defined in: features/farms/server.ts:175

Server function to retrieve a specific farm by ID for the current user.

## Param

Object containing the farmId

## Returns

Promise resolving to the farm object
