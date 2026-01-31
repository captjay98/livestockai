# Feature: Migrate Routes to TanStack Router Loaders

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Migrate 11 routes from client-side `useQuery` data fetching to server-side TanStack Router loaders. This improves SSR support, enables prefetching, provides better loading states, and follows modern TanStack Router best practices.

## User Story

As a developer maintaining LivestockAI
I want all routes to use server-side loaders for data fetching
So that we have consistent SSR support, better performance through prefetching, and improved user experience with proper loading/error states

## Problem Statement

Currently, 11 routes use client-side `useQuery` for data fetching instead of TanStack Router loaders. This creates several issues:

1. **No SSR**: Data isn't fetched on the server, causing slower initial page loads
2. **No prefetching**: Router can't prefetch data when hovering over links
3. **Inconsistent loading states**: Each route implements loading differently
4. **Mixed patterns**: Some routes have loaders AND useQuery (confusing)
5. **Poor UX**: Users see loading spinners instead of skeleton screens

**Current State:**

- 75 total routes
- 44 routes with loaders (58%) ✅
- 13 routes using useQuery (17%) ❌
- 11 routes need migration (2 already have loaders, just need cleanup)

## Solution Statement

Migrate each route to use the TanStack Router loader pattern:

1. Add `loader` function to fetch data on server
2. Add `loaderDeps` to track search param dependencies
3. Add `pendingComponent` for skeleton loading state
4. Add `errorComponent` for error handling
5. Replace `useQuery` with `Route.useLoaderData()`
6. Remove client-side data fetching logic

This creates a consistent, performant, SSR-compatible data fetching pattern across all routes.

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**:

- Routes (11 files)
- Data fetching patterns
- Loading states
- Error handling

**Dependencies**:

