# Design Document: Onboarding Redesign

## Overview

This design addresses the broken onboarding flow in OpenLivestock by:

1. Reducing steps from 8 to 7 by combining farm creation with module selection
2. Fixing the critical bug where modules don't persist to the database
3. Eliminating code duplication by reusing existing `FarmDialog` and `BatchDialog` components
4. Ensuring proper data flow between steps (farmId, structureId, enabled modules)

The redesign follows the existing three-layer architecture (Server → Service → Repository) and maintains consistency with the established UI patterns.

## Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OnboardingProvider (Context)                  │
│  - progress: OnboardingProgress                                  │
│  - enabledModules: ModuleKey[]                                   │
│  - farmId, structureId, batchId                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  WelcomeStep  │    │CreateFarmStep │    │CreateBatchStep│
│               │    │ (uses         │    │ (uses         │
│               │    │  FarmDialog)  │    │  BatchDialog) │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
                     ┌───────────────┐
                     │ toggleModuleFn│
                     │ (persists to  │
                     │ farm_modules) │
                     └───────────────┘
```

### Data Flow

```
Step 1: Welcome
    │
    ▼
Step 2: Create Farm + Modules
    │ → createFarmFn() → farmId
    │ → toggleModuleFn() for each selected module → farm_modules table
    │ → setFarmId(farmId)
    │ → setEnabledModules([...])
    │
    ▼
Step 3: Create Structure (Optional)
    │ → createStructureFn() → structureId (if not skipped)
    │ → setStructureId(structureId)
    │
    ▼
Step 4: Create Batch
    │ → BatchDialog receives: farmId, structureId, enabledModules
    │ → Filters livestock types based on enabledModules
    │ → createBatchFn() → batchId
    │ → setBatchId(batchId)
    │
    ▼
Step 5: Preferences → Step 6: Tour → Step 7: Complete
```

## Components and Interfaces

### Updated OnboardingProgress Type

```typescript
// app/features/onboarding/types.ts
export type OnboardingStep =
  | 'welcome'
  | 'create-farm' // Combined: farm + modules
  | 'create-structure' // Optional
  | 'create-batch'
  | 'preferences'
  | 'tour'
  | 'complete'

export interface OnboardingProgress {
  currentStep: OnboardingStep
  completedSteps: Array<OnboardingStep>
  farmId?: string
  structureId?: string
  batchId?: string
  enabledModules: Array<ModuleKey> // NEW: Track enabled modules
  skipped: boolean
  completedAt?: string
}

