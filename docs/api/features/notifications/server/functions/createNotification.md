[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/notifications/server](../README.md) / createNotification

# Function: createNotification()

> **createNotification**(`data`): `Promise`\<`string`\>

Defined in: features/notifications/server.ts:10

Persistence layer for system notifications.

## Parameters

### data

[`CreateNotificationData`](../../types/interfaces/CreateNotificationData.md)

Target user and content of the notification

## Returns

`Promise`\<`string`\>

Promise resolving to the unique notification ID
