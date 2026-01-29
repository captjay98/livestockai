[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / getEggRecordsSummary

# Function: getEggRecordsSummary()

> **getEggRecordsSummary**(`userId`, `farmId?`): `Promise`\<\{ `currentInventory`: `number`; `recordCount`: `number`; `totalBroken`: `number`; `totalCollected`: `number`; `totalSold`: `number`; \}\>

Defined in: features/eggs/server.ts:316

Aggregates production totals, breakage, and current cumulative inventory.

## Parameters

### userId

`string`

ID of the requesting user

### farmId?

`string`

Optional farm filter

## Returns

`Promise`\<\{ `currentInventory`: `number`; `recordCount`: `number`; `totalBroken`: `number`; `totalCollected`: `number`; `totalSold`: `number`; \}\>

Summary metrics including total collected and current stock