export const ONBOARDING_STEPS: Array<OnboardingStep> = [
  'welcome',
  'create-farm',
  'create-structure',
  'create-batch',
  'preferences',
  'tour',
  'complete',
]
```

### Updated OnboardingContext Interface

```typescript
// app/features/onboarding/context.tsx
interface OnboardingContextValue {
  progress: OnboardingProgress
  isLoading: boolean
  needsOnboarding: boolean
  isAdminAdded: boolean
  currentStepIndex: number
  totalSteps: number
  goToStep: (step: OnboardingStep) => void
  completeStep: (step: OnboardingStep) => void
  skipStep: () => void
  skipOnboarding: () => void
  restartTour: () => void
  setFarmId: (farmId: string) => void
  setStructureId: (structureId: string) => void
  setBatchId: (batchId: string) => void
  setEnabledModules: (modules: Array<ModuleKey>) => void // NEW
  enabledModules: Array<ModuleKey> // NEW: Convenience accessor
}
```

### FarmDialog Props Extension

```typescript
// app/components/dialogs/farm-dialog.tsx
interface FarmDialogProps {
  farm?: Farm | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // NEW: Onboarding mode props
  onboardingMode?: boolean
  onSuccess?: (farmId: string, farmType: string) => void
  onSkip?: () => void
}
```

### BatchDialog Props Extension

```typescript
// app/components/dialogs/batch-dialog.tsx
interface BatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // NEW: Onboarding mode props
  onboardingMode?: boolean
  farmIdOverride?: string // Pre-select farm
  structureIdOverride?: string // Pre-select structure
  enabledModulesFilter?: Array<ModuleKey> // Filter livestock types
  onSuccess?: (batchId: string) => void
  onSkip?: () => void
}
```

### Module to Livestock Type Mapping

Uses existing `MODULE_METADATA[moduleKey].livestockTypes[0]` from `app/features/modules/constants.ts`. No new mapping needed.

### CreateFarmStep Component

```typescript
// app/components/onboarding/create-farm-step.tsx
export function CreateFarmStep() {
  const { completeStep, setFarmId, setEnabledModules, skipStep } =
    useOnboarding()
  const [showModuleSelector, setShowModuleSelector] = useState(false)
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>([])

  const handleFarmCreated = async (farmId: string, farmType: string) => {
    setFarmId(farmId)

    // Determine modules based on farm type
    let modulesToEnable: ModuleKey[]
    if (farmType === 'multi') {
      // User selected manually
      modulesToEnable = selectedModules
    } else {
      // Auto-select based on farm type
      modulesToEnable = DEFAULT_MODULES_BY_FARM_TYPE[farmType] || []
    }

    // Persist modules to database
    for (const moduleKey of modulesToEnable) {
      await toggleModuleFn({
        data: { farmId, moduleKey, enabled: true },
      })
    }

    setEnabledModules(modulesToEnable)
    completeStep('create-farm')
  }

  // Render FarmDialog with onboardingMode
}
```

### CreateBatchStep Component

```typescript
// app/components/onboarding/create-batch-step.tsx
export function CreateBatchStep() {
  const { progress, enabledModules, completeStep, setBatchId, skipStep } =
    useOnboarding()

  const handleBatchCreated = (batchId: string) => {
    setBatchId(batchId)
    completeStep('create-batch')
  }

  // Render BatchDialog with:
  // - farmIdOverride={progress.farmId}
  // - structureIdOverride={progress.structureId}
  // - enabledModulesFilter={enabledModules}
  // - onboardingMode={true}
}
```

## Data Models

### OnboardingProgress (Updated)

| Field          | Type             | Description                        |
| -------------- | ---------------- | ---------------------------------- |
| currentStep    | OnboardingStep   | Current step in the flow           |
| completedSteps | OnboardingStep[] | Steps that have been completed     |
| farmId         | string?          | ID of created farm                 |
| structureId    | string?          | ID of created structure (optional) |
| batchId        | string?          | ID of created batch                |
| enabledModules | ModuleKey[]      | List of enabled module keys        |
| skipped        | boolean          | Whether onboarding was skipped     |
| completedAt    | string?          | ISO timestamp when completed       |

### FarmType to Module Mapping

| Farm Type   | Default Modules            |
| ----------- | -------------------------- |
| poultry     | ['poultry']                |
| aquaculture | ['aquaculture']            |
| cattle      | ['cattle']                 |
| goats       | ['goats']                  |
| sheep       | ['sheep']                  |
| bees        | ['bees']                   |
| mixed       | ['poultry', 'aquaculture'] |
| multi       | [] (user selects)          |

### Module to Livestock Type Mapping

| Module Key  | Livestock Type |
| ----------- | -------------- |
| poultry     | 'poultry'      |
| aquaculture | 'fish'         |
| cattle      | 'cattle'       |
| goats       | 'goats'        |
| sheep       | 'sheep'        |
| bees        | 'bees'         |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Step Transition Correctness

_For any_ onboarding step and action (complete or skip), the resulting current step should be the correct next step in the sequence, and the previous step should be marked as completed (for complete action) or unchanged (for skip action).

**Validates: Requirements 1.2, 4.2**

### Property 2: Farm Type to Default Modules Mapping

_For any_ valid farm type, the `DEFAULT_MODULES_BY_FARM_TYPE` mapping should return the correct array of module keys. Specifically:

- Single-species types (poultry, aquaculture, cattle, goats, sheep, bees) should return an array containing only that module
- 'mixed' should return ['poultry', 'aquaculture']
- 'multi' should return an empty array

**Validates: Requirements 1.4, 2.3-2.9**

### Property 3: Module to Livestock Type Filtering

_For any_ set of enabled modules, the filtered livestock types should contain exactly the livestock types corresponding to those modules. The mapping is:

- poultry → 'poultry'
- aquaculture → 'fish'
- cattle → 'cattle'
- goats → 'goats'
- sheep → 'sheep'
- bees → 'bees'

**Validates: Requirements 5.4, 7.1-7.7**

### Property 4: Context State Update Consistency

_For any_ valid ID (farmId, structureId, batchId) or module list, calling the corresponding setter function should update the context state to contain that value, and the value should be retrievable from the context.

**Validates: Requirements 6.1, 6.2, 9.1**

### Property 5: LocalStorage Round-Trip Persistence

_For any_ valid OnboardingProgress object, serializing it to localStorage and then deserializing it should produce an equivalent object with all fields preserved (including enabledModules array).

**Validates: Requirements 9.3, 9.4**

## Error Handling

### Farm Creation Errors

| Error Type       | User Message                                           | Recovery Action           |
| ---------------- | ------------------------------------------------------ | ------------------------- |
| Network failure  | "Failed to create farm. Please check your connection." | Retry button              |
| Validation error | "Please fill in all required fields."                  | Highlight invalid fields  |
| Server error     | "Something went wrong. Please try again."              | Retry button, Skip option |

### Module Persistence Errors

| Error Type      | User Message                                     | Recovery Action |
| --------------- | ------------------------------------------------ | --------------- |
| Network failure | "Failed to save module settings."                | Retry button    |
| Access denied   | "You don't have permission to modify this farm." | Contact support |
| Server error    | "Something went wrong. Please try again."        | Retry button    |

### Batch Creation Errors

| Error Type       | User Message                              | Recovery Action           |
| ---------------- | ----------------------------------------- | ------------------------- |
| No farm selected | "Please create a farm first."             | Go back to farm step      |
| Validation error | "Please fill in all required fields."     | Highlight invalid fields  |
| Server error     | "Something went wrong. Please try again." | Retry button, Skip option |

### Error Recovery Flow

```
Error Occurs
    │
    ├─► Display error message with toast
    │
    ├─► Show retry button (primary action)
    │
    └─► Show skip button (secondary action)
            │
            └─► Proceed to next step without completing current
