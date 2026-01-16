[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/logging/audit](../README.md) / getAuditLogs

# Function: getAuditLogs()

> **getAuditLogs**(`_userId`, `query`): `Promise`\<[`AuditLogResult`](../interfaces/AuditLogResult.md)\>

Defined in: features/logging/audit.ts:110

Retrieves a paginated list of audit logs.
Restricted to administrative access via server function wrapper.

## Parameters

### \_userId

`string`

ID of the requesting user (for permission check)

### query

[`AuditLogQuery`](../interfaces/AuditLogQuery.md) = `{}`

Filtering and pagination parameters

## Returns

`Promise`\<[`AuditLogResult`](../interfaces/AuditLogResult.md)\>
