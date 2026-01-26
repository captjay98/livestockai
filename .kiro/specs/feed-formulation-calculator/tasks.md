# Implementation Plan: Feed Formulation Calculator

## Overview

This implementation plan creates a feed formulation calculator using linear programming (HiGHS WASM) to optimize feed mixes for minimum cost while meeting nutritional requirements. The plan follows the three-layer architecture (Server → Service → Repository) and integrates with existing feed inventory.

## Tasks

- [ ] 1. Database schema and migrations
  - [ ] 1.1 Create migration for feed_ingredients table
    - Add columns: id, name, category, protein_percent, energy_kcal_kg, fat_percent, fiber_percent, calcium_percent, phosphorus_percent, lysine_percent, methionine_percent, max_inclusion_percent, is_active, created_at
    - Add unique constraint on name
    - Add indexes on category and is_active
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_
  - [ ] 1.2 Create migration for nutritional_requirements table
    - Add columns: id, species, production_stage, min_protein_percent, min_energy_kcal_kg, max_fiber_percent, min_calcium_percent, min_phosphorus_percent, min_lysine_percent, min_methionine_percent, created_at
    - Add unique constraint on (species, production_stage)
    - Add check constraint on production_stage enum
    - _Requirements: 2.1, 2.3, 2.4_
  - [ ] 1.3 Create migration for user_ingredient_prices table
    - Add columns: id, user_id, ingredient_id, price_per_kg, is_available, last_updated
    - Add foreign keys to users and feed_ingredients
    - Add unique constraint on (user_id, ingredient_id)
    - _Requirements: 3.1, 3.3_
  - [ ] 1.4 Create migration for ingredient_price_history table
    - Add columns: id, user_id, ingredient_id, price_per_kg, recorded_at
    - Add foreign keys to users and feed_ingredients
    - Add indexes for user_ingredient and date queries
    - _Requirements: 15.1, 15.3_
  - [ ] 1.5 Create migration for saved_formulations table
    - Add columns: id, user_id, name, species, production_stage, batch_size_kg, safety_margin_percent, ingredients (JSONB), total_cost_per_kg, nutritional_values (JSONB), mixing_notes, share_code, usage_count, created_at, updated_at
    - Add foreign key to users
    - Add unique constraint on share_code
    - _Requirements: 8.1, 8.2, 8.5, 9.3, 12.1, 16.1, 17.4_
  - [ ] 1.6 Create migration for formulation_usage table
    - Add columns: id, formulation_id, batch_id, used_at, notes
    - Add foreign keys to saved_formulations and batches
    - Add unique constraint on (formulation_id, batch_id)
    - _Requirements: 14.1, 14.2_
  - [ ] 1.7 Update database types in app/lib/db/types.ts
    - Add FeedIngredientTable, NutritionalRequirementTable, UserIngredientPriceTable, IngredientPriceHistoryTable, SavedFormulationTable, FormulationUsageTable interfaces
    - Add tables to Database interface (follow existing pattern with JSDoc comments)
    - Use `Generated<string>` for UUID id fields, `Generated<Date>` for timestamps
    - Use `string` type for DECIMAL columns (PostgreSQL returns strings for precision)
    - _Requirements: 1.1, 2.1, 3.1, 8.1, 14.1, 15.1_

- [ ] 1.8 Add new error codes to app/lib/errors/error-map.ts
  - Add INGREDIENT_NOT_FOUND (40420), REQUIREMENTS_NOT_FOUND (40421), FORMULATION_NOT_FOUND (40422)
  - Add SOLVER_TIMEOUT (50002), SOLVER_UNAVAILABLE (50003), NO_PRICED_INGREDIENTS (40003)
  - Follow existing pattern with code, httpStatus, category, message
  - _Requirements: 4.6, 10.5_