- TanStack Router (already installed)
- TanStack Query (already installed)
- Existing server functions (no changes needed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**Reference Patterns (GOOD examples to follow):**

- `app/routes/_auth/dashboard/index.tsx` (lines 1-40) - Why: Perfect loader pattern with pendingComponent and errorComponent
- `app/routes/_auth/expenses/index.tsx` (lines 1-80) - Why: Complete pattern with loaderDeps, parallel data fetching, and skeleton
- `app/components/dashboard/dashboard-skeleton.tsx` - Why: Skeleton component pattern
- `app/components/batches/batches-skeleton.tsx` - Why: Simple skeleton using DataTableSkeleton
- `app/features/batches/validation.ts` - Why: Search param validation pattern with createSearchValidator

**Routes to Migrate (11 files):**

1. `app/routes/_auth/weight/index.tsx` - Weight samples list
2. `app/routes/_auth/sensors/index.tsx` - Sensors list
3. `app/routes/_auth/tasks/index.tsx` - Tasks list
4. `app/routes/_auth/water-quality/index.tsx` - Water quality records
5. `app/routes/_auth/feed/index.tsx` - Feed records
6. `app/routes/_auth/worker.tsx` - Worker check-in status
7. `app/routes/_auth/credit-passport/index.tsx` - Credit passport overview
8. `app/routes/_auth/vaccinations/index.tsx` - Vaccination records
9. `app/routes/_auth/batches/index.tsx` - Batches list (HIGH PRIORITY)
10. `app/routes/_auth/farms.$farmId.access.tsx` - Farm access management (has loader, needs cleanup)
11. `app/routes/_auth/feed-formulation/prices.tsx` - Feed prices (has loader, needs cleanup)

**Skeleton Components to Create:**

- `app/components/weight/weight-skeleton.tsx`
- `app/components/sensors/sensors-skeleton.tsx`
- `app/components/tasks/tasks-skeleton.tsx`
- `app/components/water-quality/water-quality-skeleton.tsx`
- `app/components/feed/feed-skeleton.tsx`
- `app/components/workers/worker-skeleton.tsx`
- `app/components/credit-passport/credit-passport-skeleton.tsx`
- `app/components/vaccinations/vaccinations-skeleton.tsx`

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [TanStack Router Loaders](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loaders)
  - Specific section: Data Loading with loaders
  - Why: Core pattern for server-side data fetching

- [TanStack Router Loader Dependencies](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-dependencies)
  - Specific section: loaderDeps for tracking search params
  - Why: Required for reactive data fetching based on URL changes

- [TanStack Router Pending Component](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#pending-component)
  - Specific section: pendingComponent for loading states
  - Why: Better UX than loading spinners

- [TanStack Router Error Component](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#error-component)
  - Specific section: errorComponent for error boundaries
  - Why: Consistent error handling

### Patterns to Follow

**LivestockAI Mandatory Patterns:**

#### **Route Loader Pattern (Complete)**

```typescript
// app/routes/_auth/{feature}/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { validateFeatureSearch } from '~/features/{feature}/validation'
import { getFeatureDataFn } from '~/features/{feature}/server'
import { FeatureSkeleton } from '~/components/{feature}/{feature}-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/{feature}/')({
  // 1. Validate search params
  validateSearch: validateFeatureSearch,

  // 2. Define loader dependencies (search params that trigger refetch)
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.q,
    // ... other search params
  }),

  // 3. Loader function - fetches data on server
  loader: async ({ deps }) => {
    return getFeatureDataFn({ data: deps })
  },

  // 4. Loading state component
  pendingComponent: FeatureSkeleton,

  // 5. Error state component
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),

  // 6. Main component
  component: FeaturePage,
})

function FeaturePage() {
  // Access loader data with full type safety
  const data = Route.useLoaderData()

  // Component logic...
  return <div>{/* Render data */}</div>
}
```

#### **Skeleton Component Pattern**

```typescript
// app/components/{feature}/{feature}-skeleton.tsx
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function FeatureSkeleton() {
  return <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
}
```

#### **Search Validation Pattern**

```typescript
// app/features/{feature}/validation.ts
import { createSearchValidator } from '~/lib/validation/search-params'

export const validateFeatureSearch = createSearchValidator({
  sortBy: ['field1', 'field2', 'field3'],
  status: ['active', 'inactive'],
  custom: {
    customField: z.string().optional(),
  },
})
```

#### **Migration Steps (Per Route)**

1. **Read current route** - Understand data fetching logic
2. **Create skeleton component** - Use DataTableSkeleton
3. **Add validateSearch** - If not exists, create in feature validation file
4. **Add loaderDeps** - Extract search params from useQuery queryKey
5. **Add loader** - Move queryFn logic to loader
6. **Add pendingComponent** - Reference skeleton
7. **Add errorComponent** - Use ErrorPage
8. **Replace useQuery** - Use Route.useLoaderData()
9. **Remove useQuery imports** - Clean up
10. **Test** - Verify data loads, loading state works, errors handled

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Skeleton Components)

Create reusable skeleton components for each feature. These provide consistent loading states.

**Tasks:**

- Create 8 skeleton components using DataTableSkeleton pattern
- Each skeleton should match the layout of its feature page
- Use existing DataTableSkeleton component for consistency

### Phase 2: High-Priority Routes (Batches)

Migrate the most critical route first - batches list. This is the core feature of LivestockAI.

**Tasks:**

- Migrate `app/routes/_auth/batches/index.tsx`
- This route is heavily used and sets the pattern for others
- Includes summary cards, filters, and pagination

### Phase 3: Data Entry Routes (Feed, Weight, Vaccinations, Water Quality)

Migrate routes used for daily data entry. These are frequently accessed by farmers.

**Tasks:**

- Migrate feed records route
- Migrate weight samples route
- Migrate vaccinations route
- Migrate water quality route

### Phase 4: Management Routes (Sensors, Tasks, Workers)

Migrate administrative and monitoring routes.

**Tasks:**

- Migrate sensors list route
- Migrate tasks list route
- Migrate worker check-in route

### Phase 5: Feature Routes (Credit Passport)

Migrate specialized feature routes.

**Tasks:**

- Migrate credit passport overview route

### Phase 6: Cleanup Mixed Patterns

Fix routes that have BOTH loaders and useQuery (mixed pattern).

**Tasks:**

- Clean up `app/routes/_auth/farms.$farmId.access.tsx`
- Clean up `app/routes/_auth/feed-formulation/prices.tsx`
- Remove useQuery, keep only loaders

### Phase 7: Validation & Testing

Verify all migrations work correctly.

**Tasks:**

- Run full test suite
- Manual testing of each migrated route
- Verify SSR works
- Verify loading states appear
- Verify error handling works

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Phase 1: Create Skeleton Components

### CREATE `app/components/weight/weight-skeleton.tsx`

- **IMPLEMENT**: Skeleton for weight samples list page
- **PATTERN**: Mirror `app/components/batches/batches-skeleton.tsx`
- **IMPORTS**: `import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'`
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function WeightSkeleton() {
  return <DataTableSkeleton summaryCards={3} hasFilters hasPagination />
}
```

### CREATE `app/components/sensors/sensors-skeleton.tsx`

- **IMPLEMENT**: Skeleton for sensors list page
- **PATTERN**: Same as weight skeleton
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function SensorsSkeleton() {
  return <DataTableSkeleton summaryCards={2} hasFilters hasPagination />
}
```

### CREATE `app/components/tasks/tasks-skeleton.tsx`

- **IMPLEMENT**: Skeleton for tasks list page
- **PATTERN**: Same as weight skeleton
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function TasksSkeleton() {
  return <DataTableSkeleton hasFilters hasPagination />
}
```

### CREATE `app/components/water-quality/water-quality-skeleton.tsx`

- **IMPLEMENT**: Skeleton for water quality records page
- **PATTERN**: Same as weight skeleton
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function WaterQualitySkeleton() {
  return <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
}
```

### CREATE `app/components/feed/feed-skeleton.tsx`

- **IMPLEMENT**: Skeleton for feed records page
- **PATTERN**: Same as weight skeleton
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function FeedSkeleton() {
  return <DataTableSkeleton summaryCards={3} hasFilters hasPagination />
}
```

### CREATE `app/components/workers/worker-skeleton.tsx`

- **IMPLEMENT**: Skeleton for worker check-in page
- **PATTERN**: Simple skeleton without table
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { Skeleton } from '~/components/ui/skeleton'

export function WorkerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### CREATE `app/components/credit-passport/credit-passport-skeleton.tsx`

- **IMPLEMENT**: Skeleton for credit passport overview page
- **PATTERN**: Cards layout skeleton
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { Skeleton } from '~/components/ui/skeleton'

export function CreditPassportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
```

### CREATE `app/components/vaccinations/vaccinations-skeleton.tsx`

- **IMPLEMENT**: Skeleton for vaccinations list page
- **PATTERN**: Same as weight skeleton
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function VaccinationsSkeleton() {
  return <DataTableSkeleton summaryCards={2} hasFilters hasPagination />
}
```

---

### Phase 2: Migrate Batches Route (HIGH PRIORITY)

### UPDATE `app/routes/_auth/batches/index.tsx`

- **IMPLEMENT**: Add loader, loaderDeps, pendingComponent, errorComponent
- **PATTERN**: Follow `app/routes/_auth/expenses/index.tsx` (lines 28-68)
- **IMPORTS**: Add `BatchesSkeleton`, `ErrorPage`
- **GOTCHA**: Keep mutation logic (useBatchMutations) - only replace data fetching
- **VALIDATE**: `bun dev` and navigate to /batches

**Changes:**

1. Add imports:

```typescript
import { BatchesSkeleton } from '~/components/batches/batches-skeleton'
import { ErrorPage } from '~/components/error-page'
```

2. Add to Route config (after validateSearch):

```typescript
loaderDeps: ({ search }) => ({
  farmId: search.farmId,
  page: search.page,
  pageSize: search.pageSize,
  sortBy: search.sortBy,
  sortOrder: search.sortOrder,
  search: search.q,
  status: search.status,
  livestockType: search.livestockType,
  breedId: search.breedId,
}),
loader: async ({ deps }) => {
  return getBatchesForFarmFn({ data: deps })
},
pendingComponent: BatchesSkeleton,
errorComponent: ({ error, reset }) => (
  <ErrorPage error={error} reset={reset} />
),
```

3. In BatchesPage component, replace useQuery:

```typescript
// REMOVE:
const { data, isLoading, error } = useQuery({
  queryKey: [...],
  queryFn: () => getBatchesForFarmFn({...}),
})

// REPLACE WITH:
const data = Route.useLoaderData()
```

4. Remove unused imports:

```typescript
// REMOVE: import { useQuery } from '@tanstack/react-query'
```

5. Update loading/error handling:

```typescript
// REMOVE: if (isLoading) return <BatchesSkeleton />
// REMOVE: if (error) return <ErrorPage error={error} />
// Loader handles this automatically
```

---

### Phase 3: Migrate Data Entry Routes

### UPDATE `app/routes/_auth/feed/index.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Same as batches migration
- **IMPORTS**: `FeedSkeleton`, `ErrorPage`
- **GOTCHA**: Check if server function exists, may need to read current queryFn
- **VALIDATE**: `bun dev` and navigate to /feed

**Steps:**

1. Read current file to understand data fetching
2. Create validation if missing: `app/features/feed/validation.ts`
3. Add loaderDeps matching useQuery queryKey
4. Move queryFn logic to loader
5. Add pendingComponent and errorComponent
6. Replace useQuery with Route.useLoaderData()
7. Remove loading/error conditionals

### UPDATE `app/routes/_auth/weight/index.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Same as batches migration
- **IMPORTS**: `WeightSkeleton`, `ErrorPage`
- **VALIDATE**: `bun dev` and navigate to /weight

**Steps:** Same as feed route

### UPDATE `app/routes/_auth/vaccinations/index.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Same as batches migration
- **IMPORTS**: `VaccinationsSkeleton`, `ErrorPage`
- **VALIDATE**: `bun dev` and navigate to /vaccinations

**Steps:** Same as feed route

### UPDATE `app/routes/_auth/water-quality/index.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Same as batches migration
- **IMPORTS**: `WaterQualitySkeleton`, `ErrorPage`
- **VALIDATE**: `bun dev` and navigate to /water-quality

**Steps:** Same as feed route

---

### Phase 4: Migrate Management Routes

### UPDATE `app/routes/_auth/sensors/index.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Same as batches migration
- **IMPORTS**: `SensorsSkeleton`, `ErrorPage`
- **VALIDATE**: `bun dev` and navigate to /sensors

**Steps:** Same as previous routes

### UPDATE `app/routes/_auth/tasks/index.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Same as batches migration
- **IMPORTS**: `TasksSkeleton`, `ErrorPage`
- **VALIDATE**: `bun dev` and navigate to /tasks

**Steps:** Same as previous routes

### UPDATE `app/routes/_auth/worker.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: Simpler - single data fetch
- **IMPORTS**: `WorkerSkeleton`, `ErrorPage`
- **GOTCHA**: This route may have different structure (not a list page)
- **VALIDATE**: `bun dev` and navigate to /worker

**Steps:**

1. Read current file to understand check-in status logic
2. Add loader to fetch check-in status
3. Add pendingComponent and errorComponent
4. Replace useQuery with Route.useLoaderData()

---

### Phase 5: Migrate Feature Routes

### UPDATE `app/routes/_auth/credit-passport/index.tsx`

- **IMPLEMENT**: Add loader pattern
- **PATTERN**: May need parallel data fetching (batches + passport data)
- **IMPORTS**: `CreditPassportSkeleton`, `ErrorPage`
- **GOTCHA**: This route fetches batches - use Promise.all in loader
- **VALIDATE**: `bun dev` and navigate to /credit-passport

**Steps:**

1. Read current file - likely fetches multiple data sources
2. Add loader with Promise.all for parallel fetching
3. Add loaderDeps for all dependencies
4. Add pendingComponent and errorComponent
5. Replace useQuery with Route.useLoaderData()

---

### Phase 6: Cleanup Mixed Patterns

### UPDATE `app/routes/_auth/farms.$farmId.access.tsx`

- **IMPLEMENT**: Remove useQuery, keep only loader
- **PATTERN**: This route already has loader - just remove client-side fetching
- **GOTCHA**: useQueryClient is for mutations - keep it
- **VALIDATE**: `bun dev` and navigate to /farms/{id}/access

**Steps:**

1. Read current file to identify useQuery usage
2. Verify loader exists and fetches all needed data
3. Remove any useQuery calls
4. Keep useQueryClient (used for invalidation after mutations)
5. Verify useMutation is still present (for mutations)

### UPDATE `app/routes/_auth/feed-formulation/prices.tsx`

- **IMPLEMENT**: Remove useQuery, keep only loader
- **PATTERN**: Same as farms access route
- **VALIDATE**: `bun dev` and navigate to /feed-formulation/prices

**Steps:** Same as farms access route

---

### Phase 7: Final Validation

### VALIDATE All Migrations

- **IMPLEMENT**: Comprehensive testing of all migrated routes
- **VALIDATE**: Run full validation suite

**Commands:**

```bash
# 1. Type checking
npx tsc --noEmit

# 2. Linting
bun run lint

# 3. Run tests
bun run test --run

# 4. Build verification
bun run build
```

### MANUAL Testing Checklist

For each migrated route:

- [ ] Navigate to route - data loads correctly
- [ ] Skeleton appears during loading
- [ ] Error page appears on error (test by breaking server function temporarily)
- [ ] Search params trigger refetch (change filters, pagination)
- [ ] Data is correct and matches previous behavior
- [ ] No console errors
- [ ] SSR works (view page source, data should be in HTML)

### VERIFY Route Compliance

- **VALIDATE**: Re-run route audit to verify improvement

```bash
cd /Users/captjay98/projects/jayfarms && cat << 'EOF' > /tmp/verify_migration.sh
#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRATION VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

total_routes=$(find app/routes -name "*.tsx" -type f | wc -l | tr -d ' ')
routes_with_loader=$(grep -rl "loader:" app/routes --include="*.tsx" | wc -l | tr -d ' ')
routes_with_usequery=$(grep -rl "useQuery" app/routes --include="*.tsx" | wc -l | tr -d ' ')
routes_with_pending=$(grep -rl "pendingComponent:" app/routes --include="*.tsx" | wc -l | tr -d ' ')
routes_with_error=$(grep -rl "errorComponent:" app/routes --include="*.tsx" | wc -l | tr -d ' ')

echo "📊 Total Routes: $total_routes"
echo "✅ Routes with loader: $routes_with_loader (target: 55+)"
echo "⚠️  Routes using useQuery: $routes_with_usequery (target: 2 or less)"
echo "✅ Routes with pendingComponent: $routes_with_pending (target: 30+)"
echo "✅ Routes with errorComponent: $routes_with_error (target: 30+)"
echo ""

loader_pct=$((routes_with_loader * 100 / total_routes))
echo "Loader compliance: $loader_pct% (target: 73%+)"

if [ $routes_with_usequery -le 2 ]; then
  echo "✅ SUCCESS: useQuery usage minimized"
else
  echo "❌ FAIL: Still $routes_with_usequery routes using useQuery"
  echo ""
  echo "Remaining routes with useQuery:"
  grep -rl "useQuery" app/routes --include="*.tsx"
fi

EOF
bash /tmp/verify_migration.sh
```

**Expected Results After Migration:**

- Routes with loader: 55+ (73%+)
- Routes using useQuery: ≤2 (only for mutations via useQueryClient)
- Routes with pendingComponent: 30+ (40%+)
- Routes with errorComponent: 30+ (40%+)

---

## TESTING STRATEGY

LivestockAI testing approach:

### Unit Tests

**Location**: `tests/routes/`
**Framework**: Vitest
**Coverage Target**: Not required for this refactor (no logic changes)

**Why no new tests?**

- This is a refactor, not new functionality
- Existing server function tests cover data fetching logic
- Manual testing verifies UI behavior

### Integration Tests

**Scope**: Verify routes load correctly with loaders
**Pattern**: Manual testing (see checklist above)

**Test each route:**

1. Navigate to route
2. Verify data loads
3. Verify skeleton appears
4. Verify error handling
5. Verify search params work

### Edge Cases

LivestockAI-specific edge cases to test:

- **No farm selected**: Routes should handle missing farmId gracefully
- **Empty data**: Routes should show empty states
- **Network errors**: Error component should appear
- **Slow connections**: Skeleton should appear during loading
- **Search param changes**: Data should refetch automatically
- **Browser back/forward**: Data should load from cache or refetch

---

## VALIDATION COMMANDS

LivestockAI validation suite - execute in order, fail fast:

### Level 1: Syntax & Style

```bash
# Type checking (fail fast)
npx tsc --noEmit || exit 1

# Linting (fail fast)
bun run lint || exit 1
```

### Level 2: Build Verification

```bash
# Verify production build works
bun run build || exit 1
```

### Level 3: Manual Testing

**For each migrated route:**

1. Start dev server: `bun dev`
2. Navigate to route in browser
3. Verify data loads correctly
4. Verify skeleton appears during loading
5. Verify error page appears on error (temporarily break server function)
6. Verify search params trigger refetch
7. Check browser console for errors
8. View page source - verify SSR (data in HTML)

### Level 4: Route Compliance Audit

```bash
# Run verification script (see Phase 7 above)
bash /tmp/verify_migration.sh
```

**Success Criteria:**

- Loader compliance: 73%+ (55+ routes)
- useQuery usage: ≤2 routes (only for mutations)
- pendingComponent: 40%+ (30+ routes)
- errorComponent: 40%+ (30+ routes)

---

## ACCEPTANCE CRITERIA

LivestockAI feature completion checklist:

- [ ] All 11 routes migrated to loader pattern
- [ ] All validation commands pass: `npx tsc --noEmit && bun run lint && bun run build`
- [ ] Manual testing completed for all routes
- [ ] Route compliance audit shows improvement:
  - [ ] Loader usage: 73%+ (up from 58%)
  - [ ] useQuery usage: ≤2 routes (down from 13)
  - [ ] pendingComponent: 40%+ (up from 25%)
  - [ ] errorComponent: 40%+ (up from 29%)
- [ ] Code follows LivestockAI patterns:
  - [ ] All loaders use existing server functions (no new server functions needed)
  - [ ] All skeleton components use DataTableSkeleton or Skeleton primitives
  - [ ] All error components use ErrorPage
  - [ ] All search validation uses createSearchValidator
- [ ] No regressions in existing functionality
- [ ] SSR works for all migrated routes (data in page source)
- [ ] Loading states appear correctly (skeleton screens)
- [ ] Error handling works (error page appears on failures)
- [ ] Search params trigger refetch automatically
- [ ] No console errors in browser

---

## COMPLETION CHECKLIST

- [ ] Phase 1: All 8 skeleton components created
- [ ] Phase 2: Batches route migrated (HIGH PRIORITY)
- [ ] Phase 3: All 4 data entry routes migrated
- [ ] Phase 4: All 3 management routes migrated
- [ ] Phase 5: Credit passport route migrated
- [ ] Phase 6: 2 mixed pattern routes cleaned up
- [ ] Phase 7: All validation passed
- [ ] Manual testing completed for all routes
- [ ] Route compliance audit shows improvement
- [ ] No linting or type checking errors
- [ ] Production build succeeds
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decisions

**Why migrate all routes at once?**

- Creates consistency across codebase
- Easier to maintain one pattern
- Better user experience with consistent loading states
- Enables SSR for all routes

**Why use loaders instead of useQuery?**

- SSR support (data fetched on server)
- Prefetching (router can prefetch on hover)
- Better loading states (skeleton screens)
- Consistent error handling
- Follows TanStack Router best practices

**Why keep useQueryClient in some routes?**

- useQueryClient is for cache invalidation after mutations
- useMutation still uses TanStack Query (correct pattern)
- Only data fetching moves to loaders, mutations stay with TanStack Query

### Trade-offs

**Pros:**

- ✅ Better performance (SSR, prefetching)
- ✅ Better UX (skeleton screens, consistent loading)
- ✅ Consistent patterns across codebase
- ✅ Easier to maintain

**Cons:**

- ⚠️ More boilerplate (loaderDeps, pendingComponent, errorComponent)
- ⚠️ Migration effort (11 routes to update)

**Mitigation:**

- Boilerplate is minimal and consistent
- Migration is straightforward (follow pattern)
- Long-term benefits outweigh short-term effort

### Future Improvements

After this migration:

- Consider adding `staleTime` to router config for better caching
- Consider adding `gcTime` for cache cleanup
- Consider adding `retry` logic for failed loaders
- Consider adding `meta` for route-specific metadata (page titles, etc.)

### Performance Impact

**Expected improvements:**

- Faster initial page loads (SSR)
- Faster navigation (prefetching)
- Better perceived performance (skeleton screens)
- Reduced client-side JavaScript (less useQuery code)

**Measurements:**

- Before: 58% loader usage, 17% useQuery usage
- After: 73%+ loader usage, <3% useQuery usage
- Improvement: +15% loader adoption, -14% useQuery usage

---

## CONFIDENCE SCORE

**8/10** - High confidence for one-pass implementation success

**Reasoning:**

- ✅ Clear pattern to follow (existing routes as examples)
- ✅ No new server functions needed (all exist)
- ✅ Straightforward refactor (move data fetching to loaders)
- ✅ Comprehensive validation commands
- ⚠️ Manual testing required (11 routes to verify)
- ⚠️ Some routes may have unique patterns (need to read carefully)

**Risks:**

- Some routes may have complex data fetching (multiple sources)
- Some routes may have unique loading states (not just tables)
- Some routes may have dependencies on client-side state

**Mitigation:**

- Read each route carefully before migrating
- Follow existing patterns (dashboard, expenses)
- Test each route after migration
- Ask for clarification if route structure is unclear
