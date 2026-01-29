# Feature: Refactor TanStack Router Patterns for Consistency and Best Practices

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Refactor data fetching patterns across all routes to follow TanStack Router and TanStack Start best practices. Currently, the codebase has inconsistent data fetching patterns - some routes use loaders (correct), while others use useEffect + useState (bypasses TanStack benefits). This refactoring will standardize all routes to use loaders, add proper loading states with pendingComponent, standardize server function validators to Zod, and improve SSR/prefetching capabilities.

## User Story

As a developer maintaining LivestockAI Manager
I want consistent data fetching patterns across all routes
So that the application benefits from SSR, prefetching, proper loading states, and maintainable code

## Problem Statement

The codebase currently has three different data fetching patterns:

1. **Route loaders** (farms, invoices, reports) - ✅ Correct TanStack way
2. **useEffect + useState** (dashboard, batches) - ❌ Bypasses TanStack benefits (no SSR, no prefetching, manual loading states)
3. **useQuery** (modules, notifications) - ⚠️ OK for global state, but inconsistent

This inconsistency leads to:

- No SSR for client-side fetched routes
- Extra round-trips after navigation
- No prefetching on hover
- Manual loading state management
- Inconsistent user experience
- Harder maintenance

## Solution Statement

Standardize all routes to use TanStack Router loaders with server functions. This provides:

- **SSR**: Data loaded on server, sent with initial HTML
- **Prefetching**: Data loads on hover before navigation
- **Automatic loading states**: pendingComponent handles loading UI
- **Type safety**: Zod validation on all server function inputs
- **Consistency**: Same pattern across all routes
- **Better UX**: Instant navigation with cached data

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**:

- Routes (batches, dashboard, batch detail)
- Custom hooks (use-batch-page, use-dashboard, use-batch-details)
- Server functions (validator patterns)

**Dependencies**:

- TanStack Router v1
- TanStack Start
- Zod (already in use)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**Current Patterns (Good Examples)**:

- `app/routes/_auth/farms/index.tsx` - ✅ Correct loader pattern with server function
- `app/routes/_auth/invoices/index.tsx` - ✅ Correct loader pattern
- `app/routes/_auth/reports/index.tsx` - ✅ Correct loader with validateSearch and loaderDeps
- `app/features/farms/server.ts` (lines 1-50) - ✅ Server function with Zod validator

**Needs Refactoring**:

- `app/routes/_auth/batches/index.tsx` - ❌ Uses useBatchPage hook with useEffect
- `app/routes/_auth/batches/$batchId/index.tsx` - ❌ No loader, uses useBatchDetails hook
- `app/routes/_auth/dashboard/index.tsx` - ❌ Uses useDashboard hook with useEffect
- `app/features/batches/use-batch-page.ts` (lines 1-100) - ❌ Manual state management
- `app/features/batches/use-batch-details.ts` (lines 1-80) - ❌ Manual state management
- `app/features/dashboard/use-dashboard.ts` (lines 1-120) - ❌ Manual state management

**Server Functions**:

- `app/features/batches/server.ts` (lines 450-480) - `getBatchesForFarmFn` - needs Zod validator check
- `app/features/batches/server.ts` (lines 500-520) - `getBatchDetailsFn` - needs Zod validator check
- `app/features/dashboard/server.ts` (lines 1-100) - Dashboard server functions

### New Files to Create

None - this is a refactoring task

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [TanStack Router Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)
  - Specific sections: "Route loaders", "Consuming data from loaders", "Using loaderDeps", "Showing a pending component"
  - Why: Official guide for loader patterns and best practices

- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
  - Specific section: "Server functions let you define server-only logic"
  - Why: Understanding server function execution model

- [TanStack Router Deferred Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/deferred-data-loading)
  - Specific section: "Deferred data loading pattern"
  - Why: For handling slow loaders without blocking navigation

