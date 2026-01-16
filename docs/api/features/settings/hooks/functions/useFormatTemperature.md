[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/hooks](../README.md) / useFormatTemperature

# Function: useFormatTemperature()

> **useFormatTemperature**(): `object`

Defined in: features/settings/hooks.ts:203

Hook for temperature formatting and conversion

Returns functions to format temperatures and convert between units.

## Returns

`object`

### format()

> **format**: (`valueCelsius`) => `string`

#### Parameters

##### valueCelsius

`number`

#### Returns

`string`

### formatValue()

> **formatValue**: (`valueCelsius`) => `string`

#### Parameters

##### valueCelsius

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

> **unit**: `"celsius"` \| `"fahrenheit"` = `settings.temperatureUnit`
