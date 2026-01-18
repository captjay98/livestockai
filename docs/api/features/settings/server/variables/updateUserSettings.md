[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/server](../README.md) / updateUserSettings

# Variable: updateUserSettings

> `const` **updateUserSettings**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `success`: `true`; \}\>\>

Defined in: features/settings/server.ts:115

Update the current user's settings. Performs an upsert operation.

## Param

The new settings data (validated against userSettingsSchema)

## Returns

Promise resolving to a success indicator

## Throws

If update fails
