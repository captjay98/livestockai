[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / getSales

# Function: getSales()

> **getSales**(`userId`, `farmId?`, `options?`): `Promise`\<`object`[]\>

Defined in: features/sales/server.ts:396

Get sales for a user, optionally filtered by farm and other criteria

## Parameters

### userId

`string`

ID of the user requesting sales

### farmId?

`string`

Optional farm ID to filter by

### options?

Optional filters for date range and livestock type

#### endDate?

`Date`

#### livestockType?

`"poultry"` \| `"fish"` \| `"eggs"`

#### startDate?

`Date`

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of sales records

## Throws

If user lacks access to the farm

## Example

```typescript
const sales = await getSales('user_1', 'farm_A', { livestockType: 'poultry' })
```