- [ ] 2. Seed reference data
  - [ ] 2.1 Create seed file for feed ingredients (app/lib/db/seeds/feed-ingredients.ts)
    - Seed 30-40 common ingredients across all categories (grain, protein, mineral, vitamin, additive)
    - Include nutritional profiles from industry standards (NRC, Feedipedia)
    - Set appropriate max_inclusion_percent for each ingredient (e.g., maize 70%, fish meal 15%)
    - Follow existing seed pattern from app/lib/db/seeds/
    - _Requirements: 1.5_
  - [ ] 2.2 Create seed file for nutritional requirements (app/lib/db/seeds/nutritional-requirements.ts)
    - Seed requirements for all 10 species using **Title Case** to match growth_standards.species:
      - Poultry: `Broiler`, `Layer`, `Turkey`
      - Aquaculture: `Catfish`, `Tilapia`
      - Ruminants: `Beef_Cattle`, `Dairy_Cattle`, `Meat_Goat`, `Dairy_Goat`, `Meat_Sheep`
    - Seed requirements for applicable production stages per species
    - Use industry-standard nutritional values (NRC recommendations)
    - _Requirements: 2.2, 2.3, 2.5_

- [ ] 3. Checkpoint - Database setup complete
  - Run migrations and verify tables created
  - Run seeds and verify data populated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Repository layer implementation
  - [ ] 4.1 Create ingredient repository (app/features/formulation/ingredient-repository.ts)
    - Implement getAllIngredients(db): returns active ingredients ordered by category, name
    - Implement getIngredientsByCategory(db, category): filter by category
    - Implement getIngredientById(db, id): single ingredient lookup
    - Accept `Kysely<Database>` as first parameter (passed from server layer)
    - _Requirements: 1.1, 1.4_
  - [ ]\* 4.2 Write property test for ingredient repository (tests/features/formulation/ingredients.property.test.ts)
    - **Property 1: Ingredient Data Round-Trip**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.6**
  - [ ] 4.3 Create nutritional requirements repository (app/features/formulation/requirements-repository.ts)
    - Implement getRequirements(db, species, stage): returns single requirement or undefined
    - Implement getAllRequirements(db): returns all requirements
    - Implement getSpeciesList(db): returns distinct species for dropdown
    - Implement getStagesForSpecies(db, species): returns applicable stages
    - _Requirements: 2.1, 2.6_
  - [ ]\* 4.4 Write property test for requirements repository (tests/features/formulation/requirements.property.test.ts)
    - **Property 4: Requirements Data Round-Trip**
    - **Property 5: Requirements Query Completeness**
    - **Validates: Requirements 2.1, 2.4, 2.6**
  - [ ] 4.5 Create user prices repository (app/features/formulation/price-repository.ts)
    - Implement getUserPrices(db, userId): returns all prices for user
    - Implement upsertUserPrice(db, userId, ingredientId, pricePerKg): insert or update
    - Implement setIngredientAvailability(db, userId, ingredientId, isAvailable): toggle availability
    - Use Kysely's onConflict for upsert (see design.md Repository Layer Pattern)
    - _Requirements: 3.1, 3.2, 3.5_
  - [ ]\* 4.6 Write property test for user prices repository (tests/features/formulation/prices.property.test.ts)
    - **Property 6: User Prices Round-Trip**
    - **Property 7: User Prices Upsert Behavior**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [ ] 4.7 Create formulation repository (app/features/formulation/formulation-repository.ts)
    - Implement saveFormulation(db, formulation): insert and return id
    - Implement getUserFormulations(db, userId): list user's formulations
    - Implement getFormulationById(db, id): single formulation lookup
    - Implement getFormulationByShareCode(db, code): lookup by share code
    - Implement deleteFormulation(db, id): hard delete
    - Implement generateShareCode(): create unique 8-char alphanumeric code
    - _Requirements: 8.1, 8.3, 8.6, 9.3, 9.4_
  - [ ]\* 4.8 Write property test for formulation repository (tests/features/formulation/formulation.property.test.ts)
    - **Property 16: Saved Formulation Round-Trip**
    - **Property 17: Saved Formulations List**
    - **Property 18: Formulation Deletion**
    - **Property 19: Share Code Round-Trip**
    - **Validates: Requirements 8.1, 8.3, 8.6, 9.3, 9.4**

