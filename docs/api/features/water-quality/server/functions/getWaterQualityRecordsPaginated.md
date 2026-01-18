[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/water-quality/server](../README.md) / getWaterQualityRecordsPaginated

# Function: getWaterQualityRecordsPaginated()

> **getWaterQualityRecordsPaginated**(`userId`, `query`): `Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Defined in: features/water-quality/server.ts:330

Retrieves a paginated list of water quality records with sorting and search.

## Parameters

### userId

`string`

ID of the user requesting data

### query

[`WaterQualityQuery`](../interfaces/WaterQualityQuery.md) = `{}`

Pagination, sorting, and filter parameters

## Returns

`Promise`\<\{ `data`: `object`[]; `page`: `number`; `pageSize`: `number`; `total`: `number`; `totalPages`: `number`; \}\>

Promise resolving to a paginated set of measurements
