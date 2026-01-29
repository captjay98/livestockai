# Implementation Plan: Reference Data Foundation

## Overview

This implementation plan converts the Reference Data Foundation design into actionable coding tasks. The approach prioritizes database schema changes first, then builds the data layer, followed by server functions, and finally UI updates. Testing tasks are integrated throughout to catch issues early.

## Codebase Context

**Files to UPDATE (not duplicate):**

- `app/lib/db/types.ts` - Add `BreedTable`, update `GrowthStandardTable` and `BatchTable`
- `app/lib/db/seeds/production.ts` - Import and call breed seeder
- `app/lib/errors/error-map.ts` - Add `BREED_NOT_FOUND` and `DUPLICATE_BREED` error codes (DONE)
- `app/features/batches/forecasting.ts` - Update to use breed-specific growth curves
- `app/components/dialogs/batch-dialog.tsx` - Add breed selection dropdown

**Files to CREATE:**

- `app/lib/db/migrations/2026-01-26-001-breeds-table.ts` - New migration
- `app/lib/db/seeds/breeds-data.ts` - Breed seed data
- `app/features/breeds/` - New feature module (types.ts, repository.ts, server.ts, index.ts)

**Key constraints:**

- Species keys in breeds table must use **Title Case** to match existing `growth_standards.species` values (verified: Broiler, Layer, Catfish, Tilapia, Cattle, Goat, Sheep)
- Source size values must use **lowercase** to match existing `SOURCE_SIZE_OPTIONS` values
- All server functions must use dynamic imports for Cloudflare Workers
- Use `CONCURRENTLY` for index creation in production migrations

## Tasks

- [ ] 1. Database schema and migration
  - [ ] 1.1 Create database migration for breeds table and schema updates
    - Create migration file `app/lib/db/migrations/2026-01-26-001-breeds-table.ts`
    - Add `breeds` table with all columns (id, module_key, species_key, breed_name, display_name, typical_market_weight_g, typical_days_to_market, typical_fcr, source_sizes, regions, is_default, is_active, created_at)
    - Add unique constraint on (module_key, species_key, breed_name)
    - Add indexes on module_key, species_key, and is_active (use CONCURRENTLY for production)
    - Add nullable `breed_id` column to `growth_standards` table with FK to breeds
    - Add nullable `breed_id` column to `batches` table with FK to breeds
    - Add indexes on new breed_id columns
    - Include rollback function (`down`) that drops columns and table in correct order
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 5.4, 7.1, 7.2_

  - [ ] 1.2 Update database types in `app/lib/db/types.ts`
    - Add `BreedTable` interface with all fields
    - Add `breeds` to Database interface
    - Update `GrowthStandardTable` to include optional `breedId`
    - Update `BatchTable` to include optional `breedId`
    - _Requirements: 1.1, 2.1, 5.4_

- [ ] 2. Checkpoint - Run migration and verify schema
  - Run `bun run db:migrate` and verify tables created correctly
  - Ensure existing batches and growth_standards records are preserved
  - Ensure all tests pass, ask the user if questions arise

- [ ] 3. Breeds feature module
  - [ ] 3.1 Create breeds types file `app/features/breeds/types.ts`
    - Define `Breed` interface for application use
    - Define `BreedSeedData` type for seeding
    - Define `ModuleKey` type if not already exported
    - _Requirements: 1.1_

  - [ ] 3.2 Create breeds repository `app/features/breeds/repository.ts`
    - Implement `getAllBreeds(db)` function
    - Implement `getBreedsByModule(db, moduleKey)` function
    - Implement `getBreedsBySpecies(db, speciesKey)` function
    - Implement `getBreedById(db, id)` function
    - Implement `getDefaultBreedForSpecies(db, speciesKey)` function
    - Implement `insertBreed(db, data)` function for seeding
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]\* 3.3 Write property test for breed repository
    - **Property 1: Breed data round-trip**
    - **Property 3: Breed query filtering**
    - **Validates: Requirements 1.1-1.6, 4.1, 4.2, 4.3**

  - [ ] 3.4 Create breeds server functions `app/features/breeds/server.ts`
    - Implement `getBreedsForModuleFn` with Zod validation
    - Implement `getBreedsForSpeciesFn` with Zod validation
    - Implement `getBreedByIdFn` with Zod validation
    - Use dynamic imports for database access
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ] 3.5 Create breeds feature index `app/features/breeds/index.ts`
    - Export all public types and server functions
    - _Requirements: 4.1_

