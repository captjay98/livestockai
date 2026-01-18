[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/date-formatter](../README.md) / formatTime

# Function: formatTime()

> **formatTime**(`date`, `settings`): `string`

Defined in: features/settings/date-formatter.ts:42

Format a time according to user settings

## Parameters

### date

The date/time to format (Date object or ISO string)

`string` | `Date`

### settings

`Pick`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md), `"timeFormat"`\>

User settings containing time format configuration

## Returns

`string`

Formatted time string (e.g., "2:30 PM" or "14:30")
