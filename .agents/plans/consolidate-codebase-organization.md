# Feature: Consolidate Codebase Organization

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Consolidate scattered constants, types, and components into a consistent, predictable structure. Currently:

- Constants are scattered across `constants.ts`, `server.ts`, and other files
- Types are duplicated and scattered across `types.ts`, `server.ts`, and utility files
- Components at root level should be in subdirectories
- Feature directories have inconsistent internal structure

## User Story

As a developer
I want a consistent, predictable codebase structure
So that I can quickly find and modify code without hunting through multiple files

## Problem Statement

The codebase has grown organically, resulting in:

1. **Scattered constants**: Some in `constants.ts`, others inline in `server.ts` files
2. **Duplicated types**: `FeedType` in both `modules/types.ts` and `feed/constants.ts`; `FarmRole` in both `db/types.ts` and `auth/utils.ts`
3. **Inconsistent feature structure**: Some features have `types.ts`, others don't; some have `constants.ts`, others embed constants in `server.ts`
4. **Component organization**: Root-level components that should be in subdirectories
5. **Settings feature bloat**: Has `formatters/` subdirectory with duplicate currency logic

## Solution Statement

1. Standardize feature directory structure with consistent file patterns
2. Consolidate all constants into dedicated `constants.ts` files per feature
3. Consolidate all types into dedicated `types.ts` files per feature
4. Move root-level components to appropriate subdirectories
5. Clean up settings feature structure

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: All features, components
**Dependencies**: None (internal refactor)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

**Constants scattered in server.ts files:**

- `app/features/sales/server.ts` (lines 3-25) - `UNIT_TYPES`, `PAYMENT_STATUSES`, `PAYMENT_METHODS`
- `app/features/structures/server.ts` (lines 3-20) - `STRUCTURE_TYPES`, `STRUCTURE_STATUSES`
- `app/features/batches/server.ts` (lines 25-32) - `SOURCE_SIZE_OPTIONS`
- `app/features/inventory/medication-server.ts` - `MEDICATION_UNITS`
- `app/features/inventory/feed-server.ts` - `FEED_TYPES` (duplicate)

**Existing constants.ts files (good patterns):**

- `app/features/modules/constants.ts` - Comprehensive module metadata
- `app/features/expenses/constants.ts` - `EXPENSE_CATEGORIES` with type inference
- `app/features/feed/constants.ts` - `FEED_TYPES` with `as const` pattern

**Types scattered in server.ts files:**

- `app/features/batches/server.ts` (lines 34-65) - `CreateBatchData`, `UpdateBatchData`
- `app/features/customers/server.ts` (lines 3-25) - `CreateCustomerInput`, `PaginatedQuery`, `PaginatedResult`
- `app/features/reports/server.ts` (lines 3-80) - Report interfaces

**Existing types.ts files:**

- `app/lib/db/types.ts` - Database schema types (keep as-is)
- `app/features/modules/types.ts` - Module system types
- `app/features/auth/types.ts` - Auth types (needs expansion)
- `app/features/onboarding/types.ts` - Onboarding types

**Components at root level (need moving):**

- `app/components/theme-provider.tsx` → `app/components/providers/`
- `app/components/theme-toggle.tsx` → `app/components/ui/`
- `app/components/logo.tsx` → `app/components/ui/`
- `app/components/pwa-prompt.tsx` → `app/components/ui/`
- `app/components/offline-indicator.tsx` → `app/components/ui/`

**Settings feature structure (needs cleanup):**

- `app/features/settings/formatters/currency.ts` - Duplicate of `currency-formatter.ts`
- `app/features/settings/currency-formatter.ts` - Keep this one
- `app/features/settings/currency-presets.ts` - Contains types that should be in types.ts

### New Files to Create

**Feature types.ts files:**

- `app/features/sales/types.ts`
- `app/features/structures/types.ts`
- `app/features/batches/types.ts`
- `app/features/customers/types.ts`
- `app/features/suppliers/types.ts`
- `app/features/expenses/types.ts`
- `app/features/feed/types.ts`
- `app/features/eggs/types.ts`
- `app/features/invoices/types.ts`
- `app/features/vaccinations/types.ts`
- `app/features/weight/types.ts`
- `app/features/water-quality/types.ts`
- `app/features/mortality/types.ts`
- `app/features/reports/types.ts`
- `app/features/inventory/types.ts`

**Feature constants.ts files:**

- `app/features/sales/constants.ts`
- `app/features/structures/constants.ts`
- `app/features/inventory/constants.ts`

**Component directories:**

- `app/components/providers/`

### Patterns to Follow

