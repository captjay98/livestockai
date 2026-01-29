# Complete Audit Remediation Plan

**Created:** January 25, 2026  
**Based On:** `.agents/COMPREHENSIVE-AUDIT-2026-01-25.md`  
**Scope:** Address 100% of audit findings across 8 categories  
**Estimated Duration:** 3-4 weeks (phased implementation)

---

## Feature Description

This plan addresses ALL findings from the comprehensive codebase audit, covering:

- **Critical infrastructure issues** (pagination, indexes, validators)
- **Architectural inconsistencies** (TanStack Router patterns)
- **Code quality improvements** (TypeScript errors, optimizations)
- **Performance enhancements** (database queries, N+1 patterns)

The audit identified **54 specific issues** across 28 routes, 120+ server functions, 19 hooks, and 216 components. This plan provides a phased approach to achieve 100% compliance with OpenLivestock best practices.

## User Story

As a **development team**  
I want to **remediate all audit findings systematically**  
So that **the codebase achieves 100% compliance with TanStack Router patterns, has optimal performance, and maintains consistency across all features**

## Problem Statement

The comprehensive audit revealed:

- **54% of routes** use client-side data fetching instead of TanStack Router loaders
- **63% of custom hooks** violate the pattern by fetching data client-side
- **25+ server functions** lack proper Zod validators
- **3 critical performance issues** (missing pagination, missing indexes)
- **Inconsistent patterns** across features prevent SSR, prefetching, and optimal UX

These issues prevent the application from leveraging TanStack Router's full capabilities and create performance bottlenecks at scale.

## Solution Statement

Implement a **phased remediation approach** that:

1. **Phase 1 (Critical):** Fix infrastructure issues that impact performance and security
2. **Phase 2 (High Priority):** Standardize TanStack Router patterns across all routes
3. **Phase 3 (Medium Priority):** Clean up code quality issues and optimize queries
4. **Phase 4 (Validation):** Comprehensive testing and documentation updates

Each phase is independently deployable and includes validation checkpoints.

## Feature Metadata

**Feature Type:** Refactor + Enhancement  
**Estimated Complexity:** High (54 issues across 8 categories)  
**Primary Systems Affected:** Routes (28), Server Functions (25+), Hooks (12), Database (3)  
**Dependencies:** None (uses existing stack)

---

## CONTEXT REFERENCES

### Audit Report (MUST READ FIRST)

- `.agents/COMPREHENSIVE-AUDIT-2026-01-25.md` - Complete audit findings with detailed analysis

### Relevant Codebase Files (Pattern Examples)

**Excellent TanStack Router Implementations (Mirror These):**

- `app/routes/_auth/batches/index.tsx` - Perfect loader + pendingComponent + errorComponent
- `app/routes/_auth/batches/$batchId/index.tsx` - Batch detail with loader
- `app/routes/_auth/dashboard/index.tsx` - Dashboard with loader

**Server Function Patterns (Follow These):**

- `app/features/batches/server.ts` - Proper Zod validators, dynamic imports, AppError
- `app/features/structures/server.ts` - Consistent validation patterns
- `app/features/sales/server.ts` - Good error handling examples

**Hook Patterns (Mutations Only):**

- `app/features/batches/use-batch-page.ts` - Correct pattern (no data fetching)
- `app/features/dashboard/use-dashboard.ts` - Dialog state management only

**Repository Patterns:**

- `app/features/batches/repository.ts` - Explicit column selection, type-safe queries

**Skeleton Components:**

- `app/components/batches/batches-skeleton.tsx` - Loading state pattern
- `app/components/dashboard/dashboard-skeleton.tsx` - Dashboard skeleton

### Files Requiring Changes (54 Total)

**Routes (24 files):**

- 15 routes need loaders + pendingComponent + errorComponent
- 9 routes need pendingComponent + errorComponent only

**Server Functions (25 files):**

- 21 functions need Zod validators added
- 4 functions need validator standardization

**Hooks (12 files):**

- All need data fetching removed, keep mutations only

**Repository (3 files):**

- Add pagination to 3 functions

**Database (1 file):**

- Add 4 missing indexes

**Components (2 files):**

- Move data fetching to route loaders

**Tests (1 file):**

- Fix 3 TypeScript errors

### Relevant Documentation

**TanStack Router (CRITICAL - Read Before Implementation):**

