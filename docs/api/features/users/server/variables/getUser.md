[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/users/server](../README.md) / getUser

# Variable: getUser

> `const` **getUser**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `banExpires`: `Date` \| `null`; `banned`: `boolean`; `banReason`: `string` \| `null`; `createdAt`: `Date`; `email`: `string`; `farmAssignments`: `object`[]; `id`: `string`; `name`: `string`; `role`: `"user"` \| `"admin"`; \}\>\>

Defined in: features/users/server.ts:58

Get a single user by ID (admin only)

## Param

Object containing data.userId
