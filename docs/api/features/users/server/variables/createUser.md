[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/users/server](../README.md) / createUser

# Variable: createUser

> `const` **createUser**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ \}\>\>

Defined in: features/users/server.ts:109

Create a new user (admin only).

## Param

User credentials and initial profile.

## Returns

A promise resolving to the created user result.

## Throws

If the email already exists.
