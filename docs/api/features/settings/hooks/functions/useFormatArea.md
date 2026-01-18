[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/hooks](../README.md) / useFormatArea

# Function: useFormatArea()

> **useFormatArea**(): `object`

Defined in: features/settings/hooks.ts:171

Hook for area formatting and conversion

Returns functions to format areas and convert between units.

## Returns

`object`

### format()

> **format**: (`valueSqm`) => `string`

#### Parameters

##### valueSqm

`number`

#### Returns

`string`

### formatValue()

> **formatValue**: (`valueSqm`) => `string`

#### Parameters

##### valueSqm

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

> **unit**: `"sqm"` \| `"sqft"` = `settings.areaUnit`
