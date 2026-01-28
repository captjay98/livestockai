# Feature: Slim Down Route Files

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Refactor all 14 bloated route files (300-580 lines) to follow TanStack Start best practices. Route files should be thin orchestrators (~100-150 lines) that compose extracted components and call server functions from `features/`.

## User Story

As a developer
I want route files to be thin orchestrators
So that code is maintainable, testable, and follows TanStack conventions

## Problem Statement

Route files currently contain:

- Server functions that should be in `features/*/server.ts`
- Type definitions that should be in `features/*/types.ts`
- Inline filter components that should be extracted
- 400-580 lines when they should be ~100-150 lines

## Solution Statement

Extract from each route:

1. **Server functions** → Move to `features/*/server.ts`
2. **Types** → Move to `features/*/types.ts`
3. **Filter components** → Extract to `components/*/filters.tsx`

Keep in route:

- `createFileRoute()` config with `validateSearch`
- Component composition (wiring extracted pieces together)
- Local state and handlers

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: 14 route files, features/, components/
**Dependencies**: None (pure refactor)

---

## CONTEXT REFERENCES

### Files to Refactor (by priority - largest first)

| Route                        | Lines | Server Fn to Move        | Types to Move                                |
| ---------------------------- | ----- | ------------------------ | -------------------------------------------- |
| `feed/index.tsx`             | 581   | `getFeedDataForFarm`     | `FeedSearchParams`, `FeedInventory`, `Batch` |
| `batches/index.tsx`          | 579   | `getBatchesForFarmFn`    | `BatchSearchParams`, `InventorySummary`      |
| `vaccinations/index.tsx`     | 543   | route-specific server fn | search params, types                         |
| `mortality/index.tsx`        | 537   | route-specific server fn | search params, types                         |
| `water-quality/index.tsx`    | 513   | route-specific server fn | search params, types                         |
| `eggs/index.tsx`             | 498   | route-specific server fn | search params, types                         |
| `batches/$batchId/index.tsx` | 446   | none (uses existing)     | local types                                  |
| `customers/index.tsx`        | 434   | route-specific server fn | search params                                |
| `expenses/index.tsx`         | 424   | route-specific server fn | search params                                |
| `sales/index.tsx`            | 420   | route-specific server fn | search params                                |
| `invoices/index.tsx`         | 420   | route-specific server fn | search params                                |
| `weight/index.tsx`           | 415   | route-specific server fn | search params                                |
| `suppliers/index.tsx`        | 368   | route-specific server fn | search params                                |
| `dashboard/index.tsx`        | 335   | multiple server fns      | stats types                                  |

### Already Extracted (Don't Touch)

- `components/batches/batch-columns.tsx` ✅
- `components/batches/batch-summary-cards.tsx` ✅
- `components/batches/batch-edit-dialog.tsx` ✅
- `components/batches/batch-delete-dialog.tsx` ✅
- `components/feed/feed-columns.tsx` ✅
- `components/feed/FeedFormDialog` ✅
- `components/feed/FeedSummary` ✅

### Patterns to Follow

**Server Function Pattern** (from TanStack docs):

```typescript
// features/batches/server.ts - ADD here
export const getBatchesForFarmFn = createServerFn({ method: 'GET' })
    .inputValidator((data: GetBatchesForFarmInput) => data)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        // ... implementation
    })
```

**Types Pattern**:

```typescript
// features/batches/types.ts - ADD here
export interface BatchSearchParams {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    q?: string
    status?: 'active' | 'depleted' | 'sold'
    livestockType?: 'poultry' | 'fish'
}

export const batchSearchSchema = {
    // Zod schema for validateSearch
}
```

**Slim Route Pattern**:

```typescript
// routes/_auth/batches/index.tsx - TARGET ~120 lines
import { createFileRoute } from '@tanstack/react-router'
import { getBatchesForFarmFn } from '~/features/batches/server'
import { type BatchSearchParams } from '~/features/batches/types'
import { getBatchColumns, type Batch } from '~/components/batches/batch-columns'
import { BatchFilters } from '~/components/batches/batch-filters'
// ... other imports

export const Route = createFileRoute('/_auth/batches/')({
    component: BatchesPage,
    validateSearch: (search): BatchSearchParams => ({
        /* validation */
    }),
})

function BatchesPage() {
    // State, effects, handlers (~40 lines)
    // JSX composition (~60 lines)
}
```