- [ ] 5. Checkpoint - Repository layer complete
  - Ensure all repository tests pass
  - Verify CRUD operations work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Service layer implementation
  - [ ] 6.1 Create nutrition calculator service (app/features/formulation/nutrition-service.ts)
    - Implement calculateNutritionalValues function
    - Calculate weighted averages of nutrients based on ingredient quantities
    - _Requirements: 5.5_
  - [ ] 6.2 Create HiGHS WASM integration (app/features/formulation/highs-solver.ts)
    - Set up lazy loading of HiGHS WASM bundle
    - Create wrapper functions for LP model creation and solving
    - Handle solver initialization and cleanup
    - _Requirements: 4.1, 10.6_
  - [ ] 6.3 Create optimization service (app/features/formulation/optimization-service.ts)
    - Implement buildLPModel function to create constraint matrix
    - Implement runOptimization function to execute solver
    - Implement parseOptimizationResult to extract ingredient quantities
    - Implement generateInfeasibilityReport for failed optimizations
    - _Requirements: 4.2, 4.3, 4.4, 4.6_
  - [ ] 6.4 Implement safety margin support in optimization
    - Apply safety margin percentage to minimum requirements
    - Store both base and effective requirements in results
    - _Requirements: 16.2, 16.3_
  - [ ] 6.5 Implement batch size scaling
    - Scale ingredient quantities to selected batch size
    - Maintain cost per kg calculation
    - _Requirements: 12.2, 12.3, 12.4_
  - [ ] 6.6 Implement ingredient substitution suggestions
    - Analyze infeasible constraints
    - Suggest ingredients that could satisfy violated constraints
    - Implement "Relax Constraints" option (reduce minimums by 5%)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [ ]\* 6.7 Write property tests for optimization service
    - **Property 9: Optimization Constraint Satisfaction**
    - **Property 10: Optimization Max Inclusion Limits**
    - **Property 11: Optimization Total Sum Constraint**
    - **Property 12: Infeasibility Report Generation**
    - **Property 20: Batch Size Scaling**
    - **Property 21: Safety Margin Application**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 12.2, 16.2**
  - [ ] 6.8 Create comparison service (app/features/formulation/comparison-service.ts)
    - Implement compareFormulations function
    - Calculate cost differences and nutritional differences
    - _Requirements: 7.2, 7.3_
  - [ ]\* 6.9 Write property test for comparison service
    - **Property 15: Formulation Comparison Calculation**
    - **Validates: Requirements 7.2, 7.3**
  - [ ] 6.10 Create price history service (app/features/formulation/price-history-service.ts)
    - Implement recordPriceChange function
    - Implement getPriceHistory function (last 90 days)
    - Calculate price trend indicators (up, down, stable)
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  - [ ]\* 6.11 Write property test for price history
    - **Property 22: Price History Recording**
    - **Validates: Requirements 15.1**
  - [ ] 6.12 Create mixing instructions service (app/features/formulation/mixing-service.ts)
    - Generate mixing order based on ingredient categories
    - Provide general mixing tips
    - _Requirements: 17.1, 17.2, 17.3_

