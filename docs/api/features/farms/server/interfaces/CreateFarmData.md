[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/farms/server](../README.md) / CreateFarmData

# Interface: CreateFarmData

Defined in: features/farms/server.ts:8

Data structure for creating a new farm.

## Properties

### location

> **location**: `string`

Defined in: features/farms/server.ts:12

Physical or geographical location description

---

### name

> **name**: `string`

Defined in: features/farms/server.ts:10

Display name of the farm

---

### type

> **type**: `"poultry"` \| `"cattle"` \| `"goats"` \| `"sheep"` \| `"bees"` \| `"aquaculture"` \| `"mixed"` \| `"multi"`

Defined in: features/farms/server.ts:17

Primary livestock focus of the farm.
Helps determine which modules are enabled by default.
