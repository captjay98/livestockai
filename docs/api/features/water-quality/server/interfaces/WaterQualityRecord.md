[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / WaterQualityRecord

# Interface: WaterQualityRecord

Defined in: features/water-quality/server.ts:11

Represents a single water quality measurement record.
Primarily used for aquaculture (fish) monitoring.

## Properties

### ammoniaMgL

> **ammoniaMgL**: `string`

Defined in: features/water-quality/server.ts:27

Ammonia concentration in mg/L

***

### batchId

> **batchId**: `string`

Defined in: features/water-quality/server.ts:15

ID of the livestock batch being monitored

***

### batchSpecies

> **batchSpecies**: `string` \| `null`

Defined in: features/water-quality/server.ts:17

Display name of the batch species

***

### date

> **date**: `Date`

Defined in: features/water-quality/server.ts:19

Date and time of the measurement

***

### dissolvedOxygenMgL

> **dissolvedOxygenMgL**: `string`

Defined in: features/water-quality/server.ts:25

Dissolved Oxygen concentration in mg/L

***

### id

> **id**: `string`

Defined in: features/water-quality/server.ts:13

Unique identifier for the measurement

***

### notes

> **notes**: `string` \| `null`

Defined in: features/water-quality/server.ts:29

Optional observer notes

***

### ph

> **ph**: `string`

Defined in: features/water-quality/server.ts:21

pH level (0-14)

***

### temperatureCelsius

> **temperatureCelsius**: `string`

Defined in: features/water-quality/server.ts:23

Temperature in degrees Celsius
