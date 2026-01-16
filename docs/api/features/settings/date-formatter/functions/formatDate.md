[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/date-formatter](../README.md) / formatDate

# Function: formatDate()

> **formatDate**(`date`, `settings`): `string`

Defined in: features/settings/date-formatter.ts:27

Format a date according to user settings

## Parameters

### date

The date to format (Date object or ISO string)

`string` | `Date`

### settings

`Pick`\<`UserSettings`, `"dateFormat"`\>

User settings containing date format configuration

## Returns

`string`

Formatted date string (e.g., "01/15/2025" or "15/01/2025")
