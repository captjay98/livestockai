[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / isWaterQualityAlert

# Function: isWaterQualityAlert()

> **isWaterQualityAlert**(`params`): `boolean`

Defined in: features/water-quality/server.ts:69

Evaluates whether a set of water parameters falls outside of acceptable thresholds.

## Parameters

### params

Object containing pH, temperature, DO, and ammonia levels

#### ammoniaMgL

`number`

#### dissolvedOxygenMgL

`number`

#### ph

`number`

#### temperatureCelsius

`number`

## Returns

`boolean`

True if any parameter is out of safe range
