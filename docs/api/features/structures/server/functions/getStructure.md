[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/structures/server](../README.md) / getStructure

# Function: getStructure()

> **getStructure**(`userId`, `structureId`): `Promise`\<\{ `areaSqm`: `string` \| `null`; `batches`: `object`[]; `capacity`: `number` \| `null`; `createdAt`: `Date`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `name`: `string`; `notes`: `string` \| `null`; `status`: `"active"` \| `"empty"` \| `"maintenance"`; `type`: `"house"` \| `"pond"` \| `"pen"` \| `"cage"` \| `"barn"` \| `"pasture"` \| `"hive"` \| `"milking_parlor"` \| `"shearing_shed"` \| `"tank"` \| `"tarpaulin"` \| `"raceway"` \| `"feedlot"` \| `"kraal"`; \}\>

Defined in: features/structures/server.ts:124

Retrieve details for a single structure, including currently active livestock batches.

## Parameters

### userId

`string`

ID of the user requesting the data

### structureId

`string`

ID of the structure to retrieve

## Returns

`Promise`\<\{ `areaSqm`: `string` \| `null`; `batches`: `object`[]; `capacity`: `number` \| `null`; `createdAt`: `Date`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `name`: `string`; `notes`: `string` \| `null`; `status`: `"active"` \| `"empty"` \| `"maintenance"`; `type`: `"house"` \| `"pond"` \| `"pen"` \| `"cage"` \| `"barn"` \| `"pasture"` \| `"hive"` \| `"milking_parlor"` \| `"shearing_shed"` \| `"tank"` \| `"tarpaulin"` \| `"raceway"` \| `"feedlot"` \| `"kraal"`; \}\>

Promise resolving to the structure details with active batch list

## Throws

If structure is not found or access is denied
