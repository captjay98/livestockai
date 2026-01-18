[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / deleteExpense

# Function: deleteExpense()

> **deleteExpense**(`userId`, `expenseId`): `Promise`\<`void`\>

Defined in: features/expenses/server.ts:158

Permanently remove an expense record.

## Parameters

### userId

`string`

ID of the user requesting deletion

### expenseId

`string`

ID of the expense to delete

## Returns

`Promise`\<`void`\>

## Throws

If expense not found or user lacks permission
