[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/hooks](../README.md) / useFormatDate

# Function: useFormatDate()

> **useFormatDate**(): `object`

Defined in: features/settings/hooks.ts:77

Hook for date formatting

Returns functions to format dates according to user settings.

## Returns

`object`

### format()

> **format**: (`date`) => `string`

#### Parameters

##### date

`string` | `Date`

#### Returns

`string`

### formatLong()

> **formatLong**: (`date`) => `string`

#### Parameters

##### date

`string` | `Date`

#### Returns

`string`

### formatRelative()

> **formatRelative**: (`date`) => `string`

#### Parameters

##### date

`string` | `Date`

#### Returns

`string`

### formatShort()

> **formatShort**: (`date`) => `string`

#### Parameters

##### date

`string` | `Date`

#### Returns

`string`

### pattern

> **pattern**: `"MM/DD/YYYY"` \| `"DD/MM/YYYY"` \| `"YYYY-MM-DD"` = `settings.dateFormat`
