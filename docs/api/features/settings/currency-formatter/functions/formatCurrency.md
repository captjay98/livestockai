[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/currency-formatter](../README.md) / formatCurrency

# Function: formatCurrency()

> **formatCurrency**(`amount`, `settings`): `string`

Defined in: features/settings/currency-formatter.ts:55

Format a monetary amount according to user settings

## Parameters

### amount

[`MoneyInput`](../../currency/type-aliases/MoneyInput.md)

The amount to format (string, number, or Decimal)

### settings

`Pick`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md), `"currencySymbol"` \| `"currencySymbolPosition"` \| `"currencyDecimals"` \| `"thousandSeparator"` \| `"decimalSeparator"`\>

User settings containing currency configuration

## Returns

`string`

Formatted currency string (e.g., "$1,234.56" or "1.234,56 €")
