[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / deleteMortalityRecord

# Function: deleteMortalityRecord()

> **deleteMortalityRecord**(`userId`, `recordId`): `Promise`\<`void`\>

Defined in: features/mortality/server.ts:557

Delete a mortality record and restore the deceased quantity back to the batch

## Parameters

### userId

`string`

ID of the user

### recordId

`string`

ID of the mortality record to delete

## Returns

`Promise`\<`void`\>

## Throws

If record not found, or access denied
