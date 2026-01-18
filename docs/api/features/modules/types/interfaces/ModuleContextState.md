[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/modules/types](../README.md) / ModuleContextState

# Interface: ModuleContextState

Defined in: features/modules/types.ts:75

## Properties

### canDisableModule()

> **canDisableModule**: (`moduleKey`) => `Promise`\<`boolean`\>

Defined in: features/modules/types.ts:79

#### Parameters

##### moduleKey

[`ModuleKey`](../type-aliases/ModuleKey.md)

#### Returns

`Promise`\<`boolean`\>

---

### enabledModules

> **enabledModules**: [`ModuleKey`](../type-aliases/ModuleKey.md)[]

Defined in: features/modules/types.ts:76

---

### isLoading

> **isLoading**: `boolean`

Defined in: features/modules/types.ts:77

---

### refreshModules()

> **refreshModules**: () => `Promise`\<`void`\>

Defined in: features/modules/types.ts:80

#### Returns

`Promise`\<`void`\>

---

### toggleModule()

> **toggleModule**: (`moduleKey`) => `Promise`\<`void`\>

Defined in: features/modules/types.ts:78

#### Parameters

##### moduleKey

[`ModuleKey`](../type-aliases/ModuleKey.md)

#### Returns

`Promise`\<`void`\>
