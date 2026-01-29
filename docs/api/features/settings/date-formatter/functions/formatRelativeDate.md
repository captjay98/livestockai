[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/settings/date-formatter](../README.md) / formatRelativeDate

# Function: formatRelativeDate()

> **formatRelativeDate**(`date`, `settings`): `string`

Defined in: features/settings/date-formatter.ts:112

Format a relative date (e.g., "Today", "Yesterday", "3 days ago")

## Parameters

### date

The date to format

`string` | `Date`

### settings

`Pick`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md), `"dateFormat"`\>

User settings containing date format configuration

## Returns

`string`

Relative date string or formatted date if too far in the past
