# Implementation Plan: Onboarding Redesign

## Overview

This implementation fixes the broken onboarding flow by:

1. Updating types and context to support 7-step flow with enabled modules tracking
2. Extending FarmDialog and BatchDialog with onboarding mode
3. Rewriting step components to reuse existing dialogs and persist data correctly
4. Adding utility functions for module/livestock type mapping

## Tasks

- [x] 1. Update onboarding types and constants
  - [x] 1.1 Update OnboardingStep type to remove 'enable-modules' step
    - Modify `app/features/onboarding/types.ts`
    - Update type to: 'welcome' | 'create-farm' | 'create-structure' | 'create-batch' | 'preferences' | 'tour' | 'complete'
    - _Requirements: 1.1_
  - [x] 1.2 Add enabledModules field to OnboardingProgress interface
    - Add `enabledModules: Array<ModuleKey>` field
    - Update DEFAULT_PROGRESS to include `enabledModules: []`
    - _Requirements: 9.1_
  - [x] 1.3 Update ONBOARDING_STEPS array to 7 steps
    - Remove 'enable-modules' from the array
    - Verify order: welcome, create-farm, create-structure, create-batch, preferences, tour, complete
    - _Requirements: 1.1_

- [x] 2. Update OnboardingContext with module tracking
  - [x] 2.1 Add setEnabledModules function and enabledModules accessor to context
    - Add `setEnabledModules: (modules: Array<ModuleKey>) => void` to context interface
    - Add `enabledModules: Array<ModuleKey>` convenience accessor
    - Implement setEnabledModules callback
    - _Requirements: 9.1, 9.2_
  - [x] 2.2 Update localStorage serialization to include enabledModules
    - Ensure enabledModules is serialized when saving to localStorage
    - Ensure enabledModules is restored when loading from localStorage
    - _Requirements: 9.3, 9.4_
  - [x] 2.3 Write property test for localStorage round-trip
    - **Property 5: LocalStorage Round-Trip Persistence**
    - **Validates: Requirements 9.3, 9.4**

- [x] 3. Create module utility functions
  - [x] 3.1 Create utility functions for module/livestock type mapping
    - Create `app/features/modules/utils.ts`
    - Implement `getDefaultModulesForFarmType(farmType: string): ModuleKey[]`
    - Implement `getLivestockTypesForModules(modules: ModuleKey[]): string[]`
    - Implement `filterLivestockTypesByModules(allTypes, enabledModules)`
    - _Requirements: 1.4, 5.4, 7.1-7.7_
  - [x] 3.2 Write property test for farm type to module mapping
    - **Property 2: Farm Type to Default Modules Mapping**
    - **Validates: Requirements 1.4, 2.3-2.9**
  - [x] 3.3 Write property test for module to livestock type filtering
    - **Property 3: Module to Livestock Type Filtering**
    - **Validates: Requirements 5.4, 7.1-7.7**

- [x] 4. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update FarmDialog for onboarding mode
  - [x] 5.1 Add all 8 farm types to FarmDialog
    - Add cattle, goats, sheep, bees, multi options to Select
    - Update type definition to include all farm types
    - _Requirements: 3.1_
  - [x] 5.2 Add onboardingMode props to FarmDialog
    - Add `onboardingMode?: boolean` prop
    - Add `onSuccess?: (farmId: string, farmType: string) => void` prop
    - Add `onSkip?: () => void` prop
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 5.3 Implement onboardingMode behavior in FarmDialog
    - When onboardingMode is true, hide cancel button and show skip button
    - When onboardingMode is true, call onSuccess callback instead of router.invalidate
    - Pass farmType to onSuccess callback for module determination
    - _Requirements: 3.3, 3.4_

