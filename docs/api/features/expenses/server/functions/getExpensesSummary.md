[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / getExpensesSummary

# Function: getExpensesSummary()

> **getExpensesSummary**(`userId`, `farmId?`, `options?`): `Promise`\<\{ `byCategory`: `Record`\<`string`, \{ `amount`: `number`; `count`: `number`; \}\>; `total`: \{ `amount`: `number`; `count`: `number`; \}; \}\>

Defined in: features/expenses/server.ts:434

Calculate categorized totals for expenses within a specific time period.
Useful for building financial reports and dashboard charts.

## Parameters

### userId

`string`

ID of the requesting user

### farmId?

`string`

Optional farm filter

### options?

Start and end date for the summary

#### endDate?

`Date`

#### startDate?

`Date`

## Returns

`Promise`\<\{ `byCategory`: `Record`\<`string`, \{ `amount`: `number`; `count`: `number`; \}\>; `total`: \{ `amount`: `number`; `count`: `number`; \}; \}\>

Promise resolving to an object containing categorized totals and overall sum
