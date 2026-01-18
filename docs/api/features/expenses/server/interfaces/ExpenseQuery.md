[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/expenses/server](../README.md) / ExpenseQuery

# Interface: ExpenseQuery

Defined in: features/expenses/server.ts:540

Filter and pagination parameters for querying expenses.

## Extends

- `BasePaginatedQuery`

## Properties

### batchId?

> `optional` **batchId**: `string`

Defined in: features/expenses/server.ts:542

Filter by a specific livestock batch

---

### category?

> `optional` **category**: `string`

Defined in: features/expenses/server.ts:544

Filter by an expense category

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
