# Feature: Mutation Pattern Standardization (Final)

## Research Summary

### Official TanStack Documentation Findings

**Source**: [TanStack Start Server Functions Guide](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)

**Key Findings:**

1. **`useServerFn()` is for component-level calls** - The docs show:

   ```typescript
   // In a component
   const getPosts = useServerFn(getServerPosts)
   const { data } = useQuery({
     queryKey: ['posts'],
     queryFn: () => getPosts(),
   })
   ```

2. **Direct imports work for mutations** - Server functions can be passed directly to `useMutation`:

   ```typescript
   // This is valid - no useServerFn needed
   const mutation = useMutation({
     mutationFn: (data) => createBatchFn({ data }),
   })
   ```

3. **Static imports are safe** - The docs explicitly state:
   > "Server functions can be statically imported in any file, including client components... The build process replaces server function implementations with RPC stubs in client bundles."

### Conclusion: Current Pattern is Correct

The existing `hooks.ts` pattern with direct server function imports is **valid and recommended**:

```typescript
// ✅ CORRECT - Current LivestockAI pattern
import { createBatchFn } from './server'

export function useBatchMutations() {
  return useMutation({
    mutationFn: createBatchFn,  // Direct import works
    onSuccess: () => { ... }
  })
}
```

**When to use `useServerFn()`:**

- Calling server functions directly in components (not wrapped in useMutation/useQuery)
- When you need automatic redirect/not-found handling in event handlers

**When NOT needed:**

- Inside `useMutation({ mutationFn: ... })` - the mutation handles the async call
- Inside route loaders - server functions work directly

---

## User Story

As a developer maintaining LivestockAI
I want consistent mutation patterns across all features
So that the codebase is maintainable, has proper loading states, and enables future optimistic updates

## Problem Statement

The codebase has 4 different mutation patterns:

1. Direct `await serverFn()` in handlers (57 files) - **Anti-pattern**
2. Inline `useMutation` (24 files) - **Acceptable but scattered**
3. `hooks.ts` with `useMutation` (16 files) - **Target pattern**
4. `useServerFn()` (0 files) - **Not needed for mutations**

## Solution Statement

Standardize on the `hooks.ts` pattern with `useMutation`:

- Centralized mutation logic per feature
- Consistent error handling and toast notifications
- Proper cache invalidation
- Reusable across components

---

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Dialog/form components
**Dependencies**: None (uses existing TanStack Query)

---

## CONTEXT REFERENCES

### Pattern to Follow (Canonical Example)

**File**: `app/features/sensors/hooks.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { createSensorFn, updateSensorFn, deleteSensorFn } from './server'

export function useSensorMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['common'])

  const createSensor = useMutation({
    mutationFn: createSensorFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sensors', variables.farmId] })
      toast.success(t('common:created'))
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.create'))
    },
  })

  return { createSensor, isPending: createSensor.isPending }
}
```

### Files Already Refactored (from previous session)

**Hooks Created:**

- ✅ `app/features/farms/hooks.ts`
- ✅ `app/features/suppliers/hooks.ts`
- ✅ `app/features/marketplace/hooks.ts`
- ✅ `app/features/invoices/hooks.ts`
- ✅ `app/features/expenses/hooks.ts`
- ✅ `app/features/mortality/hooks.ts`
- ✅ `app/features/weight/hooks.ts`

**Dialogs Refactored:**

- ✅ `app/components/farms/farm-dialog.tsx`
- ✅ `app/components/farms/edit-farm-dialog.tsx`
- ✅ `app/components/suppliers/supplier-dialog.tsx`
- ✅ `app/components/batches/batch-dialog.tsx`
- ✅ `app/routes/marketplace/create.tsx`

### Files Still Needing Refactoring

**High Priority (direct await calls):**

- `app/components/invoices/invoice-dialog.tsx` - Partially done
- `app/components/expenses/expense-dialog.tsx` - Partially done
- `app/components/mortality/mortality-dialog.tsx`
- `app/components/weight/weight-dialog.tsx`

