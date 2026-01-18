[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/hooks](../README.md) / useFormatWeight

# Function: useFormatWeight()

> **useFormatWeight**(): `object`

Defined in: features/settings/hooks.ts:139

Hook for weight formatting and conversion

Returns functions to format weights and convert between units.

## Returns

`object`

### format()

> **format**: (`valueKg`) => `string`

#### Parameters

##### valueKg

`number`

#### Returns

`string`

### formatValue()

> **formatValue**: (`valueKg`) => `string`

#### Parameters

##### valueKg

`number`

#### Returns

`string`

### label

> **label**: `string`

### toMetric()

> **toMetric**: (`value`) => `number`

#### Parameters

##### value

`number`

#### Returns

`number`

### unit

> **unit**: `"kg"` \| `"lbs"` = `settings.weightUnit`