- [ ] 7. Checkpoint - Service layer complete
  - Ensure all service tests pass
  - Verify optimization produces valid results
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Server functions implementation
  - [ ] 8.1 Create ingredient server functions (app/features/formulation/server.ts)
    - Implement getIngredientsWithPricesFn - returns ingredients with user prices and inventory levels
    - Use `const { getDb } = await import('~/lib/db'); const db = await getDb()` pattern
    - Use `const { requireAuth } = await import('~/features/auth/server-middleware')` for auth
    - Combine data from feed_inventory table for stock levels
    - _Requirements: 3.4, 6.1, 10.1_
  - [ ] 8.2 Create requirements server functions
    - Implement getRequirementsFn - returns requirements for species/stage
    - Implement getAvailableSpeciesFn - returns list of supported species (Title Case)
    - Implement getStagesForSpeciesFn - returns applicable stages for selected species
    - _Requirements: 2.6, 10.1_
  - [ ] 8.3 Create price management server functions
    - Implement updateIngredientPriceFn - upserts user price, records price history
    - Implement setIngredientAvailabilityFn - marks ingredient available/unavailable
    - Implement bulkUpdatePricesFn - batch update from CSV import
    - _Requirements: 3.2, 3.5, 10.1, 15.1_
  - [ ] 8.4 Create optimization server functions
    - Implement runOptimizationFn - executes optimization with user's prices
    - Handle inventory limit option (useInventoryLimits: boolean)
    - Handle ingredient exclusion option (excludeIngredients: string[])
    - Handle safety margin option (safetyMarginPercent: number)
    - Handle batch size option (batchSizeKg: number)
    - Use AppError for infeasibility reporting
    - _Requirements: 4.2, 6.4, 6.5, 10.1, 12.2, 16.2_
  - [ ]\* 8.5 Write property test for unavailable ingredients exclusion (tests/features/formulation/optimization.property.test.ts)
    - **Property 8: Unavailable Ingredients Exclusion**
    - **Validates: Requirements 3.5, 3.6**
  - [ ]\* 8.6 Write property test for inventory limit enforcement
    - **Property 14: Inventory Limit Enforcement**
    - **Validates: Requirements 6.4**
  - [ ] 8.7 Create formulation management server functions
    - Implement saveFormulationFn - saves formulation with custom name
    - Implement getUserFormulationsFn - returns user's saved formulations
    - Implement deleteFormulationFn - deletes a saved formulation
    - Implement generateShareCodeFn - creates shareable code
    - Implement loadSharedFormulationFn - loads formulation by share code
    - Implement rerunFormulationFn - re-runs optimization with current prices
    - _Requirements: 8.1, 8.3, 8.4, 8.6, 9.3, 9.4, 10.1_

- [ ] 9. Checkpoint - Server layer complete
  - Ensure all server function tests pass
  - Verify authentication and authorization work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. UI components implementation
  - [ ] 10.1 Create formulation page route (app/routes/\_auth/formulation/index.tsx)
    - Set up route with loader for initial data (follow TanStack Router loader pattern)
    - Fetch ingredients, requirements, and user prices in loader
    - Create pendingComponent using skeleton pattern
    - _Requirements: 5.1, 5.2_
  - [ ] 10.2 Create species/stage selector component (app/components/formulation/species-selector.tsx)
    - Dropdown for species selection (use existing Select from ~/components/ui/select)
    - Dropdown for production stage selection (filtered by species)
    - Auto-load requirements when selection changes
    - 48px+ touch targets per UI standards
    - _Requirements: 5.1_
  - [ ] 10.3 Create batch size selector component (app/components/formulation/batch-size-selector.tsx)
    - Dropdown for batch sizes: 25kg, 50kg, 100kg, 250kg, 500kg, 1000kg, custom
    - Custom input field for arbitrary batch sizes (use Input from ~/components/ui/input)
    - _Requirements: 12.1_
  - [ ] 10.4 Create safety margin selector component (app/components/formulation/safety-margin-selector.tsx)
    - Dropdown for safety margins: 0%, 2%, 5%, 10%
    - Display explanation tooltip of safety margin purpose
    - _Requirements: 16.1, 16.4_
  - [ ] 10.5 Create ingredient price editor component (app/components/formulation/ingredient-price-editor.tsx)
    - Display ingredients in a table grouped by categories (use Table from ~/components/ui/table)
    - Inline price editing with validation
    - Show availability toggle (use Switch from ~/components/ui/switch)
    - Show current inventory levels from feed_inventory
    - Highlight low/out of stock ingredients (amber/red colors per UI standards)
    - Show price trend indicators (up/down/stable arrows)
    - Display currency using `useFormatCurrency()` hook
    - _Requirements: 5.2, 5.3, 6.1, 6.2, 11.1, 11.5, 15.2_
  - [ ] 10.6 Create optimization results component (app/components/formulation/optimization-results.tsx)
    - Display ingredient quantities scaled to batch size
    - Display total batch cost and cost per kg using `useFormatCurrency()`
    - Display nutritional breakdown with comparison to requirements (including safety margin)
    - Show commercial feed price comparison
    - Use Card components from ~/components/ui/card
    - _Requirements: 5.5, 5.7, 12.3, 16.3_
  - [ ] 10.7 Create infeasibility report component (app/components/formulation/infeasibility-report.tsx)
    - Display which constraints could not be satisfied
    - Show suggestions for ingredient substitutions
    - Provide "Relax Constraints" button (use Button from ~/components/ui/button)
    - Use Alert component for warning display
    - _Requirements: 5.6, 13.2, 13.3, 13.5_
  - [ ] 10.8 Wire up optimization flow
    - Connect "Run Optimization" button to server function
    - Handle loading states (use existing loading patterns)
    - Display results or infeasibility report
    - Use toast notifications for success/error (use existing toast pattern)
    - _Requirements: 5.4, 5.5, 5.6_

