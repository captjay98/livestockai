[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/structures/server](../README.md) / getStructureFn

# Variable: getStructureFn

> `const` **getStructureFn**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `areaSqm`: `string` \| `null`; `batches`: `object`[]; `capacity`: `number` \| `null`; `createdAt`: `Date`; `farmId`: `string`; `farmName`: `string` \| `null`; `id`: `string`; `name`: `string`; `notes`: `string` \| `null`; `status`: `"active"` \| `"empty"` \| `"maintenance"`; `type`: `"house"` \| `"pond"` \| `"pen"` \| `"cage"` \| `"barn"` \| `"pasture"` \| `"hive"` \| `"milking_parlor"` \| `"shearing_shed"` \| `"tank"` \| `"tarpaulin"` \| `"raceway"` \| `"feedlot"` \| `"kraal"`; \}\>\>

Defined in: features/structures/server.ts:172

Server function to retrieve a specific structure's details.
