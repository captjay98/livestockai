[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / updateFeedRecord

# Function: updateFeedRecord()

> **updateFeedRecord**(`userId`, `farmId`, `recordId`, `data`): `Promise`\<`void`\>

Defined in: features/feed/server.ts:259

Update an existing feeding record and adjust inventory accordingly

## Parameters

### userId

`string`

ID of the user performing the update

### farmId

`string`

ID of the farm

### recordId

`string`

ID of the record to update

### data

`Partial`\<[`CreateFeedRecordInput`](../interfaces/CreateFeedRecordInput.md)\>

Partial feed record data

## Returns

`Promise`\<`void`\>

## Throws

If record not found, or insufficient inventory for new selection
