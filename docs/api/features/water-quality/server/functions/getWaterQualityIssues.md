[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / getWaterQualityIssues

# Function: getWaterQualityIssues()

> **getWaterQualityIssues**(`params`): `string`[]

Defined in: features/water-quality/server.ts:94

Identifies specific issues in water quality measurements based on system thresholds.

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

`string`[]

Array of descriptive error messages for each threshold violation