- [x] 6. Update BatchDialog for onboarding mode
  - [x] 6.1 Add onboardingMode props to BatchDialog
    - Add `onboardingMode?: boolean` prop
    - Add `farmIdOverride?: string` prop
    - Add `structureIdOverride?: string` prop
    - Add `enabledModulesFilter?: Array<ModuleKey>` prop
    - Add `onSuccess?: (batchId: string) => void` prop
    - Add `onSkip?: () => void` prop
    - _Requirements: 5.1-5.6_
  - [x] 6.2 Implement livestock type filtering in BatchDialog
    - When enabledModulesFilter is provided, filter livestock types to only show matching types
    - Use filterLivestockTypesByModules utility function
    - _Requirements: 5.4, 7.1-7.7_
  - [x] 6.3 Implement onboardingMode behavior in BatchDialog
    - When onboardingMode is true, use farmIdOverride instead of selectedFarmId
    - When onboardingMode is true, pre-select structureIdOverride if provided
    - When onboardingMode is true, hide cancel button and show skip button
    - When onboardingMode is true, call onSuccess callback instead of router.invalidate
    - _Requirements: 5.2, 5.3, 5.5, 5.6_

- [x] 7. Checkpoint - Verify dialog updates
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Rewrite CreateFarmStep to use FarmDialog
  - [x] 8.1 Refactor CreateFarmStep to use FarmDialog component
    - Remove custom form implementation
    - Render FarmDialog with onboardingMode={true}
    - Handle onSuccess callback to get farmId and farmType
    - Handle onSkip callback
    - _Requirements: 2.1, 3.1-3.4_
  - [x] 8.2 Add module persistence logic to CreateFarmStep
    - After farm creation, determine modules based on farmType
    - For 'multi' type, show module selection UI
    - Call toggleModuleFn for each module to enable
    - Update context with setEnabledModules
    - _Requirements: 2.2-2.11_
  - [x] 8.3 Add module selection UI for 'multi' farm type
    - Show module checkboxes when farmType is 'multi'
    - Allow user to select which modules to enable
    - Persist selected modules after confirmation
    - _Requirements: 2.10_

- [x] 9. Rewrite CreateStructureStep with real form
  - [x] 9.1 Replace informational content with structure creation form
    - Add form fields for structure name, type, capacity
    - Call createStructureFn on submit
    - Update context with setStructureId on success
    - _Requirements: 4.3, 4.4_
  - [x] 9.2 Implement skip functionality for CreateStructureStep
    - Add skip button that advances to next step
    - Do not create structure when skipped
    - _Requirements: 4.1, 4.2_

- [x] 10. Rewrite CreateBatchStep to use BatchDialog
  - [x] 10.1 Refactor CreateBatchStep to use BatchDialog component
    - Remove custom form implementation
    - Render BatchDialog with onboardingMode={true}
    - Pass farmIdOverride from context
    - Pass structureIdOverride from context (if available)
    - Pass enabledModulesFilter from context
    - Handle onSuccess callback to get batchId
    - Handle onSkip callback
    - _Requirements: 5.1-5.7, 6.3-6.5_

- [x] 11. Delete enable-modules-step.tsx
  - [x] 11.1 Remove EnableModulesStep component file
    - Delete `app/components/onboarding/enable-modules-step.tsx`
    - Remove export from `app/components/onboarding/index.ts`
    - _Requirements: 1.1, 1.3_

- [x] 12. Update onboarding layout to use new steps
  - [x] 12.1 Update OnboardingLayout to render correct step components
    - Remove EnableModulesStep from step rendering
    - Ensure step order matches ONBOARDING_STEPS
    - _Requirements: 1.1, 1.2_

- [x] 13. Checkpoint - Verify onboarding flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Write property test for step transitions
  - [x] 14.1 Write property test for step transition correctness
    - **Property 1: Step Transition Correctness**
    - **Validates: Requirements 1.2, 4.2**

- [x] 15. Write property test for context state updates
  - [x] 15.1 Write property test for context state update consistency
    - **Property 4: Context State Update Consistency**
    - **Validates: Requirements 6.1, 6.2, 9.1**

- [x] 16. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify onboarding flow works end-to-end
  - Verify modules persist to farm_modules table
  - Verify batch creation filters livestock types correctly

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
