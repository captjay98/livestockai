[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / SalesQuery

# Interface: SalesQuery

Defined in: features/sales/server.ts:651

Paginated sales query with sorting and search

## Extends

- `BasePaginatedQuery`

## Properties

### batchId?

> `optional` **batchId**: `string`

Defined in: features/sales/server.ts:652

---

### farmId?

> `optional` **farmId**: `string`

Defined in: lib/types.ts:15

#### Inherited from

`BasePaginatedQuery.farmId`

---

### livestockType?

> `optional` **livestockType**: `string`

Defined in: features/sales/server.ts:653

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

### paymentStatus?

> `optional` **paymentStatus**: `string`

Defined in: features/sales/server.ts:654

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
