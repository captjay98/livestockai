[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/feed/server](../README.md) / FeedQuery

# Interface: FeedQuery

Defined in: features/feed/server.ts:56

Parameters for filtering and paginating feeding records.

## Extends

- `BasePaginatedQuery`

## Properties

### batchId?

> `optional` **batchId**: `string`

Defined in: features/feed/server.ts:58

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
