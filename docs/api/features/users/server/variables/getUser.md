[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/users/server](../README.md) / getUser

# Variable: getUser

> `const` **getUser**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `banExpires`: `Date` \| `null`; `banned`: `boolean`; `banReason`: `string` \| `null`; `createdAt`: `Date`; `email`: `string`; `farmAssignments`: `object`[]; `id`: `string`; `name`: `string`; `role`: `"user"` \| `"admin"`; \}\>\>

Defined in: features/users/server.ts:61

Get a single user by ID (admin only).

## Param

Object containing `userId`.

## Returns

A promise resolving to the user details and farm assignments.

## Throws

If the user is not found.
