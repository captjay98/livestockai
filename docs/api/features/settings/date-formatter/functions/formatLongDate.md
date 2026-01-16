[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/date-formatter](../README.md) / formatLongDate

# Function: formatLongDate()

> **formatLongDate**(`date`, `settings`): `string`

Defined in: features/settings/date-formatter.ts:91

Format a date in a long format with full month name

## Parameters

### date

The date to format

`string` | `Date`

### settings

`Pick`\<`UserSettings`, `"dateFormat"`\>

User settings containing date format configuration

## Returns

`string`

Long formatted date (e.g., "January 15, 2025" or "15 January 2025")
