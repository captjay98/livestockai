[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / createExpense

# Function: createExpense()

> **createExpense**(`userId`, `input`): `Promise`\<`string`\>

Defined in: features/expenses/server.ts:57

Record a new expense in a transaction.
If the expense is for livestock feed and includes quantity, the feed inventory is automatically updated.

## Parameters

### userId

`string`

ID of the user creating the expense

### input

[`CreateExpenseInput`](../interfaces/CreateExpenseInput.md)

Expense details and optional feed tracking data

## Returns

`Promise`\<`string`\>

Promise resolving to the new expense ID

## Throws

If user does not have access to the specified farm