**Medium Priority (duplicate dialogs in app/components/dialogs/):**

- Check if these are used or can be removed

---

## IMPLEMENTATION PLAN

### Phase 1: Complete Remaining Dialog Refactors

Finish refactoring dialogs that still use direct `await serverFn()` calls.

### Phase 2: Update Project Documentation

Update `.kiro/skills/tanstack-query/SKILL.md` to clarify:

- `useServerFn()` is NOT required for mutations
- Direct imports with `useMutation` is the correct pattern

### Phase 3: Cleanup Duplicate Dialogs

Address duplicate dialog components in `app/components/dialogs/`.

### Phase 4: Final Validation

Run full test suite and build verification.

---

## STEP-BY-STEP TASKS

### Task 1: Verify invoice-dialog.tsx refactor is complete

**File**: `app/components/invoices/invoice-dialog.tsx`
**Check**: Uses `useInvoiceMutations()` from hooks
**Validate**: `bun run check`

### Task 2: Verify expense-dialog.tsx refactor is complete

**File**: `app/components/expenses/expense-dialog.tsx`
**Check**: Uses `useExpenseMutations()` from hooks
**Validate**: `bun run check`

### Task 3: Refactor mortality-dialog.tsx

**File**: `app/components/mortality/mortality-dialog.tsx`
**Action**: Replace direct `recordMortalityFn` with `useMortalityMutations()`
**Import**: `import { useMortalityMutations } from '~/features/mortality/hooks'`
**Gotcha**: Must invalidate both `['mortality']` and `['batches']` queries
**Validate**: `bun run check`

### Task 4: Refactor weight-dialog.tsx

**File**: `app/components/weight/weight-dialog.tsx`
**Action**: Replace direct `createWeightSampleFn` with `useWeightMutations()`
**Import**: `import { useWeightMutations } from '~/features/weight/hooks'`
**Validate**: `bun run check`

### Task 5: Audit duplicate dialogs

**Directory**: `app/components/dialogs/`
**Action**: List all files, check if used, decide to refactor or remove
**Command**: `ls -la app/components/dialogs/`

### Task 6: Update tanstack-query SKILL.md

**File**: `.kiro/skills/tanstack-query/SKILL.md`
**Add Section**: "useServerFn() vs Direct Import"
**Content**:

````markdown
## useServerFn() vs Direct Import

For mutations wrapped in `useMutation`, direct imports work correctly:

```typescript
// ✅ Correct - direct import with useMutation
import { createBatchFn } from './server'

const mutation = useMutation({
  mutationFn: createBatchFn,
})
```
````

`useServerFn()` is only needed when:

- Calling server functions directly in event handlers (not wrapped in useMutation)
- You need automatic redirect/not-found handling outside of route lifecycles

Reference: [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)

````

### Task 7: Final Validation

**Commands**:
```bash
bun run check && bun run lint && bun run build
````

---

## VALIDATION COMMANDS

```bash
# Type checking
bun run check

# Linting
bun run lint

# Build verification
bun run build

# Complete validation
bun run check && bun run lint && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All dialog components use `useMutation` via hooks
- [ ] No direct `await serverFn()` calls in form handlers
- [ ] All mutations show loading state via `isPending`
- [ ] All mutations show success/error toasts
- [ ] Cache invalidation works correctly
- [ ] Project documentation updated
- [ ] All validation commands pass

---

## KEY TAKEAWAYS

1. **`useServerFn()` is NOT required for mutations** - Direct imports with `useMutation` work correctly
2. **The existing hooks pattern is correct** - No changes needed to the pattern itself
3. **Focus on consistency** - Ensure all dialogs use the hooks pattern
4. **Update documentation** - Clarify the pattern in project docs to prevent future confusion

---

## References

- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [TanStack Query Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
