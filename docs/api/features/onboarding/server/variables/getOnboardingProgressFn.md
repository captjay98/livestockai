[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/onboarding/server](../README.md) / getOnboardingProgressFn

# Variable: getOnboardingProgressFn

> `const` **getOnboardingProgressFn**: `OptionalFetcher`\<`undefined`, `undefined`, `Promise`\<\{ `farmId`: `string`; `isAdminAdded`: `true`; `needsOnboarding`: `false`; `progress`: \{ `batchId?`: `string`; `completedAt`: `string` \| `undefined`; `completedSteps`: \[`"welcome"`, `"create-farm"`, `"enable-modules"`, `"create-structure"`, `"create-batch"`, `"preferences"`, `"tour"`, `"complete"`\]; `currentStep`: `"complete"`; `farmId?`: `string`; `skipped`: `boolean`; `structureId?`: `string`; \}; \} \| \{ `farmId`: `null`; `isAdminAdded`: `false`; `needsOnboarding`: `true`; `progress`: [`OnboardingProgress`](../../types/interfaces/OnboardingProgress.md); \}\>\>

Defined in: features/onboarding/server.ts:15

Get onboarding progress for the current user
