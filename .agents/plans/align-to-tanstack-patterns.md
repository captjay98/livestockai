# TanStack Start Alignment Plan (CORRECTED)

**Status**: Planning Phase
**Priority**: High
**Complexity**: Low-Medium
**Impact**: Remove dead code, fix type safety

## Executive Summary

**CORRECTED UNDERSTANDING**: After auditing actual usage, the codebase has TWO separate hook patterns:

1. **`hooks.ts` files** - Simple `useMutation` wrappers with toast + cache invalidation
   - ✅ **These ARE being used** by components
   - ✅ **This is a valid TanStack pattern** - composition hooks are appropriate
   - ❌ Contains `as any` casts that should be fixed

2. **`use-*-mutations.ts` files** - Complex hooks with optimistic updates, temp ID resolution, conflict resolution
   - ❌ **These are DEAD CODE** (14 files, mostly unused)
   - ❌ Only 1 usage found: `weight-dialog.tsx` imports `use-weight-mutations.ts` directly
   - ⚠️ These contain important offline/optimistic logic that was never integrated

### Plan Goals

1. ✅ **Remove dead code** - Delete 14 unused `use-*-mutations.ts` files
2. ✅ **Fix `as any` casts** - Remove type casts in `hooks.ts` files
3. ✅ **Fix weight feature** - Either use `hooks.ts` consistently or delete the duplicate
4. ✅ **Document pattern** - Add JSDoc to hooks.ts explaining the pattern

---

## Current State Analysis

### Dead Code Files (DELETE - 14 files)

These files contain complex optimistic update logic but are NOT being used:

| Feature         | File                             | Usage Count     | Status    |
| --------------- | -------------------------------- | --------------- | --------- |
| `batches`       | `use-batch-mutations.ts`         | 0 in components | ❌ DELETE |
| `customers`     | `use-customer-mutations.ts`      | 0 in components | ❌ DELETE |
| `eggs`          | `use-egg-mutations.ts`           | 0 in components | ❌ DELETE |
| `expenses`      | `use-expense-mutations.ts`       | 0 in components | ❌ DELETE |
| `feed`          | `use-feed-mutations.ts`          | 0 in components | ❌ DELETE |
| `invoices`      | `use-invoice-mutations.ts`       | 0 in components | ❌ DELETE |
| `mortality`     | `use-mortality-mutations.ts`     | 0 in components | ❌ DELETE |
| `sales`         | `use-sales-mutations.ts`         | 0 in components | ❌ DELETE |
| `water-quality` | `use-water-quality-mutations.ts` | 0 in components | ❌ DELETE |
| `weight`        | `use-weight-mutations.ts`        | 1 in components | ⚠️ FIX    |
| `vaccinations`  | `use-vaccination-mutations.ts`   | 0 in components | ❌ DELETE |
| `structures`    | `use-structure-mutations.ts`     | 0 in components | ❌ DELETE |
| `suppliers`     | `use-supplier-mutations.ts`      | 0 in components | ❌ DELETE |
| `tasks`         | `use-task-mutations.ts`          | 0 in components | ❌ DELETE |

### Active hooks.ts Files (KEEP - Fix types)

These files are used by components and should be kept:

| Feature        | File       | Issues                                 | Action      |
| -------------- | ---------- | -------------------------------------- | ----------- |
| `batches`      | `hooks.ts` | Has `as any` casts                     | Fix types   |
| `expenses`     | `hooks.ts` | None                                   | Keep        |
| `customers`    | `hooks.ts` | None                                   | Keep        |
| `feed`         | `hooks.ts` | Has `as any` casts                     | Fix types   |
| `farms`        | `hooks.ts` | None                                   | Keep        |
| `invoices`     | `hooks.ts` | None                                   | Keep        |
| `suppliers`    | `hooks.ts` | None                                   | Keep        |
| `structures`   | `hooks.ts` | None                                   | Keep        |
| `eggs`         | `hooks.ts` | Has `as any` casts                     | Fix types   |
| `weight`       | `hooks.ts` | Duplicate with use-weight-mutations.ts | Consolidate |
| `vaccinations` | `hooks.ts` | None                                   | Keep        |
| `tasks`        | N/A        | Uses `hooks.ts` from digital-foreman   | N/A         |
| `workers`      | N/A        | Uses `hooks.ts` from digital-foreman   | N/A         |

