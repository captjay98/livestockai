# Feature: Codebase Consistency & Type Safety Cleanup

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Comprehensive cleanup of codebase inconsistencies identified in the audit:

1. Replace 174+ `any` types with proper TypeScript interfaces
2. Consolidate 12+ duplicate `PaginatedResult` and `PaginatedQuery` interfaces into shared types
3. Remove/replace console statements with proper patterns
4. Standardize server function export patterns

## User Story

As a developer maintaining LivestockAI
I want consistent type safety and coding patterns across the codebase
So that the code is maintainable, IDE-friendly, and catches bugs at compile time

## Problem Statement

The codebase has accumulated technical debt:

- 174+ uses of `any` type reducing type safety
- `PaginatedResult<T>` and `PaginatedQuery` duplicated in 12+ files
- Console statements scattered in production code
- Inconsistent server function export patterns

## Solution Statement

1. Create shared types in `app/lib/types.ts` for common interfaces
2. Replace `any` with proper types in routes and components
3. Standardize patterns across all feature modules

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: All feature modules, routes
**Dependencies**: None (internal refactor)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

**Shared Types Pattern (to create):**

- `app/lib/db/types.ts` - Database types pattern to follow
- `app/features/batches/server.ts` (lines 33-60) - Interface definition pattern
- `app/features/settings/index.ts` - Barrel export pattern

**Files with `any` to fix (priority order):**

- `app/routes/_auth/batches/$batchId/index.tsx` (lines 43-50) - 5 `any` types
- `app/routes/_auth/customers/index.tsx` - 5 `any` types
- `app/routes/_auth/vaccinations/index.tsx` - 9 `any` types
- `app/routes/_auth/feed/index.tsx` - 5 `any` types
- `app/routes/_auth/reports/index.tsx` - 4 `any` types

**Duplicate interfaces to consolidate:**

- `app/features/batches/server.ts` (lines 720-730) - PaginatedQuery/Result
- `app/features/sales/server.ts` (lines 502-520) - PaginatedQuery/Result
- `app/features/expenses/server.ts` (lines 453-470) - PaginatedQuery/Result
- (10 more files with same pattern)

### New Files to Create

- `app/lib/types.ts` - Shared TypeScript interfaces (PaginatedQuery, PaginatedResult)

### Files to Update

- All 12 feature server.ts files - Remove duplicate interfaces, import from shared
- ~15 route files - Replace `any` with proper types

### Patterns to Follow

**Interface Naming:**

```typescript
// Use descriptive names with feature prefix for specific types
export interface BatchDetails { ... }
export interface CustomerWithStats { ... }

// Use generic names for shared types
export interface PaginatedQuery { ... }
export interface PaginatedResult<T> { ... }
```

**Import Pattern:**

```typescript
// Shared types from lib
import type { PaginatedQuery, PaginatedResult } from '~/lib/types'

// Feature-specific types from feature
import type { BatchDetails } from '~/features/batches/server'
```

**State Typing Pattern:**

```typescript
// ❌ Bad
const [details, setDetails] = useState<any>(null)

// ✅ Good
const [details, setDetails] = useState<BatchDetails | null>(null)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Shared Types

Create centralized type definitions for commonly used interfaces.

### Phase 2: Update Feature Modules

Remove duplicate interfaces from feature server files, import from shared.

### Phase 3: Fix Route Type Safety

Replace `any` types in route components with proper interfaces.

### Phase 4: Validation

Run TypeScript and lint checks to ensure no regressions.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/lib/types.ts` - Shared Types

**IMPLEMENT**: Create shared TypeScript interfaces