**Constants Pattern (from expenses/constants.ts):**

```typescript
export const EXPENSE_CATEGORIES = [
  'feed',
  'medicine',
  // ...
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
```

**Types Pattern (from modules/types.ts):**

```typescript
export interface CreateBatchData {
  farmId: string
  batchName: string
  // ...
}

export interface PaginatedQuery {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
```

**Server.ts Pattern (clean - only server functions):**

```typescript
import type { CreateBatchData } from './types'
import { BATCH_STATUSES } from './constants'

export const createBatchFn = createServerFn({ method: 'POST' })
  .validator(schema)
  .handler(async ({ data }) => {
    // ...
  })
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Shared Types

Extract common pagination types used across multiple features into a shared location.

**Tasks:**

- Create shared pagination types in `app/lib/types.ts`
- Update features to import from shared location

### Phase 2: Consolidate Feature Constants

Move constants from server.ts files to dedicated constants.ts files.

**Tasks:**

- Create `sales/constants.ts` with sales-related constants
- Create `structures/constants.ts` with structure-related constants
- Create `inventory/constants.ts` with inventory-related constants
- Update server.ts files to import from constants.ts

### Phase 3: Consolidate Feature Types

Move types from server.ts files to dedicated types.ts files.

**Tasks:**

- Create types.ts files for each feature
- Move interfaces from server.ts to types.ts
- Update imports in server.ts files

### Phase 4: Organize Components

Move root-level components to appropriate subdirectories.

**Tasks:**

- Create `providers/` directory
- Move theme-provider to providers/
- Move UI-related components to ui/

### Phase 5: Clean Up Settings Feature

Remove duplicate files and consolidate settings structure.

**Tasks:**

- Remove duplicate formatters/currency.ts
- Move types from currency-presets.ts to types.ts
- Remove empty formatters/ directory

---

## STEP-BY-STEP TASKS

### Phase 1: Shared Types

#### 1. CREATE `app/lib/types.ts`

- **IMPLEMENT**: Shared pagination types used across features
- **PATTERN**: Extract from `app/features/customers/server.ts` (lines 11-25)
- **CONTENT**:

```typescript
export interface PaginatedQuery {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
```

- **VALIDATE**: `bun run check`

### Phase 2: Constants Consolidation

#### 2. CREATE `app/features/sales/constants.ts`

- **IMPLEMENT**: Move constants from sales/server.ts
- **PATTERN**: Mirror `app/features/expenses/constants.ts`
- **CONTENT**: `UNIT_TYPES`, `PAYMENT_STATUSES`, `PAYMENT_METHODS` with type exports
- **VALIDATE**: `bun run check`

#### 3. UPDATE `app/features/sales/server.ts`

- **IMPLEMENT**: Remove inline constants, import from constants.ts
- **IMPORTS**: `import { UNIT_TYPES, PAYMENT_STATUSES, PAYMENT_METHODS } from './constants'`
- **REMOVE**: Lines 3-25 (constant definitions)
- **VALIDATE**: `bun run check`

#### 4. CREATE `app/features/structures/constants.ts`

- **IMPLEMENT**: Move constants from structures/server.ts
- **PATTERN**: Mirror `app/features/expenses/constants.ts`
- **CONTENT**: `STRUCTURE_TYPES`, `STRUCTURE_STATUSES` with type exports
- **VALIDATE**: `bun run check`

#### 5. UPDATE `app/features/structures/server.ts`

- **IMPLEMENT**: Remove inline constants, import from constants.ts
- **IMPORTS**: `import { STRUCTURE_TYPES, STRUCTURE_STATUSES, type StructureType, type StructureStatus } from './constants'`
- **REMOVE**: Lines 3-20 (constant and type definitions)
- **VALIDATE**: `bun run check`

#### 6. CREATE `app/features/inventory/constants.ts`

- **IMPLEMENT**: Consolidate inventory constants, remove FEED_TYPES duplicate
- **PATTERN**: Mirror `app/features/expenses/constants.ts`
- **CONTENT**: `MEDICATION_UNITS` from medication-server.ts
- **GOTCHA**: Remove duplicate `FEED_TYPES` - use `~/features/feed/constants` instead
- **VALIDATE**: `bun run check`

#### 7. UPDATE `app/features/inventory/medication-server.ts`

- **IMPLEMENT**: Import constants from constants.ts
- **VALIDATE**: `bun run check`

#### 8. UPDATE `app/features/inventory/feed-server.ts`

- **IMPLEMENT**: Remove duplicate FEED_TYPES, import from feed/constants
- **IMPORTS**: `import { FEED_TYPES } from '~/features/feed/constants'`
- **VALIDATE**: `bun run check`

### Phase 3: Types Consolidation

#### 9. CREATE `app/features/sales/types.ts`

- **IMPLEMENT**: Move types from sales/server.ts
- **CONTENT**: `UnitType`, `PaymentStatus`, `PaymentMethod` (re-export from constants), plus any interfaces
- **VALIDATE**: `bun run check`

#### 10. CREATE `app/features/structures/types.ts`

- **IMPLEMENT**: Move interfaces from structures/server.ts
- **CONTENT**: `CreateStructureInput` and other interfaces
- **VALIDATE**: `bun run check`

#### 11. UPDATE `app/features/structures/server.ts`

- **IMPLEMENT**: Import types from types.ts
- **VALIDATE**: `bun run check`

#### 12. CREATE `app/features/batches/types.ts`

- **IMPLEMENT**: Move interfaces from batches/server.ts
- **CONTENT**: `CreateBatchData`, `UpdateBatchData`
- **PATTERN**: Keep `SOURCE_SIZE_OPTIONS` in server.ts (it's dynamic based on modules)
- **VALIDATE**: `bun run check`

#### 13. UPDATE `app/features/batches/server.ts`

- **IMPLEMENT**: Import types from types.ts
- **VALIDATE**: `bun run check`

#### 14. CREATE `app/features/customers/types.ts`

- **IMPLEMENT**: Move interfaces from customers/server.ts
- **CONTENT**: `CreateCustomerInput`
- **IMPORTS**: Use shared `PaginatedQuery`, `PaginatedResult` from `~/lib/types`
- **VALIDATE**: `bun run check`

#### 15. UPDATE `app/features/customers/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 16. CREATE `app/features/suppliers/types.ts`

- **IMPLEMENT**: Move interfaces from suppliers/server.ts
- **CONTENT**: `CreateSupplierInput`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 17. UPDATE `app/features/suppliers/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 18. CREATE `app/features/expenses/types.ts`

- **IMPLEMENT**: Move interfaces from expenses/server.ts
- **CONTENT**: `CreateExpenseInput`, `UpdateExpenseInput`
- **VALIDATE**: `bun run check`

#### 19. UPDATE `app/features/expenses/server.ts`

- **IMPLEMENT**: Import types from types.ts
- **VALIDATE**: `bun run check`

#### 20. CREATE `app/features/feed/types.ts`

- **IMPLEMENT**: Move interfaces from feed/server.ts
- **CONTENT**: `CreateFeedRecordInput`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 21. UPDATE `app/features/feed/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 22. CREATE `app/features/eggs/types.ts`

- **IMPLEMENT**: Move interfaces from eggs/server.ts
- **CONTENT**: `CreateEggRecordInput`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 23. UPDATE `app/features/eggs/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 24. CREATE `app/features/invoices/types.ts`

- **IMPLEMENT**: Move interfaces from invoices/server.ts
- **CONTENT**: `CreateInvoiceInput`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 25. UPDATE `app/features/invoices/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 26. CREATE `app/features/vaccinations/types.ts`

- **IMPLEMENT**: Move interfaces from vaccinations/server.ts
- **CONTENT**: `CreateVaccinationInput`, `CreateTreatmentInput`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 27. UPDATE `app/features/vaccinations/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 28. CREATE `app/features/weight/types.ts`

- **IMPLEMENT**: Move interfaces from weight/server.ts
- **CONTENT**: `CreateWeightSampleInput`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 29. UPDATE `app/features/weight/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 30. CREATE `app/features/water-quality/types.ts`

- **IMPLEMENT**: Move interfaces from water-quality/server.ts
- **CONTENT**: `CreateWaterQualityInput`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 31. UPDATE `app/features/water-quality/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 32. CREATE `app/features/mortality/types.ts`

- **IMPLEMENT**: Move interfaces from mortality/server.ts
- **CONTENT**: `CreateMortalityData`
- **IMPORTS**: Use shared pagination types
- **VALIDATE**: `bun run check`

#### 33. UPDATE `app/features/mortality/server.ts`

- **IMPLEMENT**: Import types from types.ts and ~/lib/types
- **VALIDATE**: `bun run check`

#### 34. CREATE `app/features/reports/types.ts`

- **IMPLEMENT**: Move interfaces from reports/server.ts
- **CONTENT**: `DateRange`, `ProfitLossReport`, `InventoryReport`, `SalesReport`, `FeedReport`
- **VALIDATE**: `bun run check`

#### 35. UPDATE `app/features/reports/server.ts`

- **IMPLEMENT**: Import types from types.ts
- **VALIDATE**: `bun run check`

#### 36. CREATE `app/features/inventory/types.ts`

- **IMPLEMENT**: Consolidate inventory types
- **VALIDATE**: `bun run check`

### Phase 4: Component Organization

#### 37. CREATE `app/components/providers/` directory

- **IMPLEMENT**: Create directory for context providers
- **VALIDATE**: `ls app/components/providers/`

#### 38. MOVE `app/components/theme-provider.tsx` → `app/components/providers/theme-provider.tsx`

- **IMPLEMENT**: Move file and update all imports
- **VALIDATE**: `bun run check`

#### 39. MOVE `app/components/theme-toggle.tsx` → `app/components/ui/theme-toggle.tsx`

- **IMPLEMENT**: Move file and update all imports
- **VALIDATE**: `bun run check`

#### 40. MOVE `app/components/logo.tsx` → `app/components/ui/logo.tsx`

- **IMPLEMENT**: Move file and update all imports
- **VALIDATE**: `bun run check`

#### 41. MOVE `app/components/pwa-prompt.tsx` → `app/components/ui/pwa-prompt.tsx`

- **IMPLEMENT**: Move file and update all imports
- **VALIDATE**: `bun run check`

#### 42. MOVE `app/components/offline-indicator.tsx` → `app/components/ui/offline-indicator.tsx`

- **IMPLEMENT**: Move file and update all imports
- **VALIDATE**: `bun run check`

### Phase 5: Settings Cleanup

#### 43. ANALYZE settings/formatters/currency.ts vs settings/currency-formatter.ts

- **IMPLEMENT**: Determine which is used, remove duplicate
- **VALIDATE**: `grep -r "formatters/currency" app/`

#### 44. REMOVE duplicate currency file

- **IMPLEMENT**: Remove unused file and empty formatters/ directory
- **VALIDATE**: `bun run check`

#### 45. CREATE `app/features/settings/types.ts`

- **IMPLEMENT**: Move types from currency-presets.ts
- **CONTENT**: `CurrencyPreset`, `UserSettings`, `DateFormat`, `WeightUnit`, etc.
- **VALIDATE**: `bun run check`

#### 46. UPDATE `app/features/settings/currency-presets.ts`

- **IMPLEMENT**: Import types from types.ts, keep only constants
- **VALIDATE**: `bun run check`

---

## TESTING STRATEGY

### Unit Tests

No new tests required - this is a refactor with no behavior changes.

### Integration Tests

Existing tests should continue to pass without modification.

### Validation

- All imports resolve correctly
- No circular dependencies introduced
- TypeScript compilation succeeds
- Lint passes

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
bun run lint
bun run check
```

### Level 2: Type Checking

```bash
bunx tsc --noEmit
```

### Level 3: Tests

```bash
bun test
```

### Level 4: Manual Validation

```bash
bun dev
# Navigate to various pages to ensure app works
```

---

## ACCEPTANCE CRITERIA

- [ ] All constants are in dedicated `constants.ts` files (not in server.ts)
- [ ] All types are in dedicated `types.ts` files (not in server.ts)
- [ ] No duplicate type/constant definitions
- [ ] Shared pagination types in `app/lib/types.ts`
- [ ] Root-level components moved to appropriate subdirectories
- [ ] Settings feature has no duplicate files
- [ ] All validation commands pass
- [ ] No regressions in existing functionality

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes
- [ ] No linting or type checking errors
- [ ] Manual testing confirms app works
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decisions

1. **Shared pagination types**: Rather than duplicating `PaginatedQuery` and `PaginatedResult` in every feature, create once in `app/lib/types.ts`

2. **Constants with type inference**: Use `as const` pattern to derive types from constants, keeping them in sync

3. **Keep server.ts clean**: Server files should only contain server functions, importing types and constants from dedicated files

4. **Component organization**:
   - `ui/` - Reusable UI primitives
   - `providers/` - React context providers
   - `layout/` - Layout components
   - `dialogs/` - Modal dialogs
   - Feature-specific directories for feature components

### Risks

1. **Import path changes**: Many files will need import updates. Use find-and-replace carefully.

2. **Circular dependencies**: When extracting types, ensure no circular imports are created.

### Estimated Time

- Phase 1: 15 minutes
- Phase 2: 30 minutes
- Phase 3: 60 minutes
- Phase 4: 20 minutes
- Phase 5: 15 minutes
- **Total**: ~2.5 hours

### Confidence Score: 8/10

High confidence due to:

- Clear patterns to follow
- No behavior changes
- Comprehensive validation at each step

Risk factors:

- Many files to update
- Potential for missed imports
