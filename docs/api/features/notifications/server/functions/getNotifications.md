[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/notifications/server](../README.md) / getNotifications

# Function: getNotifications()

> **getNotifications**(`userId`, `options?`): `Promise`\<[`Notification`](../../types/interfaces/Notification.md)[]\>

Defined in: features/notifications/server.ts:41

Get notifications for a user.

## Parameters

### userId

`string`

The ID of the user.

### options?

Filtering and pagination options.

#### limit?

`number`

Maximum number of notifications to return.

#### unreadOnly?

`boolean`

If true, returns only unread notifications.

## Returns

`Promise`\<[`Notification`](../../types/interfaces/Notification.md)[]\>

A promise resolving to a list of notifications.