```typescript
/**
 * Shared TypeScript types for LivestockAI
 */

/**
 * Standard pagination query parameters
 */
export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
}

/**
 * Standard paginated response wrapper
 */
export interface PaginatedResult<T> {
  data: Array<T>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Base record with timestamps
 */
export interface BaseRecord {
  id: string
  createdAt: Date
  updatedAt?: Date
}
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 2: UPDATE `app/features/batches/server.ts` - Remove Duplicate Types

**IMPLEMENT**:

1. Add import: `import type { PaginatedQuery, PaginatedResult } from '~/lib/types'`
2. Remove local `PaginatedQuery` interface (around line 720)
3. Remove local `PaginatedResult` interface (around line 730)
4. Export `BatchDetails` type for route usage

**PATTERN**: Keep feature-specific types, remove generic duplicates

**VALIDATE**: `npx tsc --noEmit`

---

### Task 3: UPDATE `app/features/sales/server.ts` - Remove Duplicate Types

**IMPLEMENT**:

1. Add import: `import type { PaginatedQuery, PaginatedResult } from '~/lib/types'`
2. Remove local interfaces (lines 502-520)
3. Export `SaleRecord` type for route usage

**VALIDATE**: `npx tsc --noEmit`

---

### Task 4: UPDATE `app/features/expenses/server.ts` - Remove Duplicate Types

**IMPLEMENT**:

1. Add import from `~/lib/types`
2. Remove local interfaces (lines 453-470)
3. Export `ExpenseRecord` type

**VALIDATE**: `npx tsc --noEmit`

---

### Task 5: UPDATE Remaining Feature Server Files

**FILES** (repeat pattern from Tasks 2-4):

- `app/features/customers/server.ts`
- `app/features/suppliers/server.ts`
- `app/features/invoices/server.ts`
- `app/features/feed/server.ts`
- `app/features/eggs/server.ts`
- `app/features/mortality/server.ts`
- `app/features/weight/server.ts`
- `app/features/water-quality/server.ts`
- `app/features/vaccinations/server.ts`

**IMPLEMENT**: For each file:

1. Add `import type { PaginatedQuery, PaginatedResult } from '~/lib/types'`
2. Remove duplicate interface definitions
3. Export feature-specific record types

**VALIDATE**: `npx tsc --noEmit`

---

### Task 6: CREATE Type Exports in `app/features/batches/server.ts`

**IMPLEMENT**: Add explicit type exports for route consumption

```typescript
// Add near top of file after interfaces
export type { CreateBatchData, UpdateBatchData }

// Add type for batch details (used by routes)
export interface BatchDetails {
  batch: {
    id: string
    farmId: string
    batchName: string | null
    livestockType: string
    species: string
    // ... other fields from getBatchById
  }
  mortality: {
    totalDeaths: number
    totalQuantity: number
    rate: number
  }
  feed: {
    totalFeedings: number
    totalKg: number
    totalCost: number
    fcr: number | null
  }
  sales: {
    totalSales: number
    totalQuantity: number
    totalRevenue: number
  }
  expenses: {
    total: number
  }
  currentWeight: number | null
}
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 7: FIX `app/routes/_auth/batches/$batchId/index.tsx` - Replace `any` Types

**IMPLEMENT**:

1. Add import: `import type { BatchDetails } from '~/features/batches/server'`
2. Replace state types:

```typescript
// Before
const [details, setDetails] = useState<any>(null)
const [feedRecords, setFeedRecords] = useState<Array<any>>([])
const [mortalityRecords, setMortalityRecords] = useState<Array<any>>([])
const [expenses, setExpenses] = useState<Array<any>>([])
const [sales, setSales] = useState<Array<any>>([])

// After
const [details, setDetails] = useState<BatchDetails | null>(null)
const [feedRecords, setFeedRecords] = useState<Array<FeedRecord>>([])
const [mortalityRecords, setMortalityRecords] = useState<
  Array<MortalityRecord>
>([])
const [expenses, setExpenses] = useState<Array<ExpenseRecord>>([])
const [sales, setSales] = useState<Array<SaleRecord>>([])
```

**IMPORTS**: Add type imports from respective feature modules

**VALIDATE**: `npx tsc --noEmit`

---

### Task 8: FIX `app/routes/_auth/customers/index.tsx` - Replace `any` Types

**IMPLEMENT**:

1. Import `CustomerRecord` type from customers server
2. Replace `PaginatedResult<any>` with `PaginatedResult<CustomerRecord>`
3. Replace `useState<any | null>` with proper type
4. Replace `ColumnDef<any>` with `ColumnDef<CustomerRecord>`

**VALIDATE**: `npx tsc --noEmit`

---

### Task 9: FIX `app/routes/_auth/vaccinations/index.tsx` - Replace `any` Types

**IMPLEMENT**:

