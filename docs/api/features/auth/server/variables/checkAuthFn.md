[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/auth/server](../README.md) / checkAuthFn

# Variable: checkAuthFn

> `const` **checkAuthFn**: `OptionalFetcher`\<`undefined`, `undefined`, `Promise`\<\{ `user`: \{ `banExpires?`: `Date` \| `null`; `banned`: `boolean` \| `null` \| `undefined`; `banReason?`: `string` \| `null`; `role`: `string`; \}; \}\>\>

Defined in: features/auth/server.ts:44

Server function to check the current user's authentication status.
Returns the session user if authenticated.

## Returns

Promise resolving to the current user object

## Throws

If the user is not authenticated