- [ ] 11. Checkpoint - Basic formulation UI complete
  - Test end-to-end formulation flow
  - Verify UI follows "Rugged Utility" design standards
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Saved formulations feature
  - [ ] 12.1 Create save formulation dialog
    - Form for entering formulation name
    - Save button triggers saveFormulationFn
    - _Requirements: 8.1_
  - [ ] 12.2 Create saved formulations list page (app/routes/\_auth/formulation/saved.tsx)
    - Display list of user's saved formulations
    - Show name, species, stage, cost, date
    - Actions: view, re-run, delete
    - _Requirements: 8.3, 8.4, 8.6_
  - [ ] 12.3 Create formulation detail view
    - Display full formulation details
    - Option to re-run with current prices
    - _Requirements: 8.4_

- [ ] 13. Comparison feature
  - [ ] 13.1 Create comparison page (app/routes/\_auth/formulation/compare.tsx)
    - Allow selection of 2-3 formulations
    - Display side-by-side comparison
    - _Requirements: 7.1_
  - [ ] 13.2 Create comparison table component
    - Show cost differences
    - Show nutritional differences
    - Highlight most cost-effective option
    - Show ingredient differences
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 14. Export and share feature
  - [ ] 14.1 Create PDF export functionality
    - Generate PDF with ingredient list, quantities, cost breakdown
    - Include formulation name, species, stage, date
    - Include nutritional analysis
    - _Requirements: 9.1, 9.2_
  - [ ] 14.2 Create share functionality
    - Generate share code button
    - Display shareable link/code
    - _Requirements: 9.3_
  - [ ] 14.3 Create shared formulation view
    - Load formulation by share code
    - Display read-only view
    - Option to save a copy
    - _Requirements: 9.4, 9.5_

- [ ] 15. Final checkpoint - Feature complete
  - Run full test suite
  - Verify all requirements are met
  - Test on mobile devices for touch targets
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Formulation usage tracking
  - [ ] 16.1 Create formulation usage repository
    - Implement linkFormulationToBatch, unlinkFormulationFromBatch
    - Implement getFormulationUsage, getBatchFormulation
    - Update usage_count on link/unlink
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  - [ ]\* 16.2 Write property test for usage tracking
    - **Property 23: Formulation Usage Tracking**
    - **Validates: Requirements 14.4**
  - [ ] 16.3 Add formulation link to batch detail page
    - Display linked formulation if any
    - Allow linking/unlinking formulations
    - _Requirements: 14.2_
  - [ ] 16.4 Add usage history to formulation detail
    - Display which batches have used this formulation
    - Show FCR and growth performance for completed batches
    - _Requirements: 14.3, 14.5_

- [ ] 17. Price history feature
  - [ ] 17.1 Create price history repository
    - Implement recordPriceHistory (called on price update)
    - Implement getPriceHistory (last 90 days)
    - _Requirements: 15.1, 15.3_
  - [ ] 17.2 Create price history chart component
    - Display price trends over time
    - Show percentage change from previous price
    - _Requirements: 15.4, 15.5_
  - [ ] 17.3 Add price trend indicators to ingredient list
    - Show up/down/stable arrows based on recent changes
    - _Requirements: 15.2_

