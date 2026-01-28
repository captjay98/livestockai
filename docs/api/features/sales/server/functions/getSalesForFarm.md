[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / getSalesForFarm

# Function: getSalesForFarm()

> **getSalesForFarm**(`userId`, `farmId`, `options?`): `Promise`\<`object`[]\>

Defined in: features/sales/server.ts:470

Get all sales for a specific farm

## Parameters

### userId

`string`

ID of the user requesting sales

### farmId

`string`

ID of the farm

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
const sales = await getSalesForFarm('user_1', 'farm_A', {
    startDate: new Date('2024-01-01'),
})
```
