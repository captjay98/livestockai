[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/users/server](../README.md) / removeUser

# Variable: removeUser

> `const` **removeUser**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `success`: `true`; \}\>\>

Defined in: features/users/server.ts:255

Permanently remove a user account (admin only).

## Param

Object containing userId.

## Returns

A promise resolving to a success indicator.

## Throws

If attempting to delete self, another admin, or a sole farm owner.
