[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/settings/date-formatter](../README.md) / formatDateTime

# Function: formatDateTime()

> **formatDateTime**(`date`, `settings`): `string`

Defined in: features/settings/date-formatter.ts:57

Format a date and time according to user settings

## Parameters

### date

The date/time to format (Date object or ISO string)

`string` | `Date`

### settings

`Pick`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md), `"dateFormat"` \| `"timeFormat"`\>

User settings containing date and time format configuration

## Returns

`string`

Formatted date and time string (e.g., "01/15/2025 2:30 PM")