- [CodeStandUp TanStack Tutorial](https://codestandup.com/posts/2026/tanstack-tutorial-loader-and-server-functions/)
  - Specific sections: "Loader Functions", "Handling Errors", "Showing Loading States"
  - Why: Practical examples of loader patterns

### Patterns to Follow

**Loader Pattern (from farms route)**:

```typescript
// app/routes/_auth/farms/index.tsx
export const Route = createFileRoute('/_auth/farms/')({
  loader: async () => {
    return getFarmsForUserFn()
  },
  pendingComponent: () => <div>Loading farms...</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  component: FarmsPage,
})

function FarmsPage() {
  const farms = Route.useLoaderData()
  // No loading state needed - TanStack handles it
}
```

**Loader with Search Params (from reports route)**:

```typescript
// app/routes/_auth/reports/index.tsx
export const Route = createFileRoute('/_auth/reports/')({
  validateSearch: validateReportSearch,
  loaderDeps: ({ search }) => ({
    reportType: search.reportType,
    dateRange: search.dateRange,
  }),
  loader: async ({ deps }) => {
    return getReportDataFn({ data: deps })
  },
  pendingComponent: ReportSkeleton,
  component: ReportsPage,
})
```

**Server Function with Zod Validator**:

```typescript
// app/features/*/server.ts
export const getDataFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      page: z.number().int().positive().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { db } = await import('~/lib/db')
    // Implementation
  })
```

**pendingComponent Pattern**:

```typescript
// Simple loading
pendingComponent: () => <div>Loading...</div>

// Skeleton loader (better UX)
pendingComponent: () => <BatchesSkeleton />

// With minimum display time (avoid flash)
// Default: pendingMs: 1000, pendingMinMs: 500
```

**Error Handling Pattern**:

```typescript
errorComponent: ({ error, reset }) => {
  const router = useRouter()

  return (
    <div>
      <p>{error.message}</p>
      <button onClick={() => router.invalidate()}>
        Retry
      </button>
    </div>
  )
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Audit and Prepare

Identify all routes using client-side data fetching patterns and document their current behavior.

**Tasks:**

- Audit all routes in `app/routes/_auth/` for data fetching patterns
- Document which routes use loaders vs useEffect
- Identify server functions that need Zod validators
- Create skeleton components for pendingComponent

### Phase 2: Refactor Batches Routes

Refactor batches index and detail routes to use loaders instead of custom hooks.

**Tasks:**

- Refactor `app/routes/_auth/batches/index.tsx` to use loader
- Refactor `app/routes/_auth/batches/$batchId/index.tsx` to use loader
- Update `getBatchesForFarmFn` validator to use Zod
- Update `getBatchDetailsFn` validator to use Zod
- Create `BatchesSkeleton` component for pendingComponent
- Deprecate or simplify `use-batch-page.ts` and `use-batch-details.ts`

### Phase 3: Refactor Dashboard Route

Refactor dashboard route to use loader instead of useDashboard hook.

**Tasks:**

- Refactor `app/routes/_auth/dashboard/index.tsx` to use loader
- Update dashboard server functions with Zod validators
- Create `DashboardSkeleton` component for pendingComponent
- Deprecate or simplify `use-dashboard.ts`

### Phase 4: Standardize Server Function Validators

Ensure all server functions use Zod validators instead of identity functions.

**Tasks:**

- Audit all server functions for validator patterns
- Replace identity function validators with Zod schemas
- Add input validation tests

### Phase 5: Testing & Validation

Verify all refactored routes work correctly with SSR, prefetching, and loading states.

**Tasks:**

- Test SSR for refactored routes
- Test prefetching on hover
- Test loading states (pendingComponent)
- Test error states (errorComponent)
- Verify no regressions in existing functionality

---

## STEP-BY-STEP TASKS

### Task 1: CREATE BatchesSkeleton component

- **IMPLEMENT**: Skeleton loader component for batches list
- **PATTERN**: Similar to existing skeleton patterns in codebase
- **LOCATION**: `app/components/batches/batches-skeleton.tsx`
- **IMPORTS**: `import { Skeleton } from '~/components/ui/skeleton'`
- **VALIDATE**: Component renders without errors

```typescript
// app/components/batches/batches-skeleton.tsx
export function BatchesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### Task 2: UPDATE getBatchesForFarmFn validator to Zod

- **IMPLEMENT**: Replace identity function validator with Zod schema
- **PATTERN**: See `app/features/farms/server.ts` for Zod validator example
- **FILE**: `app/features/batches/server.ts` (line ~450)
- **GOTCHA**: Ensure all optional fields are marked with `.optional()`
- **VALIDATE**: `bun run check` passes

```typescript
// Before
.inputValidator((data: { farmId?: string, page?: number }) => data)

// After
.inputValidator(z.object({
  farmId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  livestockType: z.string().optional(),
}))
```

### Task 3: UPDATE getBatchDetailsFn validator to Zod

- **IMPLEMENT**: Replace identity function validator with Zod schema
- **FILE**: `app/features/batches/server.ts` (line ~500)
- **VALIDATE**: `bun run check` passes

```typescript
.inputValidator(z.object({
  batchId: z.string().uuid(),
}))
```

### Task 4: REFACTOR batches index route to use loader

- **IMPLEMENT**: Move data fetching from useBatchPage hook to route loader
- **FILE**: `app/routes/_auth/batches/index.tsx`
- **PATTERN**: Follow `app/routes/_auth/farms/index.tsx` pattern
- **IMPORTS**: Remove `useBatchPage`, add `Route.useLoaderData()`
- **GOTCHA**: Search params must be accessed via `loaderDeps`, not directly in loader
- **VALIDATE**: Navigate to `/batches` and verify data loads

```typescript
// app/routes/_auth/batches/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getBatchesForFarmFn } from '~/features/batches/server'
import { BatchesSkeleton } from '~/components/batches/batches-skeleton'
import { validateBatchSearch } from '~/features/batches/validation'

export const Route = createFileRoute('/_auth/batches/')({
  validateSearch: validateBatchSearch,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.search,
    status: search.status,
    livestockType: search.livestockType,
  }),
  loader: async ({ deps }) => {
    return getBatchesForFarmFn({ data: deps })
  },
  pendingComponent: BatchesSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading batches: {error.message}
    </div>
  ),
  component: BatchesPage,
})

function BatchesPage() {
  const { paginatedBatches, summary } = Route.useLoaderData()
  // Component implementation - no loading state needed
}
```

### Task 5: CREATE BatchDetailSkeleton component

- **IMPLEMENT**: Skeleton loader for batch detail page
- **LOCATION**: `app/components/batches/batch-detail-skeleton.tsx`
- **VALIDATE**: Component renders without errors

### Task 6: REFACTOR batch detail route to use loader

- **IMPLEMENT**: Add loader to batch detail route
- **FILE**: `app/routes/_auth/batches/$batchId/index.tsx`
- **PATTERN**: Use path params via `params` in loader
- **GOTCHA**: No loaderDeps needed for path params - they're always available
- **VALIDATE**: Navigate to `/batches/[id]` and verify data loads

```typescript
// app/routes/_auth/batches/$batchId/index.tsx
export const Route = createFileRoute('/_auth/batches/$batchId/')({
  loader: async ({ params }) => {
    return getBatchDetailsFn({ data: { batchId: params.batchId } })
  },
  pendingComponent: BatchDetailSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading batch: {error.message}
    </div>
  ),
  component: BatchDetailsPage,
})

function BatchDetailsPage() {
  const batchData = Route.useLoaderData()
  // Component implementation
}
```

### Task 7: CREATE DashboardSkeleton component

- **IMPLEMENT**: Skeleton loader for dashboard
- **LOCATION**: `app/components/dashboard/dashboard-skeleton.tsx`
- **VALIDATE**: Component renders without errors

### Task 8: UPDATE dashboard server functions with Zod validators

- **IMPLEMENT**: Add Zod validators to all dashboard server functions
- **FILE**: `app/features/dashboard/server.ts`
- **PATTERN**: Same as batches server functions
- **VALIDATE**: `bun run check` passes

### Task 9: REFACTOR dashboard route to use loader

- **IMPLEMENT**: Move data fetching from useDashboard hook to route loader
- **FILE**: `app/routes/_auth/dashboard/index.tsx`
- **PATTERN**: Follow batches index pattern
- **GOTCHA**: Dashboard may have multiple data sources - consider using Promise.all in loader
- **VALIDATE**: Navigate to `/dashboard` and verify all data loads

```typescript
// app/routes/_auth/dashboard/index.tsx
export const Route = createFileRoute('/_auth/dashboard/')({
  validateSearch: validateDashboardSearch,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
    dateRange: search.dateRange,
  }),
  loader: async ({ deps }) => {
    // Fetch multiple data sources in parallel
    const [stats, alerts, recentActivity] = await Promise.all([
      getDashboardStatsFn({ data: deps }),
      getDashboardAlertsFn({ data: deps }),
      getRecentActivityFn({ data: deps }),
    ])

    return { stats, alerts, recentActivity }
  },
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
})
```

### Task 10: AUDIT remaining server functions for validator patterns

- **IMPLEMENT**: Search codebase for `.inputValidator((data:` pattern (identity functions)
- **COMMAND**: `grep -r "inputValidator((data:" app/features/*/server.ts`
- **DOCUMENT**: List all server functions that need Zod validators
- **VALIDATE**: Create list of files to update

### Task 11: UPDATE remaining server functions with Zod validators

- **IMPLEMENT**: Replace all identity function validators with Zod schemas
- **FILES**: All server functions identified in Task 10
- **PATTERN**: Follow batches server function pattern
- **VALIDATE**: `bun run check` passes for each file

### Task 12: DEPRECATE or SIMPLIFY custom hooks

- **IMPLEMENT**: Remove or simplify hooks that are no longer needed
- **FILES**:
  - `app/features/batches/use-batch-page.ts`
  - `app/features/batches/use-batch-details.ts`
  - `app/features/dashboard/use-dashboard.ts`
- **GOTCHA**: Check if hooks have other responsibilities (mutations, local state) before removing
- **DECISION**: If hooks only handle data fetching, remove them. If they handle mutations/local state, keep but remove data fetching logic
- **VALIDATE**: `bun run check` passes, no unused imports

### Task 13: ADD staleTime configuration to router

- **IMPLEMENT**: Configure default staleTime for better caching
- **FILE**: `app/router.tsx`
- **PATTERN**: TanStack Router cache configuration
- **VALIDATE**: Router initializes without errors

```typescript
// app/router.tsx
const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 30_000, // 30 seconds for preloads
  defaultStaleTime: 0, // Always revalidate on navigation (current behavior)
  // Or set to 10_000 for 10 second cache
})
```

### Task 14: TEST SSR for refactored routes

- **IMPLEMENT**: Verify routes render on server
- **COMMAND**: `bun run build && bun run preview`
- **VALIDATE**:
  - View page source for `/batches` - should contain data
  - View page source for `/dashboard` - should contain data
  - View page source for `/batches/[id]` - should contain data

### Task 15: TEST prefetching on hover

- **IMPLEMENT**: Verify prefetching works
- **MANUAL TEST**:
  1. Navigate to a page with links to batches
  2. Hover over a batch link (don't click)
  3. Open Network tab - should see prefetch request
  4. Click link - should navigate instantly
- **VALIDATE**: Prefetch requests appear in Network tab

### Task 16: TEST loading states

- **IMPLEMENT**: Verify pendingComponent displays correctly
- **MANUAL TEST**:
  1. Throttle network to "Slow 3G" in DevTools
  2. Navigate to `/batches`
  3. Should see BatchesSkeleton for ~1 second
  4. Then see actual content
- **VALIDATE**: Skeleton displays, then content loads

### Task 17: TEST error states

- **IMPLEMENT**: Verify errorComponent displays correctly
- **MANUAL TEST**:
  1. Temporarily break a server function (throw error)
  2. Navigate to that route
  3. Should see error message
  4. Click retry button - should reload
- **VALIDATE**: Error displays, retry works

### Task 18: RUN full test suite

- **IMPLEMENT**: Ensure no regressions
- **COMMAND**: `bun run test --run`
- **VALIDATE**: All tests pass

### Task 19: RUN type checking

- **IMPLEMENT**: Ensure no type errors
- **COMMAND**: `bun run check`
- **VALIDATE**: No TypeScript errors

### Task 20: RUN build verification

- **IMPLEMENT**: Ensure production build works
- **COMMAND**: `bun run build`
- **VALIDATE**: Build completes successfully

---

## TESTING STRATEGY

### Unit Tests

**Location**: `tests/features/batches/`, `tests/features/dashboard/`
**Framework**: Vitest
**Coverage Target**: 80%+

Test patterns:

- Server function validators (Zod schemas)
- Error handling in loaders
- Data transformation logic

Example test:

```typescript
// tests/features/batches/server-validators.test.ts
import { describe, it, expect } from 'vitest'
import { getBatchesForFarmFn } from '~/features/batches/server'

describe('getBatchesForFarmFn validator', () => {
  it('should accept valid input', () => {
    const input = {
      farmId: '123e4567-e89b-12d3-a456-426614174000',
      page: 1,
      pageSize: 10,
    }
    // Validator should not throw
    expect(() => getBatchesForFarmFn({ data: input })).not.toThrow()
  })

  it('should reject invalid UUID', () => {
    const input = {
      farmId: 'invalid-uuid',
      page: 1,
    }
    // Validator should throw
    expect(() => getBatchesForFarmFn({ data: input })).toThrow()
  })
})
```

### Integration Tests

**Scope**: Route loaders with server functions
**Pattern**: Test loader execution and data flow

Example test:

```typescript
// tests/integration/batches-route.integration.test.ts
import { describe, it, expect } from 'vitest'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from '~/routeTree.gen'

describe('Batches route loader', () => {
  it('should load batch data', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory(),
    })

    await router.navigate({ to: '/batches' })
    await router.load()

    const loaderData = router.state.matches[0]?.loaderData
    expect(loaderData).toBeDefined()
    expect(loaderData.paginatedBatches).toBeDefined()
  })
})
```

### Manual Testing Checklist

- [ ] Navigate to `/batches` - data loads, skeleton shows briefly
- [ ] Navigate to `/batches/[id]` - batch details load
- [ ] Navigate to `/dashboard` - all dashboard data loads
- [ ] Hover over batch link - prefetch request fires
- [ ] Click batch link - instant navigation
- [ ] Throttle network - skeleton displays for slow loads
- [ ] Break server function - error component displays
- [ ] Click retry button - data reloads
- [ ] View page source - SSR data present
- [ ] Navigate back/forward - cached data used

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
# Type checking (fail fast)
npx tsc --noEmit || exit 1

# Linting (fail fast)
bun run lint || exit 1
```

### Level 2: Unit Tests

```bash
# Run all tests (fail fast)
bun run test --run || exit 1

# Run specific test file
bun run test tests/features/batches/server-validators.test.ts
```

### Level 3: Build Verification

```bash
# Verify production build works
bun run build || exit 1

# Preview production build
bun run preview
```

### Level 4: Manual Validation

**SSR Verification**:

```bash
# Build and preview
bun run build && bun run preview

# Check page source for data
curl http://localhost:3000/batches | grep "paginatedBatches"
```

**Network Tab Verification**:

1. Open DevTools Network tab
2. Navigate to page with batch links
3. Hover over link (don't click)
4. Verify prefetch request appears
5. Click link - should navigate instantly

### Complete Validation

```bash
# Run all checks
bun run check && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All routes use loaders instead of useEffect for data fetching
- [ ] All server functions use Zod validators (no identity functions)
- [ ] All routes have pendingComponent defined
- [ ] All routes have errorComponent defined
- [ ] SSR works for all refactored routes (data in page source)
- [ ] Prefetching works on hover
- [ ] Loading states display correctly (skeleton → content)
- [ ] Error states display correctly with retry functionality
- [ ] All validation commands pass: `bun run check && bun run test --run && bun run build`
- [ ] No regressions in existing functionality (all 1,306 tests pass)
- [ ] Code follows LivestockAI patterns:
  - [ ] Dynamic imports in server functions
  - [ ] AppError for error handling
  - [ ] Zod validation on all server function inputs
  - [ ] Type-safe loaders with Route.useLoaderData()
- [ ] Performance improved:
  - [ ] Faster initial page loads (SSR)
  - [ ] Instant navigation with prefetching
  - [ ] Better perceived performance (skeleton loaders)

---

## COMPLETION CHECKLIST

- [ ] All 20 tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability
- [ ] SSR verified in production build
- [ ] Prefetching verified in browser
- [ ] Loading states verified with throttled network
- [ ] Error states verified with broken server functions

---

## NOTES

### Design Decisions

**Why loaders over useEffect?**

- SSR: Data available on initial page load
- Prefetching: Data loads before navigation
- Type safety: Loader data is type-safe via Route.useLoaderData()
- Consistency: Same pattern across all routes
- Better UX: Instant navigation with cached data

**Why Zod validators?**

- Type safety: Input validation with TypeScript inference
- Runtime safety: Catches invalid data before it reaches handler
- Consistency: Same validation pattern across all server functions
- Better errors: Clear validation error messages

**Why pendingComponent?**

- Better UX: Shows loading state instead of blank page
- Consistency: Same loading pattern across all routes
- Configurable: Can adjust pendingMs and pendingMinMs per route

**Stale-While-Revalidate Strategy**:

- Default staleTime: 0 (always revalidate on navigation)
- Default preloadStaleTime: 30 seconds (prefetches cached for 30s)
- Can be adjusted per route if needed

### Trade-offs

**Pros**:

- ✅ Better SSR and SEO
- ✅ Faster perceived performance
- ✅ Consistent patterns
- ✅ Type-safe data flow
- ✅ Automatic loading states

**Cons**:

- ⚠️ More boilerplate per route (loader, pendingComponent, errorComponent)
- ⚠️ Learning curve for developers unfamiliar with TanStack Router
- ⚠️ Requires understanding of loaderDeps for search params

### Future Enhancements

- Consider using deferred data loading for slow queries
- Add optimistic UI updates for mutations
- Implement route-specific staleTime configuration
- Add loading progress indicators for long-running loaders
- Consider using TanStack Query for more complex caching needs

### References

- [TanStack Router Data Loading Guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)
- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [CodeStandUp TanStack Tutorial](https://codestandup.com/posts/2026/tanstack-tutorial-loader-and-server-functions/)
- [TanStack Router Deferred Data](https://tanstack.com/router/latest/docs/framework/react/guide/deferred-data-loading)
