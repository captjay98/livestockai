[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/onboarding/server](../README.md) / checkNeedsOnboardingFn

# Variable: checkNeedsOnboardingFn

> `const` **checkNeedsOnboardingFn**: `OptionalFetcher`\<`undefined`, `undefined`, `Promise`\<\{ `hasFarms`: `boolean`; `needsOnboarding`: `boolean`; \}\>\>

Defined in: features/onboarding/server.ts:116

Evaluates whether a user requires the onboarding walkthrough.
Checks both explicit completion flags and heuristic (presence of farms).

## Returns

A promise resolving to the needsOnboarding flag and farm presence.