- [ ] 4. Seed data for breeds
  - [ ] 4.1 Create breed seed data file `app/lib/db/seeds/breeds-data.ts`
    - Define POULTRY_BREEDS array (Cobb 500, Ross 308, Arbor Acres, Hy-Line Brown, Lohmann Brown)
    - Define AQUACULTURE_BREEDS array (Clarias gariepinus, Channel Catfish, Nile Tilapia, Red Tilapia)
    - Define CATTLE_BREEDS array (Angus, Hereford, Holstein, Jersey, White Fulani)
    - Define GOAT_BREEDS array (Boer, Kalahari Red, Saanen, West African Dwarf)
    - Define SHEEP_BREEDS array (Dorper, Suffolk, Merino, Yankasa)
    - Define BEE_BREEDS array (Apis mellifera, African Honey Bee)
    - Mark one breed per species as is_default=true
    - **CRITICAL: Use Title Case for speciesKey to match existing growth_standards.species values (e.g., 'Broiler' not 'broiler')**
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 4.2 Create breed-specific growth curves data
    - Define Cobb 500 growth curve (breed-specific)
    - Define Ross 308 growth curve (breed-specific)
    - Define Clarias gariepinus growth curve (breed-specific)
    - _Requirements: 2.4_

  - [ ] 4.3 Update production seeder `app/lib/db/seeds/production.ts`
    - Import breed seed data
    - Add breed seeding after growth standards
    - Add breed-specific growth standards seeding
    - Ensure idempotent (check if breeds exist before inserting)
    - _Requirements: 3.1-3.7, 2.4_

- [ ] 5. Checkpoint - Verify seed data
  - Run `bun run db:seed` and verify breeds are created
  - Verify breed-specific growth standards are created
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Update growth standards for breed support
  - [ ] 6.1 Add getGrowthStandards function to `app/features/batches/repository.ts`
    - Add new `getGrowthStandards(db, species, breedId?)` function
    - If breedId provided, query breed-specific standards first
    - If no breed-specific standards found (or no breedId), fall back to species-level (breedId IS NULL)
    - Return standards ordered by day ascending
    - See design.md "Growth Standards Repository Updates" section for full implementation
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ]\* 6.2 Write property test for growth standards breed priority
    - **Property 2: Growth standards breed priority**
    - **Validates: Requirements 2.2, 2.3, 2.5**

- [ ] 7. Update forecasting for breed awareness
  - [ ] 7.1 Update forecasting service `app/features/batches/forecasting.ts`
    - **DEPENDENCY**: Task 3 (breeds module) must be completed first for `getBreedById` import
    - **Line ~25**: Add `'breedId'` to the batch select query columns
    - **Lines 55-60**: Replace inline growth_standards query with `getGrowthStandards(db, batch.species, batch.breedId)` from repository
    - **Line ~109**: Replace hardcoded FCR (1.6) with breed-specific FCR lookup:
      - If batch.breedId exists, fetch breed and use breed.typicalFcr
      - Otherwise use default FCR (1.6)
    - Import `getGrowthStandards` from `./repository`
    - Import `getBreedById` from `~/features/breeds/repository` (after breeds module created)
    - See design.md "Forecasting Service Updates" section for complete code changes
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 7.2 Write property tests for forecasting
    - **Property 4: Forecasting growth curve selection**
    - **Property 5: Forecasting FCR usage**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 8. Checkpoint - Verify forecasting works
  - Test forecasting with existing batches (no breed_id)
  - Test forecasting with new batches (with breed_id)
  - Ensure all tests pass, ask the user if questions arise

- [ ] 9. Update batch creation
  - [ ] 9.1 Update batch server function `app/features/batches/server.ts`
    - Add `breedId` to createBatch input schema
    - Update createBatchFn to accept and store breed_id
    - Validate breed_id references valid breed if provided
    - _Requirements: 5.4, 5.5_

  - [ ]\* 9.2 Write property test for batch breed compatibility
    - **Property 6: Batch breed compatibility**
    - **Validates: Requirements 5.4, 5.5, 7.4**

  - [ ] 9.3 Update batch dialog `app/components/dialogs/batch-dialog.tsx`
    - Add state for breeds list and selected breed
    - Fetch breeds when species changes using getBreedsForSpeciesFn
    - Add breed selection dropdown after species selection
    - Update source size options based on selected breed's source_sizes
    - Pre-select default breed when available
    - Include breedId in form submission
    - Add loading state (skeleton) while fetching breeds
    - Add empty state: "No breeds available for this species"
    - Add error state with fallback to hardcoded SOURCE_SIZE_OPTIONS
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [ ] 10. Update constants for backward compatibility
  - [ ] 10.1 Update module constants `app/features/modules/constants.ts`
    - Keep existing speciesOptions as fallback
    - Add comment indicating these are fallbacks when database unavailable
    - _Requirements: 7.4_

- [ ] 11. Final checkpoint - Full integration test
  - Create a new batch with breed selection
  - Verify forecasting uses breed-specific growth curve
  - Verify existing batches without breed_id still work
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All server functions use dynamic imports for Cloudflare Workers compatibility
