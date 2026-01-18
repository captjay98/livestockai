[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/onboarding/server](../README.md) / saveOnboardingProgressFn

# Variable: saveOnboardingProgressFn

> `const` **saveOnboardingProgressFn**: `RequiredFetcher`\<`undefined`, (`data`) => `object`, `Promise`\<\{ `progress`: [`OnboardingProgress`](../../types/interfaces/OnboardingProgress.md); `success`: `true`; \}\>\>

Defined in: features/onboarding/server.ts:85

Save onboarding progress.
Currently returns the data back as it's primarily client-managed.

## Param

The current progress object.

## Returns

A promise resolving to the success state and saving progress.
