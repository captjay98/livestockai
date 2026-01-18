[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/currency](../README.md) / calculatePercentage

# Function: calculatePercentage()

> **calculatePercentage**(`part`, `total`): `number`

Defined in: features/settings/currency.ts:125

Calculate percentage of one amount relative to another

## Parameters

### part

[`MoneyInput`](../type-aliases/MoneyInput.md)

Amount (numerator)

### total

[`MoneyInput`](../type-aliases/MoneyInput.md)

Amount (denominator)

## Returns

`number`

Percentage (0-100), or 0 if total is 0
