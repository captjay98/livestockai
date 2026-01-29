# Requirements Document

## Introduction

This document specifies the requirements for redesigning the OpenLivestock onboarding flow. The current onboarding has critical bugs (modules not persisting to database, structure step not creating anything) and duplicates existing dialog components instead of reusing them. This redesign simplifies the flow from 8 steps to 7 steps, fixes data persistence issues, and eliminates code duplication by reusing existing `FarmDialog` and `BatchDialog` components.

## Glossary

- **Onboarding_System**: The multi-step wizard that guides new users through initial farm setup
- **Farm**: The top-level workspace entity containing batches and records
- **Module**: A livestock type feature (poultry, aquaculture, cattle, goats, sheep, bees) that can be enabled per farm
- **Batch**: A group of livestock acquired together and tracked as a unit
- **Structure**: A physical location on the farm (house, pen, pond, barn) where batches are housed
- **FarmDialog**: The existing reusable dialog component for creating/editing farms
- **BatchDialog**: The existing reusable dialog component for creating batches
- **farm_modules**: Database table storing which modules are enabled for each farm

## Requirements

### Requirement 1: Simplified Step Flow

**User Story:** As a new user, I want a streamlined onboarding experience, so that I can start managing my farm quickly without unnecessary steps.

#### Acceptance Criteria

1. THE Onboarding_System SHALL provide exactly 7 steps: Welcome, Create Farm + Modules, Create Structure (optional), Create Batch, Preferences, Tour, Complete
2. WHEN the user completes the Welcome step, THE Onboarding_System SHALL navigate to the Create Farm + Modules step
3. THE Onboarding_System SHALL combine farm creation and module selection into a single step
4. WHEN the user selects a farm type, THE Onboarding_System SHALL auto-select the corresponding default modules

### Requirement 2: Farm Creation with Module Persistence

**User Story:** As a new user, I want my farm and module selections to be saved to the database, so that my configuration persists across sessions.

#### Acceptance Criteria

1. WHEN a user creates a farm during onboarding, THE Onboarding_System SHALL call the existing `createFarmFn` server function
2. WHEN a farm is created, THE Onboarding_System SHALL persist enabled modules to the `farm_modules` database table
3. WHEN the user selects farm type "poultry", THE Onboarding_System SHALL enable the poultry module
4. WHEN the user selects farm type "aquaculture", THE Onboarding_System SHALL enable the aquaculture module
5. WHEN the user selects farm type "cattle", THE Onboarding_System SHALL enable the cattle module
6. WHEN the user selects farm type "goats", THE Onboarding_System SHALL enable the goats module
7. WHEN the user selects farm type "sheep", THE Onboarding_System SHALL enable the sheep module
8. WHEN the user selects farm type "bees", THE Onboarding_System SHALL enable the bees module
9. WHEN the user selects farm type "mixed", THE Onboarding_System SHALL enable both poultry and aquaculture modules
10. WHEN the user selects farm type "multi", THE Onboarding_System SHALL display a module selection UI for manual selection
11. IF module persistence fails, THEN THE Onboarding_System SHALL display an error message and allow retry

### Requirement 3: FarmDialog Component Reuse

**User Story:** As a developer, I want the onboarding to reuse the existing FarmDialog component, so that we maintain consistency and reduce code duplication.

#### Acceptance Criteria

1. THE FarmDialog component SHALL support all 8 farm types: poultry, aquaculture, cattle, goats, sheep, bees, mixed, multi
2. THE FarmDialog component SHALL accept an optional `onboardingMode` prop to customize behavior for onboarding context
3. WHEN `onboardingMode` is true, THE FarmDialog SHALL hide the cancel button and show a skip option instead
4. WHEN `onboardingMode` is true, THE FarmDialog SHALL call an `onSuccess` callback with the created farmId instead of navigating

### Requirement 4: Optional Structure Creation

**User Story:** As a new user, I want the option to create a structure or skip this step, so that I can proceed quickly if I don't need structures yet.

#### Acceptance Criteria

