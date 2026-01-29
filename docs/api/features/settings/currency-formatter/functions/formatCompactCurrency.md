[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/settings/currency-formatter](../README.md) / formatCompactCurrency

# Function: formatCompactCurrency()

> **formatCompactCurrency**(`amount`, `settings`): `string`

Defined in: features/settings/currency-formatter.ts:86

Format a monetary amount in compact form (e.g., "$1.5K", "₦2.3M")

## Parameters

### amount

[`MoneyInput`](../../currency/type-aliases/MoneyInput.md)

The amount to format

### settings

`Pick`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md), `"currencySymbol"` \| `"currencySymbolPosition"` \| `"currencyDecimals"` \| `"thousandSeparator"` \| `"decimalSeparator"`\>

User settings containing currency configuration

## Returns

`string`

Compact formatted currency string
