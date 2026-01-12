# Implementation Plan: Feature Modules System

## Overview

This implementation plan breaks down the Feature Modules System into discrete coding tasks. The approach is:

1. Database schema changes first (foundation)
2. Type definitions and constants (shared code)
3. Server functions (business logic)
4. UI components (user-facing features)
5. Integration and testing

## Tasks

- [x] 1. Database schema updates ✅
  - [x] 1.1 Add farm_modules table to migration
    - Add table creation with id, farmId, moduleKey, enabled, createdAt
    - Add unique constraint on (farmId, moduleKey)
    - Add check constraint for valid moduleKey values
    - Add index on farmId
    - _Requirements: 1.1, 1.4_

  - [x] 1.2 Expand enum constraints in migration
    - Update farms.type constraint to include: cattle, goats, sheep, bees, multi
    - Update batches.livestockType constraint to include: cattle, goats, sheep, bees
    - Update sales.livestockType constraint to include: cattle, goats, sheep, honey, milk, wool
    - Update structures.type constraint to include: barn, pasture, hive, milking_parlor, shearing_shed
    - Update feed_records.feedType and feed_inventory.feedType constraints
    - Update suppliers.supplierType constraint
    - Update expenses.category constraint
    - _Requirements: 4.1, 6.1, 7.1_

  - [x] 1.3 Update TypeScript types in types.ts
    - Add FarmModuleTable interface
    - Add farm_modules to Database interface
    - Expand FarmTable.type union
    - Expand BatchTable.livestockType union
    - Expand SaleTable.livestockType union
    - Expand StructureTable.type union
    - Expand FeedTable.feedType union
    - Expand FeedInventoryTable.feedType union
    - Expand SupplierTable.supplierType union
    - Expand ExpenseTable.category union
    - Add missing GrowthStandardTable and MarketPriceTable interfaces
    - _Requirements: 1.1, 4.1, 6.1, 7.1_

- [x] 2. Module types and constants
  - [x] 2.1 Create module types file
    - Create app/lib/modules/types.ts
    - Define ModuleKey type
    - Define LivestockType type
    - Define ProductType type
    - Define StructureType type
    - Define FeedType type
    - Define ModuleMetadata interface
    - Define FarmModule interface
    - Define ModuleContextState interface
    - _Requirements: 9.2_

  - [x] 2.2 Create module constants file
    - Create app/lib/modules/constants.ts
    - Define MODULE_METADATA with all 6 modules (poultry, aquaculture, cattle, goats, sheep, bees)
    - Include speciesOptions, sourceSizeOptions, feedTypes, structureTypes for each
    - Define DEFAULT_MODULES_BY_FARM_TYPE mapping
    - Define CORE_NAVIGATION array
    - Define MODULE_NAVIGATION mapping
    - _Requirements: 5.1-5.6, 9.1, 9.2_

  - [x] 2.3 Create module helper functions
    - Implement getEnabledModuleMetadata()
    - Implement getSpeciesForModules()
    - Implement getLivestockTypesForModules()
    - Implement getFeedTypesForModules()
    - Implement getStructureTypesForModules()
    - _Requirements: 9.4_

  - [x] 2.4 Write property tests for module constants
    - **Property 5: Module Metadata Completeness**
    - **Property 8: Species Options Appropriate Per Livestock Type**
    - **Property 9: Source Size Options Appropriate Per Livestock Type**
    - **Property 10: Feed Types Filtered By Livestock Type**
    - **Property 12: Helper Functions Filter By Enabled Modules**
    - **Validates: Requirements 2.5, 4.3, 4.4, 7.2, 9.2, 9.4**

- [x] 3. Module server functions
  - [x] 3.1 Create module server file
    - Create app/lib/modules/server.ts
    - Implement getFarmModules() - get all modules for a farm
    - Implement getEnabledModules() - get enabled module keys
    - Implement createDefaultModules() - create defaults on farm creation
    - Implement toggleModule() - enable/disable a module
    - Implement canDisableModule() - check for active batches
    - _Requirements: 1.2, 1.3, 2.4_

  - [x] 3.2 Create server function exports
    - Export getFarmModulesFn with auth
    - Export toggleModuleFn with auth and validation
    - Export canDisableModuleFn with auth
    - _Requirements: 2.2, 2.3_

  - [x] 3.3 Write property tests for module server functions
    - **Property 1: Module Persistence Round-Trip** (tested via business logic)
    - **Property 2: Default Modules Match Farm Type**
    - **Property 4: Active Batches Prevent Module Disable** (tested via business logic)
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.4**

