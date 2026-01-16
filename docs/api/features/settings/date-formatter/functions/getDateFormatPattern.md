[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/date-formatter](../README.md) / getDateFormatPattern

# Function: getDateFormatPattern()

> **getDateFormatPattern**(`settings`): `string`

Defined in: features/settings/date-formatter.ts:138

Get the date-fns format pattern representing the user's preferred date format.

## Parameters

### settings

`Pick`\<`UserSettings`, `"dateFormat"`\>

User settings containing date format

## Returns

`string`

String pattern (e.g., "MM/dd/yyyy")
