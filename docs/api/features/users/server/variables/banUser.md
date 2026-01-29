[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/users/server](../README.md) / banUser

# Variable: banUser

> `const` **banUser**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `success`: `true`; \}\>\>

Defined in: features/users/server.ts:177

Ban a user from the platform (admin only).

## Param

Object containing userId, reason, and optional expiration.

## Returns

A promise resolving to a success indicator.

## Throws

If attempting to ban self or another admin.
