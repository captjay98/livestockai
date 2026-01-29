[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/customers/server](../README.md) / CustomerQuery

# Interface: CustomerQuery

Defined in: features/customers/server.ts:53

Filter and pagination parameters for querying customers.

## Extends

- `BasePaginatedQuery`

## Properties

### customerType?

> `optional` **customerType**: `string`

Defined in: features/customers/server.ts:55

Filter by a specific customer classification

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
