[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/logging/audit](../README.md) / logAudit

# Function: logAudit()

> **logAudit**(`params`): `Promise`\<`void`\>

Defined in: features/logging/audit.ts:36

Records an entry in the system audit trail.
Gracefully handles failures to ensure logging never blocks primary business logic.

## Parameters

### params

[`AuditLogParams`](../interfaces/AuditLogParams.md)

User info, action type, and entity metadata

## Returns

`Promise`\<`void`\>
