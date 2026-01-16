[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/batches/server](../README.md) / getBatches

# Function: getBatches()

> **getBatches**(`userId`, `farmId?`, `filters?`): `Promise`\<`object`[]\>

Defined in: features/batches/server.ts:204

Get batches for a user, optionally filtered by farm and other criteria

## Parameters

### userId

`string`

ID of the user requesting batches

### farmId?

`string`

Optional farm ID to filter by

### filters?

Optional filters for status, livestock type, and species

#### livestockType?

`"poultry"` \| `"fish"`

#### species?

`string`

#### status?

`"active"` \| `"depleted"` \| `"sold"`

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of batches with farm names

## Throws

If the user lacks access to the requested farm

## Example

```typescript
const batches = await getBatches('user_1', 'farm_A', { status: 'active' })
```
