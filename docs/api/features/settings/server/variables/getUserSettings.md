[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/server](../README.md) / getUserSettings

# Variable: getUserSettings

> `const` **getUserSettings**: `OptionalFetcher`\<`undefined`, `undefined`, `Promise`\<[`UserSettings`](../../currency-presets/interfaces/UserSettings.md)\>\>

Defined in: features/settings/server.ts:75

Get the current user's settings, including currency, units, and date preferences.
Returns default settings if none exist for the user.

## Returns

Promise resolving to the user's settings object
