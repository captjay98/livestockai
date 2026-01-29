[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/weight/server](../README.md) / deleteWeightSample

# Function: deleteWeightSample()

> **deleteWeightSample**(`userId`, `recordId`): `Promise`\<`void`\>

Defined in: features/weight/server.ts:520

Permanently delete a weight measurement record.

## Parameters

### userId

`string`

ID of the user

### recordId

`string`

ID of the record to delete

## Returns

`Promise`\<`void`\>

## Throws

If record not found or access denied