---

## Implementation Plan

### Phase 1: Remove Dead Code (30 minutes)

**Goal**: Delete 14 unused `use-*-mutations.ts` files.

**Important**: These files contain optimistic update logic that was never integrated. Before deleting, we should confirm this offline/optimistic system is not planned for future use.

#### 1.1 Delete Unused Files (13 files)

```bash
rm app/features/batches/use-batch-mutations.ts
rm app/features/customers/use-customer-mutations.ts
rm app/features/eggs/use-egg-mutations.ts
rm app/features/expenses/use-expense-mutations.ts
rm app/features/feed/use-feed-mutations.ts
rm app/features/invoices/use-invoice-mutations.ts
rm app/features/mortality/use-mortality-mutations.ts
rm app/features/sales/use-sales-mutations.ts
rm app/features/water-quality/use-water-quality-mutations.ts
rm app/features/vaccinations/use-vaccination-mutations.ts
rm app/features/structures/use-structure-mutations.ts
rm app/features/suppliers/use-supplier-mutations.ts
rm app/features/tasks/use-task-mutations.ts
```

#### 1.2 Fix Weight Feature (Special Case)

The weight feature has BOTH `hooks.ts` and `use-weight-mutations.ts`. One component uses the latter directly.

**Option A**: Use `hooks.ts` consistently (Recommended)

```typescript
// Before: weight-dialog.tsx
import { useWeightMutations } from '~/features/weight/use-weight-mutations'

// After: weight-dialog.tsx
import { useWeightMutations } from '~/features/weight/hooks'
```

**Option B**: Delete `hooks.ts` and keep `use-weight-mutations.ts` if it has special logic

**Decision**: Use `hooks.ts` consistently (Option A) - the `hooks.ts` pattern is standard across all other features.

### Phase 2: Fix Type Safety (1-2 hours)

**Goal**: Remove `as any` casts from `hooks.ts` files.

#### 2.1 Identify Type Casts

Search for all `as any` in hooks files:

```bash
grep -n "as any" app/features/*/hooks.ts
```

#### 2.2 Fix Type Casts in batches/hooks.ts

**Before**:

```typescript
export function useBatches(farmId: string | null) {
  return useQuery({
    queryKey: ['batches', farmId],
    queryFn: () =>
      farmId ? getBatchesFn({ data: { farmId } } as any) : Promise.resolve([]),
    enabled: !!farmId,
  })
}
```

**After**:

```typescript
import type { GetBatchesInput } from '~/features/batches/server'

export function useBatches(farmId: string | null) {
  return useQuery({
    queryKey: ['batches', farmId],
    queryFn: () =>
      farmId ? getBatchesFn({ data: { farmId } }) : Promise.resolve([]),
    enabled: !!farmId,
  })
}
```

**Note**: The server function should have proper input types. If `getBatchesFn` doesn't have types, we need to add them to the server function definition.

#### 2.3 Fix Type Casts in Other hooks.ts

Repeat for:

- `app/features/feed/hooks.ts`
- `app/features/eggs/hooks.ts`
- Any other hooks files with `as any`

### Phase 3: Add JSDoc Documentation (30 minutes)

**Goal**: Document the hooks.ts pattern for future developers.

Add to each `hooks.ts` file:

````typescript
/**
 * React Query hooks for {feature} mutations.
 *
 * These hooks compose TanStack Query mutations with:
 * - Toast notifications for success/error states
 * - Query cache invalidation
 * - Internationalization (i18n)
 *
 * @example
 * ```tsx
 * import { useBatchMutations } from '~/features/batches/hooks'
 *
 * function CreateBatchButton() {
 *   const { createBatchMutation } = useBatchMutations()
 *   return <button onClick={() => createBatchMutation.mutate({ data })}>Create</button>
 * }
 * ```
 */
