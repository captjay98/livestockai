[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/date-formatter](../README.md) / formatShortDate

# Function: formatShortDate()

> **formatShortDate**(`date`, `settings`): `string`

Defined in: features/settings/date-formatter.ts:71

Format a date in a short format (month and day only)

## Parameters

### date

The date to format

`string` | `Date`

### settings

`Pick`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md), `"dateFormat"`\>

User settings containing date format configuration

## Returns

`string`

Short formatted date (e.g., "Jan 15" or "15 Jan")
