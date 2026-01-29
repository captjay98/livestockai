[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/auth/server](../README.md) / loginFn

# Variable: loginFn

> `const` **loginFn**: `RequiredFetcher`\<`undefined`, `ZodObject`\<\{ `email`: `ZodString`; `password`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `email`: `string`; `password`: `string`; \}, \{ `email`: `string`; `password`: `string`; \}\>, `Promise`\<\{ `error?`: `undefined`; `success`: `true`; `user`: `object` & `object`; \} \| \{ `error`: `string`; `success`: `false`; `user?`: `undefined`; \}\>\>

Defined in: features/auth/server.ts:19

Server function for user login using email and password.
Utilizes Better Auth for session management.

## Param

User credentials (email and password)

## Returns

Promise resolving to a success indicator and user data, or an error message
