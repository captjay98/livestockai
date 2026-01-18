[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / calculateFCR

# Function: calculateFCR()

> **calculateFCR**(`userId`, `farmId`, `batchId`): `Promise`\<`number` \| `null`\>

Defined in: features/feed/server.ts:511

Calculate the Feed Conversion Ratio (FCR) for a batch based on feed consumed and weight gain

## Parameters

### userId

`string`

ID of the user

### farmId

`string`

ID of the farm

### batchId

`string`

ID of the batch

## Returns

`Promise`\<`number` \| `null`\>

Promise resolving to the FCR (number) or null if data is insufficient
