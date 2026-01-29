[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/modules/server](../README.md) / toggleModule

# Function: toggleModule()

> **toggleModule**(`farmId`, `moduleKey`, `enabled`): `Promise`\<`void`\>

Defined in: features/modules/server.ts:87

Enables or disables a specific subsystem (e.g., 'bees') for a farm.
Handles both new module enabling and updating existing states.

## Parameters

### farmId

`string`

Target farm

### moduleKey

[`ModuleKey`](../../types/type-aliases/ModuleKey.md)

Logic identifier

### enabled

`boolean`

Target state

## Returns

`Promise`\<`void`\>
