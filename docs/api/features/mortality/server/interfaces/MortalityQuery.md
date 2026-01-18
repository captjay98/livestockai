[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/mortality/server](../README.md) / MortalityQuery

# Interface: MortalityQuery

Defined in: features/mortality/server.ts:45

Parameters for filtering and paginating mortality records.

## Extends

- `BasePaginatedQuery`

## Properties

### batchId?

> `optional` **batchId**: `string`

Defined in: features/mortality/server.ts:47

Optional filter for a specific livestock batch

---

### farmId?

> `optional` **farmId**: `string`

Defined in: lib/types.ts:15

#### Inherited from

`BasePaginatedQuery.farmId`

---

### page?

> `optional` **page**: `number`

Defined in: lib/types.ts:10

#### Inherited from

`BasePaginatedQuery.page`

---

### pageSize?

> `optional` **pageSize**: `number`

Defined in: lib/types.ts:11

#### Inherited from

`BasePaginatedQuery.pageSize`

---

### search?

> `optional` **search**: `string`

Defined in: lib/types.ts:14

#### Inherited from

`BasePaginatedQuery.search`

---

### sortBy?

> `optional` **sortBy**: `string`

Defined in: lib/types.ts:12

#### Inherited from

`BasePaginatedQuery.sortBy`

---

### sortOrder?

> `optional` **sortOrder**: `"asc"` \| `"desc"`

Defined in: lib/types.ts:13

#### Inherited from

`BasePaginatedQuery.sortOrder`