1. Define or import `VaccinationRecord` and `TreatmentRecord` types
2. Replace all `any` usages with proper types
3. Type the `upcoming` and `overdue` arrays properly

**VALIDATE**: `npx tsc --noEmit`

---

### Task 10: FIX Remaining Route Files with `any` Types

**FILES**:

- `app/routes/_auth/feed/index.tsx`
- `app/routes/_auth/mortality/index.tsx`
- `app/routes/_auth/weight/index.tsx`
- `app/routes/_auth/water-quality/index.tsx`
- `app/routes/_auth/suppliers/index.tsx`
- `app/routes/_auth/invoices/index.tsx`
- `app/routes/_auth/eggs/index.tsx`
- `app/routes/_auth/reports/index.tsx`
- `app/routes/_auth/farms/$farmId/index.tsx`

**IMPLEMENT**: For each file:

1. Import proper types from feature modules
2. Replace `PaginatedResult<any>` with typed version
3. Replace `useState<any>` with proper types
4. Replace `ColumnDef<any>` with typed version

**VALIDATE**: `npx tsc --noEmit` after each file

---

### Task 11: FIX `app/routes/_auth/feed/new.tsx` and Similar "new" Routes

**FILES**:

- `app/routes/_auth/feed/new.tsx`
- `app/routes/_auth/eggs/new.tsx`
- `app/routes/_auth/weight/new.tsx`
- `app/routes/_auth/water-quality/new.tsx`
- `app/routes/_auth/vaccinations/new.tsx`

**IMPLEMENT**: Replace `(b: any)` in map callbacks with proper batch type

```typescript
// Before
batches.find((b: any) => b.id === formData.batchId)
batches.map((batch: any) => (...))

// After
batches.find((b) => b.id === formData.batchId)
batches.map((batch) => (...))
```

**NOTE**: TypeScript should infer types from the batches array type

**VALIDATE**: `npx tsc --noEmit`

---

### Task 12: Final Validation

**VALIDATE ALL**:

```bash
# TypeScript check
npx tsc --noEmit

# Lint check
bun run lint

# Run tests to ensure no regressions
bun test
```

---

## TESTING STRATEGY

### Type Safety Tests

After refactoring, TypeScript compiler should catch:

- Missing properties on typed objects
- Incorrect property access
- Type mismatches in function calls

### Regression Tests

Run existing test suite to ensure no behavioral changes:

```bash
bun test
```

### Manual Validation

1. Navigate to batch details page - verify data loads
2. Navigate to customers list - verify pagination works
3. Create new feed record - verify form works

---

## VALIDATION COMMANDS

### Level 1: Syntax & Types

```bash
npx tsc --noEmit
```

### Level 2: Linting

```bash
bun run lint
```

### Level 3: Tests

```bash
bun test
```

### Level 4: Manual Testing

- Open batch details page
- Open customers list with pagination
- Create a new record in any form

---

## ACCEPTANCE CRITERIA

- [ ] `app/lib/types.ts` created with shared interfaces
- [ ] All 12 feature server files use shared types (no duplicates)
- [ ] All route files have proper types (no `any`)
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `bun run lint` passes with 0 errors
- [ ] All existing tests pass
- [ ] No runtime regressions

---

## COMPLETION CHECKLIST

- [ ] Task 1: Shared types file created
- [ ] Tasks 2-5: Feature modules updated
- [ ] Task 6: Type exports added
- [ ] Tasks 7-11: Route files fixed
- [ ] Task 12: All validations pass
- [ ] Manual testing confirms functionality

---

## NOTES

### Trade-offs

1. **Gradual vs Big Bang**: This plan uses gradual approach - fix one file at a time with validation after each. Safer but slower.

2. **Type Inference vs Explicit**: Where possible, rely on TypeScript inference rather than explicit types. Only add explicit types where inference fails.

3. **Console Statements**: Deferred to separate task - focus on type safety first.

### Risks

1. **Breaking Changes**: Changing types could break runtime if types don't match actual data. Mitigate with tests.

2. **Import Cycles**: Adding shared types could create import cycles. Keep `app/lib/types.ts` dependency-free.

### Future Improvements

After this cleanup:

- Add stricter ESLint rules to prevent `any`
- Consider `strict: true` in tsconfig
- Add type coverage reporting