- [x] 4. Checkpoint - Verify database and server layer
  - Ensure all tests pass, ask the user if questions arise.
  - Run migrations to verify schema changes work
  - Test server functions manually

- [x] 5. Update existing batch constants ✅
  - [x] 5.1 Update batches/constants.ts
    - Expand getSpeciesOptions() to handle all livestock types
    - Import from modules/constants.ts for species data
    - _Requirements: 4.3_

  - [x] 5.2 Update batches/server.ts
    - Expand SOURCE_SIZE_OPTIONS to include all livestock types
    - Import from modules/constants.ts for source size data
    - _Requirements: 4.4_

- [x] 6. Module context and hooks ✅
  - [x] 6.1 Create module context
    - Create app/components/module-context.tsx
    - Create ModuleContext with enabledModules state
    - Create ModuleProvider component
    - Implement useModules() hook
    - Load modules on farm selection change
    - _Requirements: 3.1_

  - [x] 6.2 Create useModuleNavigation hook
    - Create hook to filter navigation by enabled modules
    - Combine CORE_NAVIGATION with module-specific items
    - Return filtered navigation array
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Update navigation component ✅
  - [x] 7.1 Make navigation dynamic ✅
    - Update app/components/navigation.tsx
    - Use useModuleNavigation hook
    - Filter navigation items based on enabled modules
    - Keep core items always visible
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Write property tests for navigation filtering ✅
    - **Property 3: Module Toggle Affects Feature Visibility**
    - **Property 6: Core Navigation Always Visible**
    - **Validates: Requirements 2.2, 2.3, 3.1, 3.2, 3.3**
    - **Test Results**: 8/8 passing (7,757 assertions)

- [x] 8. Update dashboard ✅
  - [x] 8.1 Make dashboard inventory cards dynamic ✅
    - Update app/routes/\_auth.dashboard.tsx
    - Use useModules() hook
    - Conditionally render inventory cards based on enabled modules
    - Add icons for new livestock types (cattle, goats, sheep, bees)
    - _Requirements: 8.1, 8.3_

  - [x] 8.2 Write property tests for dashboard rendering ✅
    - **Property 11: Dashboard Renders Only Enabled Module Cards**
    - **Validates: Requirements 8.1, 8.3**
    - **Test Results**: 8/8 passing (2,555 assertions)

- [x] 9. Update batch creation form ✅
  - [x] 9.1 Make batch form dynamic ✅
    - Update app/routes/\_auth.batches.new.tsx
    - Use useModules() hook
    - Filter livestock type dropdown by enabled modules
    - Update species options based on selected livestock type
    - Update source size options based on selected livestock type
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 9.2 Write property tests for batch form filtering ✅
    - **Property 7: Batch Creation Shows Only Enabled Livestock Types**
    - **Validates: Requirements 4.2**
    - **Test Results**: 8/8 passing (6,689 assertions)

- [x] 10. Module settings UI ✅
  - [x] 10.1 Create module settings component ✅
    - Create app/components/module-selector.tsx
    - Display all available modules with toggle switches
    - Show module name, description, and icon
    - Handle enable/disable with confirmation for disable
    - Show warning when trying to disable module with active batches
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 10.2 Add module settings to farm settings page ✅
    - Update or create app/routes/\_auth.settings.modules.tsx
    - Integrate ModuleSelector component
    - Add navigation link to module settings
    - _Requirements: 2.1_

- [x] 11. Update farm creation flow ✅
  - [x] 11.1 Create default modules on farm creation ✅
    - Update farm creation server function
    - Call createDefaultModules() after farm is created
    - Pass farm type to determine default modules
    - _Requirements: 1.2_

  - [ ] 11.2 Add module selection to farm creation form (optional)
    - Allow users to select initial modules during farm creation
    - Pre-select defaults based on farm type
    - _Requirements: 1.2_

- [x] 12. Final checkpoint - Integration testing ✅
  - Ensure all tests pass, ask the user if questions arise.
  - Test full flow: create farm → enable modules → create batch
  - Test module disable prevention with active batches
  - Test navigation filtering with various module combinations
  - Verify dashboard renders correctly for different module sets
  - **Test Results**: 40/40 passing (28,269 assertions)
  - **All property-based tests passing with 100 iterations each**

## Notes

- All tasks including property-based tests are required
- Each task references specific requirements for traceability
- Database changes are made to the existing migration file (not a new migration)
- All server functions use dynamic imports for Cloudflare Workers compatibility
- Property tests use fast-check with minimum 100 iterations
