[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / getExpenses

# Function: getExpenses()

> **getExpenses**(`userId`, `farmId?`, `options?`): `Promise`\<`object`[]\>

Defined in: features/expenses/server.ts:306

Retrieve a list of expenses for a user.
Supports filtering by a single farm or retrieving all expenses across all accessible farms.

## Parameters

### userId

`string`

ID of the user requesting data

### farmId?

`string`

Optional farm filter (returns allaccessible if omitted)

### options?

Additional filters (date range, category)

#### category?

`string`

#### endDate?

`Date`

#### startDate?

`Date`

## Returns

`Promise`\<`object`[]\>

Promise resolving to an array of expense records with joined entity names

## Throws

If user does not have access to the specified farm