**Filter Component Pattern**:

```typescript
// components/batches/batch-filters.tsx - NEW
interface BatchFiltersProps {
  status?: string
  livestockType?: string
  onStatusChange: (status: string | undefined) => void
  onTypeChange: (type: string | undefined) => void
}

export function BatchFilters({ status, livestockType, onStatusChange, onTypeChange }: BatchFiltersProps) {
  const { t } = useTranslation(['batches', 'common'])
  return (
    <>
      <Select value={status || 'all'} onValueChange={v => onStatusChange(v === 'all' ? undefined : v)}>
        {/* ... */}
      </Select>
      <Select value={livestockType || 'all'} onValueChange={v => onTypeChange(v === 'all' ? undefined : v)}>
        {/* ... */}
      </Select>
    </>
  )
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Batches Route (Template)

Do batches first as the template, then apply pattern to all others.

### Phase 2: Daily Operations Routes

Feed, mortality, weight, water-quality, vaccinations, eggs

### Phase 3: Financial Routes

Sales, expenses, invoices, customers, suppliers

### Phase 4: Other Routes

Dashboard, batches/$batchId

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `features/batches/types.ts`

- **ADD**: `BatchSearchParams` interface (move from route)
- **ADD**: `InventorySummary` interface (move from route)
- **ADD**: `GetBatchesForFarmInput` interface for server function
- **EXPORT**: All types
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: UPDATE `features/batches/server.ts`

- **ADD**: `getBatchesForFarmFn` server function (move from route)
- **IMPORT**: Types from `./types.ts`
- **PATTERN**: Use dynamic imports for db and auth
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE `components/batches/batch-filters.tsx`

- **CREATE**: New file with `BatchFilters` component
- **EXTRACT**: Status and livestock type Select dropdowns from route
- **PROPS**: `status`, `livestockType`, `onStatusChange`, `onTypeChange`
- **PATTERN**: Use `useTranslation` for labels
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: REFACTOR `routes/_auth/batches/index.tsx`

- **REMOVE**: `getBatchesForFarmFn` (now imported from features)
- **REMOVE**: `BatchSearchParams`, `InventorySummary` types (now imported)
- **IMPORT**: Server function from `~/features/batches/server`
- **IMPORT**: Types from `~/features/batches/types`
- **IMPORT**: `BatchFilters` from `~/components/batches/batch-filters`
- **REPLACE**: Inline filter JSX with `<BatchFilters />` component
- **TARGET**: ~120 lines
- **VALIDATE**: `bun run check && bun run lint`

### Task 5-18: REPEAT FOR REMAINING 13 ROUTES

Apply same pattern to each route:

**Task 5-6**: `feed/index.tsx`

- Move `getFeedDataForFarm` → `features/feed/server.ts`
- Move types → `features/feed/types.ts`
- Create `components/feed/feed-filters.tsx`

**Task 7-8**: `mortality/index.tsx`

- Move server fn → `features/mortality/server.ts`
- Move types → `features/mortality/types.ts`
- Create `components/mortality/mortality-filters.tsx`

**Task 9-10**: `vaccinations/index.tsx`

- Move server fn → `features/vaccinations/server.ts`
- Move types → `features/vaccinations/types.ts`
- Create `components/vaccinations/vaccination-filters.tsx`

**Task 11-12**: `water-quality/index.tsx`

- Move server fn → `features/water-quality/server.ts`
- Move types → `features/water-quality/types.ts`
- Create `components/water-quality/water-quality-filters.tsx`

**Task 13-14**: `eggs/index.tsx`

- Move server fn → `features/eggs/server.ts`
- Move types → `features/eggs/types.ts`
- Create `components/eggs/egg-filters.tsx`

**Task 15-16**: `weight/index.tsx`

- Move server fn → `features/weight/server.ts`
- Move types → `features/weight/types.ts`
- Create `components/weight/weight-filters.tsx`

**Task 17-18**: `customers/index.tsx`

- Move server fn → `features/customers/server.ts`
- Move types → `features/customers/types.ts`
- Create `components/customers/customer-filters.tsx`

**Task 19-20**: `suppliers/index.tsx`

- Move server fn → `features/suppliers/server.ts`
- Move types → `features/suppliers/types.ts`
- Create `components/suppliers/supplier-filters.tsx`

**Task 21-22**: `sales/index.tsx`

- Move server fn → `features/sales/server.ts`
- Move types → `features/sales/types.ts`
- Create `components/sales/sale-filters.tsx`

**Task 23-24**: `expenses/index.tsx`

- Move server fn → `features/expenses/server.ts`
- Move types → `features/expenses/types.ts`
- Create `components/expenses/expense-filters.tsx`

**Task 25-26**: `invoices/index.tsx`

- Move server fn → `features/invoices/server.ts`
- Move types → `features/invoices/types.ts`
- Create `components/invoices/invoice-filters.tsx`

**Task 27-28**: `dashboard/index.tsx`

- Move server fns → `features/dashboard/server.ts`
- Move types → `features/dashboard/types.ts`
- Extract summary cards if not already done

**Task 29-30**: `batches/$batchId/index.tsx`

- Move any inline types → `features/batches/types.ts`
- Extract any inline components → `components/batches/`

### Task 31: Final Validation

- **RUN**: `bun run check && bun run lint && bun run test --run`
- **VERIFY**: All routes under 150 lines
- **VERIFY**: No functionality regression

---

## TESTING STRATEGY

### Validation After Each Route

```bash
# After each route refactor
npx tsc --noEmit
bun run lint
```

### Final Validation

```bash
# Full validation
bun run check && bun run lint && bun run test --run && bun run build
```

### Manual Testing

- Navigate to each refactored page
- Verify data loads correctly
- Verify filters work
- Verify CRUD operations work

---

## VALIDATION COMMANDS

### Level 1: Type Check

```bash
npx tsc --noEmit || exit 1
```

### Level 2: Lint

```bash
bun run lint || exit 1
```

### Level 3: Tests

```bash
bun run test --run || exit 1
```

### Level 4: Build

```bash
bun run build || exit 1
```

### Level 5: Line Count Verification

```bash
wc -l app/routes/_auth/*/index.tsx app/routes/_auth/*/*/index.tsx 2>/dev/null | sort -rn | head -20
# All should be under 150 lines
```

---

## ACCEPTANCE CRITERIA

- [ ] All 14 route files under 150 lines
- [ ] Server functions moved to `features/*/server.ts`
- [ ] Types moved to `features/*/types.ts`
- [ ] Filter components extracted to `components/*/`
- [ ] All validation commands pass
- [ ] No functionality regression
- [ ] All existing tests pass (300+)

---

## COMPLETION CHECKLIST

- [ ] Batches route refactored (template)
- [ ] Feed route refactored
- [ ] Mortality route refactored
- [ ] Vaccinations route refactored
- [ ] Water-quality route refactored
- [ ] Eggs route refactored
- [ ] Weight route refactored
- [ ] Customers route refactored
- [ ] Suppliers route refactored
- [ ] Sales route refactored
- [ ] Expenses route refactored
- [ ] Invoices route refactored
- [ ] Dashboard route refactored
- [ ] Batches/$batchId route refactored
- [ ] Final validation passed
- [ ] Line counts verified

---

## NOTES

### Why This Matters

1. **TanStack Best Practice**: Official docs recommend server functions in separate files
2. **Maintainability**: Smaller files are easier to understand and modify
3. **Testability**: Extracted components and server functions can be unit tested
4. **Code Splitting**: Better bundle optimization with smaller route files
5. **Consistency**: All routes follow same pattern

### What NOT to Change

- Existing `features/*/server.ts` files (just add to them)
- Existing `components/*/` files (just add new filter components)
- Business logic (pure refactor, no behavior changes)
- Database queries (stay in repository layer)

### Estimated Impact

| Metric                | Before     | After      |
| --------------------- | ---------- | ---------- |
| Total route lines     | ~8,000     | ~2,000     |
| Avg route size        | ~500 lines | ~120 lines |
| New filter components | 0          | ~12        |
| Server fns in routes  | ~14        | 0          |

### References

- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#file-organization)
- [Swizec: 8 months of TanStack Router](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)
