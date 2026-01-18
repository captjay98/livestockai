[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/hooks](../README.md) / useFormatCurrency

# Function: useFormatCurrency()

> **useFormatCurrency**(): `object`

Defined in: features/settings/hooks.ts:45

Hook for currency formatting

Returns functions to format and parse currency values
according to user settings.

## Returns

`object`

### code

> **code**: `string` = `settings.currencyCode`

### format()

> **format**: (`amount`) => `string`

#### Parameters

##### amount

[`MoneyInput`](../../currency/type-aliases/MoneyInput.md)

#### Returns

`string`

### formatCompact()

> **formatCompact**: (`amount`) => `string`

#### Parameters

##### amount

[`MoneyInput`](../../currency/type-aliases/MoneyInput.md)

#### Returns

`string`

### parse()

> **parse**: (`formatted`) => `number` \| `null`

#### Parameters

##### formatted

`string`

#### Returns

`number` \| `null`

### symbol

> **symbol**: `string` = `settings.currencySymbol`
