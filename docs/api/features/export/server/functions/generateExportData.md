[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/export/server](../README.md) / generateExportData

# Function: generateExportData()

> **generateExportData**(`options`): `Promise`\<\{ `content`: `string`; `filename`: `string`; `mimeType`: `string`; \}\>

Defined in: features/export/server.ts:31

Orchestrates data retrieval and transformation into CSV format for export.

## Parameters

### options

[`ExportOptions`](../interfaces/ExportOptions.md)

Report type and filtering criteria

## Returns

`Promise`\<\{ `content`: `string`; `filename`: `string`; `mimeType`: `string`; \}\>

Object contains raw CSV string and metadata for browser download