1. THE Onboarding_System SHALL make the Create Structure step optional
2. WHEN the user clicks "Skip", THE Onboarding_System SHALL proceed to the Create Batch step without creating a structure
3. WHEN the user creates a structure, THE Onboarding_System SHALL persist the structureId to the onboarding context
4. THE Create Structure step SHALL use a real form to create structures, not just display informational content

### Requirement 5: BatchDialog Component Reuse

**User Story:** As a developer, I want the onboarding to reuse the existing BatchDialog component, so that batch creation includes all required fields.

#### Acceptance Criteria

1. THE BatchDialog component SHALL accept an optional `onboardingMode` prop to customize behavior for onboarding context
2. WHEN `onboardingMode` is true, THE BatchDialog SHALL accept a `farmId` prop to pre-select the farm
3. WHEN `onboardingMode` is true, THE BatchDialog SHALL accept an optional `structureId` prop to pre-select the structure
4. WHEN `onboardingMode` is true, THE BatchDialog SHALL filter livestock types to only show types from enabled modules
5. WHEN `onboardingMode` is true, THE BatchDialog SHALL hide the cancel button and show a skip option instead
6. WHEN `onboardingMode` is true, THE BatchDialog SHALL call an `onSuccess` callback with the created batchId instead of navigating
7. THE BatchDialog SHALL include all required fields: livestockType, species, breed, sourceSize, initialQuantity, costPerUnit, acquisitionDate

### Requirement 6: Data Flow Between Steps

**User Story:** As a new user, I want my selections from previous steps to carry forward, so that I don't have to re-enter information.

#### Acceptance Criteria

1. WHEN a farm is created, THE Onboarding_System SHALL store the farmId in the onboarding context
2. WHEN a structure is created, THE Onboarding_System SHALL store the structureId in the onboarding context
3. WHEN creating a batch, THE Onboarding_System SHALL pass the stored farmId to the BatchDialog
4. WHEN creating a batch with a structure, THE Onboarding_System SHALL pass the stored structureId to the BatchDialog
5. THE Onboarding_System SHALL pass the list of enabled modules to the BatchDialog for filtering livestock types

### Requirement 7: Livestock Type Filtering

**User Story:** As a new user, I want to only see livestock types that match my enabled modules, so that I don't get confused by irrelevant options.

#### Acceptance Criteria

1. WHEN displaying livestock types in batch creation, THE Onboarding_System SHALL only show types from enabled modules
2. IF the poultry module is enabled, THEN THE Onboarding_System SHALL show the "Poultry" livestock type option
3. IF the aquaculture module is enabled, THEN THE Onboarding_System SHALL show the "Fish" livestock type option
4. IF the cattle module is enabled, THEN THE Onboarding_System SHALL show the "Cattle" livestock type option
5. IF the goats module is enabled, THEN THE Onboarding_System SHALL show the "Goats" livestock type option
6. IF the sheep module is enabled, THEN THE Onboarding_System SHALL show the "Sheep" livestock type option
7. IF the bees module is enabled, THEN THE Onboarding_System SHALL show the "Bees" livestock type option

### Requirement 8: Error Handling and Recovery

**User Story:** As a new user, I want clear error messages and recovery options, so that I can complete onboarding even if something goes wrong.

#### Acceptance Criteria

1. IF farm creation fails, THEN THE Onboarding_System SHALL display a user-friendly error message
2. IF module persistence fails, THEN THE Onboarding_System SHALL display a user-friendly error message and allow retry
3. IF batch creation fails, THEN THE Onboarding_System SHALL display a user-friendly error message
4. WHEN an error occurs, THE Onboarding_System SHALL allow the user to retry the operation
5. WHEN an error occurs, THE Onboarding_System SHALL allow the user to skip the current step

### Requirement 9: Onboarding Context State Management

**User Story:** As a developer, I want the onboarding context to properly track enabled modules, so that downstream steps can filter options correctly.

#### Acceptance Criteria

1. THE Onboarding_System SHALL store the list of enabled module keys in the onboarding context
2. WHEN modules are enabled during farm creation, THE Onboarding_System SHALL update the context with the enabled module keys
3. THE Onboarding_System SHALL persist the enabled modules list to localStorage along with other progress data
4. WHEN the onboarding is resumed, THE Onboarding_System SHALL restore the enabled modules list from localStorage
