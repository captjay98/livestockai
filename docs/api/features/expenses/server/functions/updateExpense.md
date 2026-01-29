[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / updateExpense

# Function: updateExpense()

> **updateExpense**(`userId`, `expenseId`, `data`): `Promise`\<`boolean`\>

Defined in: features/expenses/server.ts:231

Update an existing expense record.

## Parameters

### userId

`string`

ID of the user performing the update

### expenseId

`string`

ID of the expense to update

### data

[`UpdateExpenseInput`](../interfaces/UpdateExpenseInput.md)

Partial update parameters

## Returns

`Promise`\<`boolean`\>

Promise resolving to true on successful update

## Throws

If expense not found or user unauthorized
