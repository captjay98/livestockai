[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / getFeedRecords

# Function: getFeedRecords()

> **getFeedRecords**(`userId`, `farmId?`): `Promise`\<`object`[]\>

Defined in: features/feed/server.ts:409

Fetches all feeding records for one or more farms.
Defaults to all farms belonging to the user if no specific farm is provided.

## Parameters

### userId

`string`

ID of the requesting user

### farmId?

`string`

Optional specific farm to filter by

## Returns

`Promise`\<`object`[]\>