```

## Testing Strategy

### Unit Tests

Unit tests focus on pure business logic and utility functions:

1. **Step transition logic**: Test `completeStep` and `skipStep` functions
2. **Farm type to module mapping**: Test `DEFAULT_MODULES_BY_FARM_TYPE` lookups
3. **Module to livestock type mapping**: Test filtering function
4. **LocalStorage serialization**: Test JSON serialization/deserialization

### Property-Based Tests

Property-based tests use `fast-check` to verify universal properties:

1. **Step Transition Property**: Generate random steps and actions, verify correct transitions
2. **Module Mapping Property**: Generate random farm types, verify correct module arrays
3. **Livestock Filtering Property**: Generate random module sets, verify correct livestock types
4. **Context State Property**: Generate random IDs, verify state updates
5. **LocalStorage Round-Trip Property**: Generate random progress objects, verify serialization

**Configuration**:

- Minimum 100 iterations per property test
- Use `fast-check` library for TypeScript
- Tag format: `Feature: onboarding-redesign, Property N: {property_text}`

### Integration Tests

Integration tests verify database operations:

1. **Module persistence**: Create farm, enable modules, verify `farm_modules` table
2. **Farm creation flow**: Complete farm step, verify farm exists in database
3. **Batch creation flow**: Complete batch step, verify batch exists with correct farmId

### Component Tests

Component tests verify UI behavior:

1. **FarmDialog onboardingMode**: Verify skip button shown, cancel hidden
2. **BatchDialog filtering**: Verify livestock types filtered by enabled modules
3. **Error display**: Verify error messages shown on failure
4. **Step navigation**: Verify correct step rendered based on context

## Implementation Notes

### Files to Modify

1. **app/features/onboarding/types.ts**
   - Update `OnboardingStep` type (remove 'enable-modules')
   - Add `enabledModules` to `OnboardingProgress`
   - Update `ONBOARDING_STEPS` array

2. **app/features/onboarding/context.tsx**
   - Add `setEnabledModules` function
   - Add `enabledModules` to context value
   - Update localStorage serialization

3. **app/components/dialogs/farm-dialog.tsx**
   - Add all 8 farm types to Select options
   - Add `onboardingMode`, `onSuccess`, `onSkip` props
   - Conditionally render skip button

4. **app/components/dialogs/batch-dialog.tsx**
   - Add `onboardingMode`, `farmIdOverride`, `structureIdOverride`, `enabledModulesFilter`, `onSuccess`, `onSkip` props
   - Filter livestock types based on `enabledModulesFilter`
   - Conditionally render skip button

5. **app/components/onboarding/create-farm-step.tsx**
   - Reuse FarmDialog with onboardingMode
   - Add module selection UI for 'multi' farm type
   - Call toggleModuleFn to persist modules

6. **app/components/onboarding/create-structure-step.tsx**
   - Replace informational content with real structure form
   - Add skip functionality

7. **app/components/onboarding/create-batch-step.tsx**
   - Reuse BatchDialog with onboardingMode
   - Pass farmId, structureId, enabledModules from context

8. **app/components/onboarding/index.ts**
   - Remove EnableModulesStep export

### Files to Delete

1. **app/components/onboarding/enable-modules-step.tsx** - Merged into create-farm-step

### New Utility Functions

```typescript
// app/features/modules/utils.ts
export function getDefaultModulesForFarmType(farmType: string): ModuleKey[] {
  return DEFAULT_MODULES_BY_FARM_TYPE[farmType] ?? []
}

export function getLivestockTypesForModules(modules: ModuleKey[]): string[] {
  return modules.map((m) => MODULE_METADATA[m].livestockTypes[0])
}

export function filterLivestockTypesByModules(
  allTypes: Array<{ value: string; label: string }>,
  enabledModules: ModuleKey[],
): Array<{ value: string; label: string }> {
  const allowedTypes = getLivestockTypesForModules(enabledModules)
  return allTypes.filter((t) => allowedTypes.includes(t.value))
}
```
