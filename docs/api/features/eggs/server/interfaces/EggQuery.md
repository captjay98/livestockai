[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/eggs/server](../README.md) / EggQuery

# Interface: EggQuery

Defined in: features/eggs/server.ts:25

Filter parameters for paginated egg record queries.

## Extends

- `BasePaginatedQuery`

## Properties

### batchId?

> `optional` **batchId**: `string`

Defined in: features/eggs/server.ts:27

Optional filter by specific poultry batch

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
