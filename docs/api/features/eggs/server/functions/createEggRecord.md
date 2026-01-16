[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / createEggRecord

# Function: createEggRecord()

> **createEggRecord**(`userId`, `farmId`, `input`): `Promise`\<`string`\>

Defined in: features/eggs/server.ts:40

Creates a new egg production record.
Validates that the batch is of type 'poultry'.

## Parameters

### userId

`string`

ID of the user performing the action

### farmId

`string`

ID of the farm owning the batch

### input

[`CreateEggRecordInput`](../interfaces/CreateEggRecordInput.md)

Production and wastage metrics

## Returns

`Promise`\<`string`\>

Promise resolving to the new record ID

## Throws

If batch not found or is not a poultry batch
