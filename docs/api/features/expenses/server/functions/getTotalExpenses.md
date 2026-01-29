[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / getTotalExpenses

# Function: getTotalExpenses()

> **getTotalExpenses**(`userId`, `farmId`, `options?`): `Promise`\<`number`\>

Defined in: features/expenses/server.ts:508

Calculate the total aggregated spend for a specific farm.

## Parameters

### userId

`string`

ID of the requesting user

### farmId

`string`

ID of the farm

### options?

Optional date range for the total

#### endDate?

`Date`

#### startDate?

`Date`

## Returns

`Promise`\<`number`\>

Promise resolving to the total currency amount

## Throws

If user lacks access to the farm
