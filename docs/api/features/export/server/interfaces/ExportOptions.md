[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/export/server](../README.md) / ExportOptions

# Interface: ExportOptions

Defined in: features/export/server.ts:12

Parameters for generating a downloadable report.

## Properties

### endDate

> **endDate**: `string`

Defined in: features/export/server.ts:22

Upper bound for date-filtered data (ISO string)

---

### farmId?

> `optional` **farmId**: `string`

Defined in: features/export/server.ts:18

Optional specific farm filter

---

### format

> **format**: `"xlsx"` \| `"pdf"`

Defined in: features/export/server.ts:16

Output file format

---

### reportType

> **reportType**: `string`

Defined in: features/export/server.ts:14

The logic/data source (e.g., 'profit-loss', 'inventory')

---

### startDate

> **startDate**: `string`

Defined in: features/export/server.ts:20

Lower bound for date-filtered data (ISO string)
