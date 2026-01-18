[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/monitoring/alerts](../README.md) / getAllBatchAlerts

# Function: getAllBatchAlerts()

> **getAllBatchAlerts**(`userId`, `farmId?`): `Promise`\<[`BatchAlert`](../interfaces/BatchAlert.md)[]\>

Defined in: features/monitoring/alerts.ts:46

Get all health alerts for a user (optionally filtered by farm)
Optimized to minimize DB queries

## Parameters

### userId

`string`

### farmId?

`string`

## Returns

`Promise`\<[`BatchAlert`](../interfaces/BatchAlert.md)[]\>