- [TanStack Router Loaders](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading) - Data loading patterns
- [TanStack Router Search Params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params) - Search param validation
- [TanStack Router Pending Component](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#pendingcomponent) - Loading states

**Zod Validation:**

- [Zod Documentation](https://zod.dev/) - Schema validation patterns
- [Zod Common Patterns](https://zod.dev/?id=primitives) - UUID, email, enum validation

**Kysely Database:**

- [Kysely Queries](https://kysely.dev/docs/getting-started#queries) - Type-safe query building
- [Kysely Migrations](https://kysely.dev/docs/migrations) - Schema migration patterns

**OpenLivestock Patterns (MANDATORY):**

- `AGENTS.md` (lines 200-450) - TanStack Router patterns section (added in this audit)
- `.kiro/steering/coding-standards.md` - Mandatory coding patterns
- `.kiro/steering/structure.md` - File organization rules

---

## PATTERNS TO FOLLOW

### Pattern 1: Route Loader (MANDATORY for all routes)

```typescript
// app/routes/_auth/{feature}/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getFeatureDataFn } from '~/features/{feature}/server'
import { FeatureSkeleton } from '~/components/{feature}/{feature}-skeleton'
import { validateFeatureSearch } from '~/features/{feature}/validation'

export const Route = createFileRoute('/_auth/{feature}/')({
  // 1. Validate search params
  validateSearch: validateFeatureSearch,

  // 2. Define loader dependencies
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
    page: search.page,
    pageSize: search.pageSize,
    // ... other search params
  }),

  // 3. Loader function
  loader: async ({ deps }) => {
    return getFeatureDataFn({ data: deps })
  },

  // 4. Loading state
  pendingComponent: FeatureSkeleton,

  // 5. Error state
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading {feature}: {error.message}
    </div>
  ),

  // 6. Main component
  component: FeaturePage,
})

function FeaturePage() {
  // Access loader data
  const data = Route.useLoaderData()

  // No loading states needed - TanStack handles it
  return <div>{/* render */}</div>
}
```

### Pattern 2: Server Function Validator (MANDATORY)

```typescript
// app/features/{feature}/server.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

export const getFeatureDataFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { db } = await import('~/lib/db') // MUST be dynamic

    try {
      // Implementation
      return await getFeatureData(session.user.id, data)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })
```

### Pattern 3: Custom Hook (Mutations Only)

```typescript
// app/features/{feature}/use-{feature}-page.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useFeaturePage() {
  const queryClient = useQueryClient()

  // ✅ Mutations only
  const createMutation = useMutation({
    mutationFn: (data) => createFeatureFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature'] })
    },
  })

  // ✅ Local UI state only
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // ❌ NO data fetching with useEffect
  // ❌ NO useState for loading states

  return { createMutation, isDialogOpen, setIsDialogOpen }
}
```

### Pattern 4: Skeleton Component

```typescript
// app/components/{feature}/{feature}-skeleton.tsx
import { Skeleton } from '~/components/ui/skeleton'

export function FeatureSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>

      {/* Table/content */}
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### Pattern 5: Repository Pagination

```typescript
// app/features/{feature}/repository.ts
export async function getFeaturesPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  page: number = 1,
  pageSize: number = 20,
) {
  // Get total count
  const countResult = await db
    .selectFrom('table')
    .where('farmId', 'in', farmIds)
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Get paginated data
  const data = await db
    .selectFrom('table')
    .select(['id', 'name', 'createdAt']) // Explicit columns
    .where('farmId', 'in', farmIds)
    .orderBy('createdAt', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return { data, total, page, pageSize, totalPages }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Critical Infrastructure (Week 1)

**Goal:** Fix performance and security issues that impact all users

**Scope:**

- Add pagination to 3 repository functions
- Add 4 missing database indexes
- Add validators to 21 server functions

**Impact:** Prevents performance degradation, adds runtime validation

### Phase 2: TanStack Router Standardization (Week 2-3)

**Goal:** Achieve 100% TanStack Router pattern compliance

**Scope:**

- Refactor 15 routes to use loaders
- Refactor 12 custom hooks (remove data fetching)
- Add pendingComponent to 9 routes
- Refactor 2 components

**Impact:** Enables SSR, prefetching, automatic loading states

### Phase 3: Code Quality & Optimization (Week 3-4)

**Goal:** Clean up remaining issues and optimize queries

**Scope:**

- Fix 3 TypeScript errors
- Optimize N+1 query pattern
- Update documentation

**Impact:** Cleaner codebase, better query performance

### Phase 4: Validation & Documentation (Week 4)

**Goal:** Verify all changes and update documentation

**Scope:**

- Run full test suite
- Manual testing of all refactored routes
- Update AGENTS.md with new patterns
- Create migration guide

**Impact:** Confidence in deployment, better developer experience

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute tasks in order. Each phase is independently deployable. Validate after each phase before proceeding.

---

### PHASE 1: CRITICAL INFRASTRUCTURE (Week 1)

#### Task 1.1: ADD pagination to getBatchesByFarm

- **FILE**: `app/features/batches/repository.ts`
- **IMPLEMENT**: Add `page` and `pageSize` parameters, implement LIMIT/OFFSET
- **PATTERN**: Mirror `getSalesPaginated` in `app/features/sales/repository.ts` (lines 150-200)
- **GOTCHA**: Must return `{ data, total, page, pageSize, totalPages }` structure
- **VALIDATE**: `bun run test tests/features/batches/batches.test.ts`

```typescript
// Add to repository.ts
export async function getBatchesByFarmPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: BatchFilters,
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResult<BatchWithFarmName>> {
  // Implementation following sales pattern
}
```

#### Task 1.2: ADD pagination to getExpensesByFarm

- **FILE**: `app/features/expenses/repository.ts`
- **IMPLEMENT**: Add pagination to `getExpensesByFarm` function
- **PATTERN**: Use existing `getExpensesPaginated` as template (same file, lines 100-150)
- **GOTCHA**: Ensure filters still work with pagination
- **VALIDATE**: `bun run test tests/features/expenses/expenses.test.ts`

#### Task 1.3: ADD pagination to getSalesByFarm

- **FILE**: `app/features/sales/repository.ts`
- **IMPLEMENT**: Ensure `getSalesByFarm` uses pagination (may already exist as `getSalesPaginated`)
- **PATTERN**: Check if `getSalesPaginated` exists, if so, deprecate `getSalesByFarm`
- **VALIDATE**: `bun run test tests/features/sales/sales.test.ts`

#### Task 1.4: CREATE database migration for missing indexes

- **FILE**: `app/lib/db/migrations/2026-01-25-001-add-missing-indexes.ts`
- **IMPLEMENT**: Add 4 missing indexes identified in audit
- **PATTERN**: Follow existing migration pattern in `app/lib/db/migrations/2025-01-08-001-initial-schema.ts`
- **VALIDATE**: `bun run db:migrate && neon__get_database_tables`

```typescript
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Add indexes for better query performance
  await sql`CREATE INDEX IF NOT EXISTS idx_batches_livestock_type ON batches(livestockType)`.execute(
    db,
  )
  await sql`CREATE INDEX IF NOT EXISTS idx_sales_livestock_type ON sales(livestockType)`.execute(
    db,
  )
  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)`.execute(
    db,
  )
  await sql`CREATE INDEX IF NOT EXISTS idx_batches_acquisition_date ON batches(acquisitionDate)`.execute(
    db,
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_batches_livestock_type`.execute(db)
  await sql`DROP INDEX IF EXISTS idx_sales_livestock_type`.execute(db)
  await sql`DROP INDEX IF EXISTS idx_expenses_category`.execute(db)
  await sql`DROP INDEX IF EXISTS idx_batches_acquisition_date`.execute(db)
}
```

#### Task 1.5: ADD validators to auth server functions (3 functions)

- **FILE**: `app/features/auth/server.ts`
- **IMPLEMENT**: Add Zod validators to `loginFn`, `registerFn`, `checkAuthFn`
- **PATTERN**: Follow `app/features/batches/server.ts` validator pattern
- **IMPORTS**: `import { z } from 'zod'`
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/auth/`

```typescript
// Example for loginFn
export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    // existing implementation
  })
```

#### Task 1.6: ADD validators to farms server functions (2 functions)

- **FILE**: `app/features/farms/server.ts`
- **IMPLEMENT**: Add validators to `getFarmsForUserFn`, `getFarmByIdFn`
- **PATTERN**: Use `z.object({})` for no-param functions, `z.object({ farmId: z.string().uuid() })` for ID functions
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/farms/`

#### Task 1.7: ADD validators to integrations server functions (1 function)

- **FILE**: `app/features/integrations/server.ts`
- **IMPLEMENT**: Add validator to `getIntegrationStatusFn`
- **PATTERN**: `z.object({})` for GET with no params
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.8: ADD validators to notifications server functions (1 function)

- **FILE**: `app/features/notifications/server.ts`
- **IMPLEMENT**: Add validator to `markAllAsReadFn`
- **PATTERN**: `z.object({ farmId: z.string().uuid().optional() })`
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/notifications/`

#### Task 1.9: ADD validators to onboarding server functions (5 functions)

- **FILE**: `app/features/onboarding/server.ts`
- **IMPLEMENT**: Add validators to all 5 functions
- **PATTERN**: Check function signatures, add appropriate Zod schemas
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/onboarding/`

#### Task 1.10: ADD validators to settings server functions (8 functions)

- **FILE**: `app/features/settings/server.ts`
- **IMPLEMENT**: Add validators to 8 functions without validators
- **PATTERN**: Use `z.object({})` for getters, appropriate schemas for setters
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/settings/`

#### Task 1.11: ADD validators to suppliers server functions (1 function)

- **FILE**: `app/features/suppliers/server.ts`
- **IMPLEMENT**: Add validator to `getSuppliersFn`
- **PATTERN**: `z.object({ farmId: z.string().uuid().optional() })`
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/suppliers/`

#### Task 1.12: ADD validators to users server functions (1 function)

- **FILE**: `app/features/users/server.ts`
- **IMPLEMENT**: Add validator to `listUsers`
- **PATTERN**: Check existing validators in same file for consistency
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/users/`

#### Task 1.13: STANDARDIZE identity validators in users server (4 functions)

- **FILE**: `app/features/users/server.ts`
- **IMPLEMENT**: Replace `.inputValidator((data: Type) => schema.parse(data))` with `.inputValidator(schema)`
- **PATTERN**: Direct Zod schema usage
- **FUNCTIONS**: `getUser`, `setUserPassword`, `banUser`, `unbanUser`
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/users/`

#### Task 1.14: VALIDATE Phase 1 completion

- **VALIDATE**:
  ```bash
  # All checks must pass
  npx tsc --noEmit || exit 1
  bun run lint || exit 1
  bun run test --run || exit 1
  bun run build || exit 1
  ```

---

### PHASE 2: TANSTACK ROUTER STANDARDIZATION (Week 2-3)

#### Task 2.1: CREATE skeleton component for customers

- **FILE**: `app/components/customers/customers-skeleton.tsx`
- **IMPLEMENT**: Skeleton matching customers page layout
- **PATTERN**: Mirror `app/components/batches/batches-skeleton.tsx`
- **VALIDATE**: Import in route file, verify renders

#### Task 2.2: REFACTOR customers index route to use loader

- **FILE**: `app/routes/_auth/customers/index.tsx`
- **IMPLEMENT**: Add loader, loaderDeps, pendingComponent, errorComponent
- **PATTERN**: Mirror `app/routes/_auth/batches/index.tsx` (lines 1-50)
- **REMOVE**: useEffect data fetching, useState loading states
- **VALIDATE**: Navigate to `/customers`, verify data loads, check Network tab for SSR

#### Task 2.3: REFACTOR use-customer-page hook (remove data fetching)

- **FILE**: `app/features/customers/use-customer-page.ts`
- **IMPLEMENT**: Remove useEffect and data fetching, keep mutations only
- **PATTERN**: Mirror `app/features/batches/use-batch-page.ts`
- **VALIDATE**: `npx tsc --noEmit && bun run test tests/features/customers/`

#### Task 2.4: CREATE skeleton component for customer detail

- **FILE**: `app/components/customers/customer-detail-skeleton.tsx`
- **IMPLEMENT**: Skeleton for customer detail page
- **PATTERN**: Mirror `app/components/batches/batch-detail-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.5: REFACTOR customers/$customerId route to use loader

- **FILE**: `app/routes/_auth/customers/$customerId/index.tsx`
- **IMPLEMENT**: Add loader with params, pendingComponent, errorComponent
- **PATTERN**: Mirror `app/routes/_auth/batches/$batchId/index.tsx`
- **VALIDATE**: Navigate to customer detail, verify SSR

#### Task 2.6: CREATE skeleton component for expenses

- **FILE**: `app/components/expenses/expenses-skeleton.tsx`
- **IMPLEMENT**: Skeleton for expenses page
- **PATTERN**: Mirror batches skeleton
- **VALIDATE**: Import in route file

#### Task 2.7: REFACTOR expenses route to use loader

- **FILE**: `app/routes/_auth/expenses/index.tsx`
- **IMPLEMENT**: Add loader, loaderDeps, pendingComponent, errorComponent
- **PATTERN**: Mirror batches index route
- **REMOVE**: useEffect, useState for loading
- **VALIDATE**: Navigate to `/expenses`, verify SSR

#### Task 2.8: REFACTOR use-expense-page hook

- **FILE**: `app/features/expenses/use-expense-page.ts`
- **IMPLEMENT**: Remove data fetching, keep mutations
- **PATTERN**: Mirror use-batch-page
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.9: CREATE skeleton component for feed

- **FILE**: `app/components/feed/feed-skeleton.tsx`
- **IMPLEMENT**: Skeleton for feed page
- **VALIDATE**: Import in route file

#### Task 2.10: REFACTOR feed route to use loader

- **FILE**: `app/routes/_auth/feed/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Mirror batches index
- **VALIDATE**: Navigate to `/feed`, verify SSR

#### Task 2.11: REFACTOR use-feed-page hook

- **FILE**: `app/features/feed/use-feed-page.ts`
- **IMPLEMENT**: Remove data fetching
- **PATTERN**: Mutations only
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.12: CREATE skeleton component for eggs

- **FILE**: `app/components/eggs/eggs-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.13: REFACTOR eggs route to use loader

- **FILE**: `app/routes/_auth/eggs/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/eggs`, verify SSR

#### Task 2.14: REFACTOR use-egg-page hook

- **FILE**: `app/features/eggs/use-egg-page.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.15: CREATE skeleton component for inventory

- **FILE**: `app/components/inventory/inventory-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.16: REFACTOR inventory route to use loader

- **FILE**: `app/routes/_auth/inventory/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/inventory`, verify SSR

#### Task 2.17: REFACTOR use-feed-inventory and use-medication-inventory hooks

- **FILES**:
  - `app/features/inventory/use-feed-inventory.ts`
  - `app/features/inventory/use-medication-inventory.ts`
- **IMPLEMENT**: Remove data fetching from both
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.18: CREATE skeleton component for invoices

- **FILE**: `app/components/invoices/invoices-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.19: REFACTOR invoices route to use loader

- **FILE**: `app/routes/_auth/invoices/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/invoices`, verify SSR

#### Task 2.20: REFACTOR use-invoice-page hook

- **FILE**: `app/features/invoices/use-invoice-page.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.21: CREATE skeleton component for mortality

- **FILE**: `app/components/mortality/mortality-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.22: REFACTOR mortality route to use loader

- **FILE**: `app/routes/_auth/mortality/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/mortality`, verify SSR

#### Task 2.23: REFACTOR use-mortality-page hook

- **FILE**: `app/features/mortality/use-mortality-page.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.24: CREATE skeleton component for sales

- **FILE**: `app/components/sales/sales-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.25: REFACTOR sales route to use loader

- **FILE**: `app/routes/_auth/sales/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/sales`, verify SSR

#### Task 2.26: REFACTOR use-sales-page hook

- **FILE**: `app/features/sales/use-sales-page.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.27: CREATE skeleton component for settings

- **FILE**: `app/components/settings/settings-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.28: REFACTOR settings route to use loader

- **FILE**: `app/routes/_auth/settings/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/settings`, verify SSR

#### Task 2.29: CREATE skeleton component for suppliers

- **FILE**: `app/components/suppliers/suppliers-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.30: REFACTOR suppliers route to use loader

- **FILE**: `app/routes/_auth/suppliers/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/suppliers`, verify SSR

#### Task 2.31: REFACTOR use-supplier-page hook

- **FILE**: `app/features/suppliers/use-supplier-page.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.32: CREATE skeleton component for vaccinations

- **FILE**: `app/components/vaccinations/vaccinations-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.33: REFACTOR vaccinations route to use loader

- **FILE**: `app/routes/_auth/vaccinations/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/vaccinations`, verify SSR

#### Task 2.34: REFACTOR use-health-data hook

- **FILE**: `app/features/vaccinations/use-health-data.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.35: CREATE skeleton component for water-quality

- **FILE**: `app/components/water-quality/water-quality-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.36: REFACTOR water-quality route to use loader

- **FILE**: `app/routes/_auth/water-quality/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/water-quality`, verify SSR

#### Task 2.37: REFACTOR use-water-quality-page hook

- **FILE**: `app/features/water-quality/use-water-quality-page.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.38: CREATE skeleton component for weight

- **FILE**: `app/components/weight/weight-skeleton.tsx`
- **VALIDATE**: Import in route file

#### Task 2.39: REFACTOR weight route to use loader

- **FILE**: `app/routes/_auth/weight/index.tsx`
- **IMPLEMENT**: Add loader pattern
- **VALIDATE**: Navigate to `/weight`, verify SSR

#### Task 2.40: REFACTOR use-weight-page hook

- **FILE**: `app/features/weight/use-weight-page.ts`
- **IMPLEMENT**: Remove data fetching
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.41: ADD pendingComponent to farms routes (2 routes)

- **FILES**:
  - `app/routes/_auth/farms/index.tsx`
  - `app/routes/_auth/farms/$farmId/index.tsx`
- **IMPLEMENT**: Add pendingComponent and errorComponent (loaders already exist)
- **CREATE**: `app/components/farms/farms-skeleton.tsx` and `app/components/farms/farm-detail-skeleton.tsx`
- **VALIDATE**: Navigate to farms, verify loading states

#### Task 2.42: ADD pendingComponent to invoices/$invoiceId route

- **FILE**: `app/routes/_auth/invoices/$invoiceId/index.tsx`
- **IMPLEMENT**: Add pendingComponent and errorComponent
- **CREATE**: `app/components/invoices/invoice-detail-skeleton.tsx`
- **VALIDATE**: Navigate to invoice detail

#### Task 2.43: ADD pendingComponent to onboarding route

- **FILE**: `app/routes/_auth/onboarding/index.tsx`
- **IMPLEMENT**: Add pendingComponent and errorComponent
- **CREATE**: `app/components/onboarding/onboarding-skeleton.tsx`
- **VALIDATE**: Navigate to onboarding

#### Task 2.44: ADD pendingComponent to reports routes (2 routes)

- **FILES**:
  - `app/routes/_auth/reports/index.tsx`
  - `app/routes/_auth/reports/export.tsx`
- **IMPLEMENT**: Add pendingComponent and errorComponent
- **CREATE**: `app/components/reports/reports-skeleton.tsx`
- **VALIDATE**: Navigate to reports

#### Task 2.45: ADD pendingComponent to settings routes (2 routes)

- **FILES**:
  - `app/routes/_auth/settings/audit.tsx`
  - `app/routes/_auth/settings/users.tsx`
- **IMPLEMENT**: Add pendingComponent and errorComponent
- **CREATE**: Skeletons if needed
- **VALIDATE**: Navigate to settings pages

#### Task 2.46: ADD pendingComponent to suppliers/$supplierId route

- **FILE**: `app/routes/_auth/suppliers/$supplierId/index.tsx`
- **IMPLEMENT**: Add pendingComponent and errorComponent
- **CREATE**: `app/components/suppliers/supplier-detail-skeleton.tsx`
- **VALIDATE**: Navigate to supplier detail

#### Task 2.47: ADD pendingComponent to tasks route

- **FILE**: `app/routes/_auth/tasks/index.tsx`
- **IMPLEMENT**: Add pendingComponent and errorComponent
- **CREATE**: `app/components/tasks/tasks-skeleton.tsx`
- **VALIDATE**: Navigate to tasks

#### Task 2.48: REFACTOR integrations-tab component

- **FILE**: `app/components/settings/integrations-tab.tsx`
- **IMPLEMENT**: Remove useEffect data fetching, receive data as prop from parent route loader
- **PATTERN**: Component should be pure, data comes from route
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.49: REFACTOR farms/selector component

- **FILE**: `app/components/farms/selector.tsx`
- **IMPLEMENT**: Remove useEffect data fetching, receive farms as prop
- **PATTERN**: Use farm context or prop drilling
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.50: VALIDATE Phase 2 completion

- **VALIDATE**:

  ```bash
  # All checks must pass
  npx tsc --noEmit || exit 1
  bun run lint || exit 1
  bun run test --run || exit 1

  # Manual testing
  # Navigate to all 15 refactored routes
  # Verify SSR (view page source, check for data)
  # Verify loading states (throttle network)
  # Verify error states (break server function temporarily)
  ```

---

### PHASE 3: CODE QUALITY & OPTIMIZATION (Week 3-4)

#### Task 3.1: FIX TypeScript error in onboarding/server.ts

- **FILE**: `app/features/onboarding/server.ts`
- **IMPLEMENT**: Remove unused `OnboardingProgress` import (line 10)
- **VALIDATE**: `npx tsc --noEmit`

#### Task 3.2: FIX TypeScript errors in sales/use-sales-page.ts

- **FILE**: `app/features/sales/use-sales-page.ts`
- **IMPLEMENT**: Add type validation for search parameters (lines 64-65)
- **PATTERN**: Use type guards or Zod parsing for URL search params
- **VALIDATE**: `npx tsc --noEmit`

```typescript
// Add type narrowing
const livestockType = searchParams.livestockType as
  | 'poultry'
  | 'fish'
  | 'eggs'
  | undefined
const paymentStatus = searchParams.paymentStatus as
  | 'paid'
  | 'pending'
  | 'partial'
  | undefined
```

#### Task 3.3: OPTIMIZE getRelatedRecords N+1 query

- **FILE**: `app/features/batches/repository.ts`
- **IMPLEMENT**: Combine 4 separate queries into single query with LEFT JOINs
- **PATTERN**: Use COUNT with DISTINCT and CASE for boolean results
- **VALIDATE**: `bun run test tests/features/batches/`

```typescript
// Replace 4 queries with 1
export async function getRelatedRecords(db: Kysely<Database>, batchId: string) {
  const result = await db
    .selectFrom('batches as b')
    .leftJoin('feed_records as fr', 'fr.batchId', 'b.id')
    .leftJoin('egg_records as er', 'er.batchId', 'b.id')
    .leftJoin('sales as s', 's.batchId', 'b.id')
    .leftJoin('mortality_records as mr', 'mr.batchId', 'b.id')
    .select([
      sql<boolean>`COUNT(DISTINCT fr.id) > 0`.as('hasFeedRecords'),
      sql<boolean>`COUNT(DISTINCT er.id) > 0`.as('hasEggRecords'),
      sql<boolean>`COUNT(DISTINCT s.id) > 0`.as('hasSales'),
      sql<boolean>`COUNT(DISTINCT mr.id) > 0`.as('hasMortality'),
    ])
    .where('b.id', '=', batchId)
    .groupBy('b.id')
    .executeTakeFirst()

  return (
    result || {
      hasFeedRecords: false,
      hasEggRecords: false,
      hasSales: false,
      hasMortality: false,
    }
  )
}
```

#### Task 3.4: VALIDATE Phase 3 completion

- **VALIDATE**:
  ```bash
  npx tsc --noEmit || exit 1
  bun run lint || exit 1
  bun run test --run || exit 1
  ```

---

### PHASE 4: VALIDATION & DOCUMENTATION (Week 4)

#### Task 4.1: RUN comprehensive test suite

- **VALIDATE**:

  ```bash
  # All tests must pass
  bun run test --run || exit 1

  # Check coverage
  bun run test --coverage

  # Verify no regressions
  # All 1,305+ tests should pass
  ```

#### Task 4.2: MANUAL testing of all refactored routes

- **TEST**: Navigate to each of the 15 refactored routes
- **VERIFY**:
  - Data loads correctly
  - Loading states show (throttle network to 3G)
  - Error states work (temporarily break server function)
  - SSR works (view page source, check for pre-rendered data)
  - Prefetching works (hover over links, check Network tab)

#### Task 4.3: UPDATE AGENTS.md documentation

- **FILE**: `AGENTS.md`
- **IMPLEMENT**: Add section documenting the remediation patterns
- **CONTENT**:
  - Summary of changes made
  - New patterns established
  - Migration guide for future features
- **VALIDATE**: Review for completeness

#### Task 4.4: CREATE migration guide

- **FILE**: `.agents/MIGRATION-GUIDE.md`
- **IMPLEMENT**: Document how to migrate remaining routes (if any)
- **CONTENT**:
  - Step-by-step migration process
  - Common pitfalls
  - Testing checklist
- **VALIDATE**: Review with team

#### Task 4.5: FINAL validation

- **VALIDATE**:

  ```bash
  # Complete validation suite
  npx tsc --noEmit || exit 1
  bun run lint || exit 1
  bun run test --run || exit 1
  bun run build || exit 1

  # Database validation
  bun run db:migrate

  # Manual smoke tests
  # - Login
  # - Navigate to all major routes
  # - Create/edit/delete operations
  # - Verify no console errors
  ```

---

## TESTING STRATEGY

### Unit Tests

**Coverage Targets:**

- Financial calculations: 100%
- Business logic: 90%
- Server functions: 80%
- Overall: 80%+

**Test Files to Update:**

- `tests/features/batches/batches.test.ts` - Pagination tests
- `tests/features/expenses/expenses.test.ts` - Pagination tests
- `tests/features/sales/sales.test.ts` - Pagination tests
- All feature test files - Validator tests

**New Tests to Create:**

- Test pagination edge cases (page 0, negative page, page > totalPages)
- Test validator rejection (invalid UUIDs, missing required fields)
- Test loader data access in components
- Test skeleton component rendering

### Integration Tests

**Database Tests:**

- Verify indexes exist and improve query performance
- Test pagination with large datasets (1000+ records)
- Verify N+1 query optimization reduces query count

**Route Tests:**

- Test SSR for all refactored routes
- Verify loader data is available in components
- Test error boundaries with broken server functions
- Test prefetching behavior

### Manual Testing Checklist

**For Each Refactored Route:**

- [ ] Navigate to route - data loads correctly
- [ ] Throttle network to Slow 3G - skeleton shows
- [ ] Hover over links - prefetch triggers (check Network tab)
- [ ] Break server function - error component shows
- [ ] View page source - data is pre-rendered (SSR)
- [ ] Check console - no errors or warnings
- [ ] Test search/filter functionality
- [ ] Test pagination controls
- [ ] Test CRUD operations (create, edit, delete)

**Performance Testing:**

- [ ] Navigate to batches with 1000+ records - loads quickly
- [ ] Filter by livestock type - query is fast
- [ ] Sort by acquisition date - query is fast
- [ ] Check database query logs - indexes are used

---

## VALIDATION COMMANDS

### Phase 1 Validation

```bash
# After each task
npx tsc --noEmit || exit 1

# After adding validators
bun run test tests/features/{feature}/ || exit 1

# After database migration
bun run db:migrate
neon__get_database_tables
neon__describe_table_schema batches
neon__describe_table_schema sales
neon__describe_table_schema expenses

# Phase 1 complete
npx tsc --noEmit && bun run lint && bun run test --run && bun run build
```

### Phase 2 Validation

```bash
# After each route refactor
npx tsc --noEmit || exit 1
bun run test tests/features/{feature}/ || exit 1

# Manual testing
# 1. Start dev server: bun dev
# 2. Navigate to refactored route
# 3. Open DevTools Network tab
# 4. Verify SSR (check Response tab for pre-rendered HTML)
# 5. Throttle to Slow 3G
# 6. Verify skeleton shows during load
# 7. Hover over links
# 8. Verify prefetch requests in Network tab

# Phase 2 complete
npx tsc --noEmit && bun run lint && bun run test --run && bun run build
```

### Phase 3 Validation

```bash
# TypeScript errors fixed
npx tsc --noEmit || exit 1

# N+1 query optimization
bun run test tests/features/batches/batches.test.ts || exit 1

# Phase 3 complete
npx tsc --noEmit && bun run lint && bun run test --run && bun run build
```

### Phase 4 Validation

```bash
# Complete validation suite
npx tsc --noEmit || exit 1
bun run lint || exit 1
bun run test --run || exit 1
bun run test --coverage || exit 1
bun run build || exit 1

# Database validation
bun run db:migrate

# Verify all 1,305+ tests pass
# Verify coverage meets targets
# Verify build succeeds
```

### Continuous Validation

```bash
# Run after every commit
bun run check && bun run test --run
```

---

## ACCEPTANCE CRITERIA

### Phase 1: Critical Infrastructure ✓

- [ ] Pagination added to 3 repository functions
  - [ ] `getBatchesByFarm` returns paginated results
  - [ ] `getExpensesByFarm` returns paginated results
  - [ ] `getSalesByFarm` returns paginated results
- [ ] 4 database indexes created
  - [ ] `idx_batches_livestock_type` exists
  - [ ] `idx_sales_livestock_type` exists
  - [ ] `idx_expenses_category` exists
  - [ ] `idx_batches_acquisition_date` exists
- [ ] 21 server functions have Zod validators
  - [ ] auth (3 functions)
  - [ ] farms (2 functions)
  - [ ] integrations (1 function)
  - [ ] notifications (1 function)
  - [ ] onboarding (5 functions)
  - [ ] settings (8 functions)
  - [ ] suppliers (1 function)
  - [ ] users (1 function)
- [ ] 4 identity validators standardized to direct Zod
- [ ] All validation commands pass
- [ ] No regressions (all tests pass)

### Phase 2: TanStack Router Standardization ✓

- [ ] 15 routes refactored to use loaders
  - [ ] customers, customers/$customerId
  - [ ] expenses
  - [ ] feed
  - [ ] eggs
  - [ ] inventory
  - [ ] invoices
  - [ ] mortality
  - [ ] sales
  - [ ] settings
  - [ ] suppliers
  - [ ] vaccinations
  - [ ] water-quality
  - [ ] weight
- [ ] 12 custom hooks refactored (data fetching removed)
  - [ ] use-weight-page
  - [ ] use-supplier-page
  - [ ] use-sales-page
  - [ ] use-invoice-page
  - [ ] use-expense-page
  - [ ] use-water-quality-page
  - [ ] use-feed-page
  - [ ] use-feed-inventory
  - [ ] use-medication-inventory
  - [ ] use-mortality-page
  - [ ] use-egg-page
  - [ ] use-health-data
- [ ] 9 routes have pendingComponent added
  - [ ] farms (2 routes)
  - [ ] invoices/$invoiceId
  - [ ] onboarding
  - [ ] reports (2 routes)
  - [ ] settings (2 routes)
  - [ ] suppliers/$supplierId
  - [ ] tasks
- [ ] 2 components refactored
  - [ ] integrations-tab.tsx
  - [ ] farms/selector.tsx
- [ ] All routes support SSR (verified in page source)
- [ ] All routes support prefetching (verified in Network tab)
- [ ] All routes have loading states (skeleton components)
- [ ] All routes have error boundaries
- [ ] All validation commands pass
- [ ] No regressions (all tests pass)

### Phase 3: Code Quality & Optimization ✓

- [ ] 3 TypeScript errors fixed
  - [ ] onboarding/server.ts unused import removed
  - [ ] sales/use-sales-page.ts type mismatches fixed
- [ ] N+1 query optimized
  - [ ] `getRelatedRecords` uses single query with JOINs
  - [ ] Query count reduced from 4 to 1
- [ ] All validation commands pass
- [ ] No regressions (all tests pass)

### Phase 4: Validation & Documentation ✓

- [ ] Full test suite passes (1,305+ tests)
- [ ] Test coverage meets targets
  - [ ] Overall: 80%+
  - [ ] Business logic: 90%+
  - [ ] Financial: 100%
- [ ] Manual testing complete for all refactored routes
- [ ] AGENTS.md updated with remediation patterns
- [ ] Migration guide created
- [ ] Build succeeds
- [ ] No console errors in production build
- [ ] Database migrations applied successfully

### Overall Completion ✓

- [ ] 100% of audit findings addressed
- [ ] All 54 issues resolved
- [ ] All validation commands pass
- [ ] No regressions introduced
- [ ] Documentation updated
- [ ] Team trained on new patterns
- [ ] Ready for production deployment

---

## COMPLETION CHECKLIST

### Pre-Implementation

- [ ] Read audit report (`.agents/COMPREHENSIVE-AUDIT-2026-01-25.md`)
- [ ] Review TanStack Router patterns in `AGENTS.md`
- [ ] Understand OpenLivestock mandatory patterns
- [ ] Set up validation commands in terminal

### Phase 1 (Week 1)

- [ ] All pagination tasks complete (3 functions)
- [ ] Database migration created and applied (4 indexes)
- [ ] All validator tasks complete (25 functions)
- [ ] Phase 1 validation passes
- [ ] Commit: "feat: add pagination, indexes, and validators (Phase 1)"

### Phase 2 (Week 2-3)

- [ ] All route refactoring tasks complete (15 routes)
- [ ] All hook refactoring tasks complete (12 hooks)
- [ ] All pendingComponent tasks complete (9 routes)
- [ ] All component refactoring tasks complete (2 components)
- [ ] Phase 2 validation passes
- [ ] Manual testing complete
- [ ] Commit: "refactor: standardize TanStack Router patterns (Phase 2)"

### Phase 3 (Week 3-4)

- [ ] All TypeScript errors fixed (3 errors)
- [ ] N+1 query optimized
- [ ] Phase 3 validation passes
- [ ] Commit: "fix: resolve TypeScript errors and optimize queries (Phase 3)"

### Phase 4 (Week 4)

- [ ] Full test suite passes
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] Migration guide created
- [ ] Final validation passes
- [ ] Commit: "docs: update documentation and migration guide (Phase 4)"

### Post-Implementation

- [ ] Deploy to staging
- [ ] QA testing
- [ ] Performance testing
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Close audit tickets

---

## NOTES

### Design Decisions

**Phased Approach:**

- Each phase is independently deployable
- Allows for incremental progress and validation
- Reduces risk of large-scale refactoring
- Enables parallel work on different phases

**Pagination Strategy:**

- Default page size: 20 items
- Maximum page size: 100 items
- Consistent pagination structure across all features
- Backward compatible (existing code continues to work)

**Validator Strategy:**

- All validators use Zod for consistency
- Runtime validation prevents invalid data
- Better error messages for API consumers
- Type inference from Zod schemas

**Route Refactoring Strategy:**

- Create skeleton components first
- Refactor route to use loader
- Refactor hook to remove data fetching
- Test thoroughly before moving to next route
- Maintain backward compatibility during transition

### Trade-offs

**Performance vs. Complexity:**

- Pagination adds complexity but prevents performance issues
- Indexes improve read performance but slow writes (acceptable trade-off)
- N+1 query optimization reduces query count but increases query complexity

**Migration Risk:**

- Large-scale refactoring carries risk of regressions
- Mitigated by comprehensive testing and phased approach
- Each phase validated independently before proceeding

**Development Time:**

- 3-4 weeks is significant investment
- Benefits: Better performance, SSR, prefetching, consistency
- Long-term maintainability improvements justify the cost

### Future Considerations

**After Completion:**

- All new routes MUST follow TanStack Router patterns
- All new server functions MUST have Zod validators
- All new features MUST include pagination for list endpoints
- Consider adding ESLint rules to enforce patterns

**Monitoring:**

- Track page load times before/after refactoring
- Monitor database query performance with new indexes
- Track SSR success rate
- Monitor error rates for new error boundaries

**Documentation:**

- Keep AGENTS.md updated with new patterns
- Update onboarding docs for new developers
- Create video tutorials for complex patterns
- Maintain migration guide for future refactoring

---

## RISK ASSESSMENT

### High Risk

**Route Refactoring (15 routes):**

- **Risk:** Breaking existing functionality
- **Mitigation:** Comprehensive testing, phased rollout, feature flags
- **Rollback Plan:** Git revert, deploy previous version

**Hook Refactoring (12 hooks):**

- **Risk:** Components expecting data from hooks break
- **Mitigation:** Update all consumers simultaneously, test thoroughly
- **Rollback Plan:** Revert hook changes, redeploy

### Medium Risk

**Database Migration (4 indexes):**

- **Risk:** Migration fails on production database
- **Mitigation:** Test on staging first, backup database, run during low-traffic window
- **Rollback Plan:** Run down migration, restore from backup if needed

**Validator Addition (25 functions):**

- **Risk:** Existing API consumers break due to stricter validation
- **Mitigation:** Ensure validators match existing behavior, test with real data
- **Rollback Plan:** Remove validators, redeploy

### Low Risk

**TypeScript Error Fixes (3 errors):**

- **Risk:** Minimal, mostly cleanup
- **Mitigation:** Standard testing
- **Rollback Plan:** Simple revert

**N+1 Query Optimization:**

- **Risk:** Query returns incorrect results
- **Mitigation:** Comprehensive testing, compare results with old query
- **Rollback Plan:** Revert to original query

---

## SUCCESS METRICS

### Performance Metrics

**Before Remediation:**

- Page load time (batches): ~2-3s with 1000+ records
- Database queries per request: 4-5 for related records
- SSR support: 43% of routes
- Prefetching: Not available

**After Remediation (Targets):**

- Page load time (batches): <1s with pagination
- Database queries per request: 1 for related records (75% reduction)
- SSR support: 100% of routes
- Prefetching: Available on all routes

### Code Quality Metrics

**Before Remediation:**

- TypeScript errors: 3
- Routes with loaders: 43%
- Server functions with validators: ~75%
- Hooks following pattern: 37%

**After Remediation (Targets):**

- TypeScript errors: 0
- Routes with loaders: 100%
- Server functions with validators: 100%
- Hooks following pattern: 100%

### User Experience Metrics

**Before Remediation:**

- Loading states: Inconsistent
- Error handling: Inconsistent
- Prefetching: Not available
- SSR: Limited

**After Remediation (Targets):**

- Loading states: Consistent skeleton components
- Error handling: Consistent error boundaries
- Prefetching: Available on hover
- SSR: Full support

---

## CONFIDENCE SCORE

**One-Pass Implementation Success: 8/10**

**Reasoning:**

- ✅ Clear, detailed tasks with specific file paths
- ✅ Patterns well-documented with examples
- ✅ Validation commands at each step
- ✅ Phased approach reduces risk
- ✅ Comprehensive testing strategy
- ⚠️ Large scope (54 issues) increases complexity
- ⚠️ Some tasks depend on previous tasks completing correctly
- ⚠️ Manual testing required for full validation

**Risk Factors:**

- Scope is large (3-4 weeks of work)
- Multiple parallel changes increase merge conflict risk
- Some patterns may need adjustment during implementation

**Mitigation:**

- Execute phases sequentially
- Validate thoroughly after each phase
- Commit frequently with descriptive messages
- Use feature branches for each phase

---

**Plan Created:** January 25, 2026  
**Plan File:** `.agents/plans/complete-audit-remediation.md`  
**Estimated Duration:** 3-4 weeks (phased)  
**Total Tasks:** 50+ across 4 phases  
**Complexity:** High  
**Ready for Execution:** Yes ✓
