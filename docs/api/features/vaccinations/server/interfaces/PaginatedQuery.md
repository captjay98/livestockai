[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / PaginatedQuery

# Interface: PaginatedQuery

Defined in: features/vaccinations/server.ts:73

Pagination and filtering options for health records.

## Properties

### batchId?

> `optional` **batchId**: `string`

Defined in: features/vaccinations/server.ts:87

Filter by batch ID

---

### farmId?

> `optional` **farmId**: `string`

Defined in: features/vaccinations/server.ts:85

Filter by farm ID

---

### page?

> `optional` **page**: `number`

Defined in: features/vaccinations/server.ts:75

Page number (1-based)

---

### pageSize?

> `optional` **pageSize**: `number`

Defined in: features/vaccinations/server.ts:77

Items per page

---

### search?

> `optional` **search**: `string`

Defined in: features/vaccinations/server.ts:83

Search term for filtering by name or species

---

### sortBy?

> `optional` **sortBy**: `string`

Defined in: features/vaccinations/server.ts:79

Field to sort by

---

### sortOrder?

> `optional` **sortOrder**: `"asc"` \| `"desc"`

Defined in: features/vaccinations/server.ts:81

Sort direction

---

### type?

> `optional` **type**: `"all"` \| `"vaccination"` \| `"treatment"`

Defined in: features/vaccinations/server.ts:89

Filter by record type
