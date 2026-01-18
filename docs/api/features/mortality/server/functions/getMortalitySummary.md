[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / getMortalitySummary

# Function: getMortalitySummary()

> **getMortalitySummary**(`userId`, `farmId?`): `Promise`\<\{ `criticalAlerts`: `number`; `recordCount`: `number`; `totalAlerts`: `number`; `totalDeaths`: `number`; \}\>

Defined in: features/mortality/server.ts:414

Get a summary of mortality losses across all farms or for a specific farm

## Parameters

### userId

`string`

ID of the user

### farmId?

`string`

Optional farm ID to filter by

## Returns

`Promise`\<\{ `criticalAlerts`: `number`; `recordCount`: `number`; `totalAlerts`: `number`; `totalDeaths`: `number`; \}\>

Promise resolving to a mortality summary object