````

### Phase 4: Verification (30 minutes)

**Goal**: Ensure nothing breaks after changes.

#### 4.1 Run TypeScript Compiler

```bash
npx tsc --noEmit
```

#### 4.2 Run Linter

```bash
npm run lint
```

#### 4.3 Run Tests

```bash
npm run test
```

#### 4.4 Manual Testing

Test each major feature:

- Create a batch
- Create a customer
- Create an expense
- etc.

---

## Implementation Steps

### Step 1: Delete Dead Code (15 minutes)

1. ✅ Delete 13 unused `use-*-mutations.ts` files
2. ✅ Fix weight-dialog.tsx to use `hooks.ts`
3. ✅ Delete `use-weight-mutations.ts`

### Step 2: Fix Type Casts (1-2 hours)

1. ✅ Fix `batches/hooks.ts` type casts
2. ✅ Fix `feed/hooks.ts` type casts
3. ✅ Fix `eggs/hooks.ts` type casts
4. ✅ Run TypeScript compiler to verify

### Step 3: Add Documentation (30 minutes)

1. ✅ Add JSDoc to all `hooks.ts` files
2. ✅ Create `docs/REACT_QUERY_PATTERNS.md` explaining the pattern

### Step 4: Testing (30 minutes)

1. ✅ Run TypeScript compiler
2. ✅ Run linter
3. ✅ Run tests
4. ✅ Manual smoke test

**Total Estimated Time**: 2.5-3.5 hours

---

## Risk Assessment

### Low Risk

- ✅ Deleting unused files (no impact)
- ✅ Adding JSDoc comments (documentation only)
- ✅ Fixing type casts (improves safety)

### Medium Risk

- ⚠️ Weight feature has two hook files - need to consolidate carefully
- ⚠️ Type fixes may expose other type errors

### Mitigation

1. ✅ Delete files in a separate commit for easy rollback
2. ✅ Fix types incrementally with TypeScript compiler feedback
3. ✅ Test after each phase

---

## Open Questions

1. **Q**: The deleted `use-*-mutations.ts` files contain optimistic update logic. Is this planned for future use?
   **A**: Ask user. If yes, keep the files. If no, proceed with deletion.

2. **Q**: Should we consolidate weight feature to use `hooks.ts` or keep `use-weight-mutations.ts`?
   **A**: Recommend using `hooks.ts` for consistency with other features.

---

## Updated Plan vs Original Plan

| Aspect         | Original Plan                     | CORRECTED Plan                           |
| -------------- | --------------------------------- | ---------------------------------------- |
| **Assessment** | `hooks.ts` files don't exist      | `hooks.ts` files ARE being used          |
| **Assessment** | `use-*-mutations.ts` are wrappers | `use-*-mutations.ts` are DEAD CODE       |
| **Action**     | Delete 14 wrapper hooks           | Delete 13 dead files, consolidate weight |
| **Action**     | Update 80+ components             | Fix weight-dialog.tsx (1 file)           |
| **Action**     | Remove "LivestockAI Pattern"      | Keep `hooks.ts` pattern (it's valid)     |
| **Complexity** | 18-25 hours                       | 2.5-3.5 hours                            |
| **Risk**       | Medium-High                       | Low-Medium                               |

---

## Success Criteria

### Must Have

1. ✅ All 14 `use-*-mutations.ts` files deleted or consolidated
2. ✅ Zero `as any` casts in `hooks.ts` files
3. ✅ Zero TypeScript errors
4. ✅ Zero ESLint errors
5. ✅ All major features tested and working

### Should Have

1. ✅ JSDoc on all `hooks.ts` files
2. ✅ Pattern documentation created

---

## Rollback Plan

```bash
# If issues arise, revert the deletion commit
git revert <commit-hash>
```

---

## References

- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [TanStack Query Mutation Docs](https://tanstack.com/query/latest/docs/react/guides/mutations)
- Current codebase: `/Users/captjay98/projects/jayfarms`
