[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/users/server](../README.md) / updateUserRole

# Variable: updateUserRole

> `const` **updateUserRole**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `success`: `true`; \}\>\>

Defined in: features/users/server.ts:321

Update a user's role (admin only).

## Param

Object containing userId and the new role.

## Returns

A promise resolving to a success indicator.

## Throws

If attempting to change own role.
