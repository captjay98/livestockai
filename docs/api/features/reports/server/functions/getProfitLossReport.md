[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/reports/server](../README.md) / getProfitLossReport

# Function: getProfitLossReport()

> **getProfitLossReport**(`farmId`, `dateRange`): `Promise`\<[`ProfitLossReport`](../interfaces/ProfitLossReport.md)\>

Defined in: features/reports/server.ts:114

Generates a Profit and Loss report.
Aggregates all sales and expenses within the specified window.

## Parameters

### farmId

`string` | `undefined`

### dateRange

[`DateRange`](../interfaces/DateRange.md)

## Returns

`Promise`\<[`ProfitLossReport`](../interfaces/ProfitLossReport.md)\>
