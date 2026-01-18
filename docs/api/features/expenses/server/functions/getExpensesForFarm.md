[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / getExpensesForFarm

# Function: getExpensesForFarm()

> **getExpensesForFarm**(`userId`, `farmId`, `options?`): `Promise`\<`object`[]\>

Defined in: features/expenses/server.ts:372

Retrieve a limited list of expenses for a specific farm.

## Parameters

### userId

`string`

ID of the user requesting data

### farmId

`string`

ID of the target farm

### options?

Pagination and filtering options (limit, category, dates)

#### category?

`string`

#### endDate?

`Date`

#### limit?

`number`

#### startDate?

`Date`

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of expenses

## Throws

If user lacks access to the farm