- [ ] 18. Mobile-optimized price entry
  - [ ] 18.1 Create quick price entry page (app/routes/\_auth/formulation/prices.tsx)
    - Simple list view with large input fields
    - Category filtering
    - 48px+ touch targets
    - _Requirements: 18.1, 18.2, 18.5_
  - [ ] 18.2 Add batch price import
    - CSV upload for bulk price updates
    - Validation and error reporting
    - _Requirements: 18.4_

- [ ] 19. Mixing instructions feature
  - [ ] 19.1 Add mixing notes to save formulation dialog
    - Text area for custom mixing notes
    - _Requirements: 17.4_
  - [ ] 19.2 Update PDF export with mixing instructions
    - Include recommended mixing order by category
    - Include general mixing tips
    - Include custom mixing notes if provided
    - _Requirements: 17.1, 17.2, 17.3, 17.5_

- [ ] 20. Final checkpoint - All enhancements complete
  - Run full test suite including new features
  - Verify multi-currency display works correctly
  - Test batch size scaling
  - Test safety margin application
  - Verify price history tracking
  - Test formulation-batch linking
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- HiGHS WASM bundle (~2MB) should be loaded lazily to minimize initial page load
- All server functions use dynamic imports for Cloudflare Workers compatibility
- Follow existing patterns from feed feature (app/features/feed/) for consistency
- Use existing UI components from app/components/ui/ where possible
- Ensure all touch targets are 48px+ per UI standards
- Currency formatting uses existing useFormatCurrency hook from settings feature
- Price history is append-only for audit purposes

## Codebase Integration Checklist

### Database Types (app/lib/db/types.ts)

- [ ] Add `feed_ingredients` to Database interface
- [ ] Add `nutritional_requirements` to Database interface
- [ ] Add `user_ingredient_prices` to Database interface
- [ ] Add `ingredient_price_history` to Database interface
- [ ] Add `saved_formulations` to Database interface
- [ ] Add `formulation_usage` to Database interface

### Error Codes (app/lib/errors/error-map.ts)

Add these new error codes:

- `INGREDIENT_NOT_FOUND` (40420) - Feed ingredient not found
- `REQUIREMENTS_NOT_FOUND` (40421) - Nutritional requirements not found
- `FORMULATION_NOT_FOUND` (40422) - Saved formulation not found
- `SOLVER_TIMEOUT` (50002) - Optimization took too long
- `SOLVER_UNAVAILABLE` (50003) - HiGHS WASM failed to load
- `NO_PRICED_INGREDIENTS` (40003) - No ingredients have prices set

### Species Names (Must Match growth_standards.species)

Use Title Case for all species in nutritional_requirements:

- Poultry: `Broiler`, `Layer`, `Turkey`
- Aquaculture: `Catfish`, `Tilapia`
- Ruminants: `Beef_Cattle`, `Dairy_Cattle`, `Meat_Goat`, `Dairy_Goat`, `Meat_Sheep`

### Required Imports Pattern

```typescript
// Server functions MUST use this pattern for Cloudflare Workers:
const { getDb } = await import('~/lib/db')
const db = await getDb()

// Auth middleware:
const { requireAuth } = await import('~/features/auth/server-middleware')
const session = await requireAuth()

// Farm access verification:
const { verifyFarmAccess } = await import('~/features/auth/utils')
await verifyFarmAccess(userId, farmId)

// Error handling:
import { AppError } from '~/lib/errors'
```

### Currency Display Pattern

```typescript
// In all UI components displaying prices:
import { useFormatCurrency } from '~/features/settings'

const { format, symbol } = useFormatCurrency()
// Use format(amount) for display
// Use symbol for input field labels
```

### Feed Inventory Integration

The `feed_inventory` table already exists with these feedTypes:

- starter, grower, finisher, layer_mash, fish_feed
- cattle_feed, goat_feed, sheep_feed, hay, silage, bee_feed

Map ingredient categories to feedTypes for stock level display.
