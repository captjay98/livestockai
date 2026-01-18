[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / getTotalRevenue

# Function: getTotalRevenue()

> **getTotalRevenue**(`userId`, `farmId`, `options?`): `Promise`\<`number`\>

Defined in: features/sales/server.ts:619

Calculate total revenue for a farm within a given period

## Parameters

### userId

`string`

ID of the user requesting the calculation

### farmId

`string`

ID of the farm

### options?

Optional date range filters

#### endDate?

`Date`

#### startDate?

`Date`

## Returns

`Promise`\<`number`\>

Promise resolving to the total revenue amount

## Example

```typescript
const revenue = await getTotalRevenue('user_1', 'farm_A', {
  startDate: weekStart,
})
```
