[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/settings/currency-formatter](../README.md) / parseCurrency

# Function: parseCurrency()

> **parseCurrency**(`formatted`, `settings`): `number` \| `null`

Defined in: features/settings/currency-formatter.ts:128

Parse a formatted currency string back to a number

## Parameters

### formatted

`string`

The formatted currency string

### settings

`Pick`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md), `"currencySymbol"` \| `"thousandSeparator"` \| `"decimalSeparator"`\>

User settings containing currency configuration

## Returns

`number` \| `null`

The numeric value, or null if parsing fails
