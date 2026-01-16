[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/dashboard/server](../README.md) / getDashboardStats

# Function: getDashboardStats()

> **getDashboardStats**(`userId`, `farmId?`): `Promise`\<[`DashboardStats`](../interfaces/DashboardStats.md)\>

Defined in: features/dashboard/server.ts:83

Computes comprehensive dashboard statistics for a user or a specific farm.
Aggregates data from inventory, sales, expenses, production, and monitoring.

## Parameters

### userId

`string`

ID of the user requesting the dashboard

### farmId?

`string`

Optional specific farm filter (returns combined stats if omitted)

## Returns

`Promise`\<[`DashboardStats`](../interfaces/DashboardStats.md)\>

Promise resolving to the complete breakdown of dashboard metrics
