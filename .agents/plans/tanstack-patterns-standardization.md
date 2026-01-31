# Feature: TanStack Patterns Standardization

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Standardize all mutation handling across the codebase to use TanStack Query's `useMutation` hook instead of direct `await serverFn()` calls in event handlers. This provides consistent loading states, error handling, cache invalidation, and enables future optimistic updates.

## User Story

As a developer maintaining LivestockAI
I want consistent mutation patterns across all features
So that the codebase is maintainable, has proper loading states, and enables future optimistic updates

## Problem Statement

Currently, many dialogs and forms call server functions directly in `handleSubmit` handlers:

```typescript
// ❌ Current anti-pattern
const handleSubmit = async () => {
  setIsSubmitting(true)
  try {
    await createFarmFn({ data: formData })
    router.invalidate()
    toast.success('Created')
  } catch (e) {
    toast.error(e.message)
  } finally {
    setIsSubmitting(false)
  }
}
```

This pattern:

- Duplicates loading state management (`useState` for `isSubmitting`)
- Inconsistent error handling across components
- No automatic retry on failure
- No cache invalidation integration
- Cannot leverage optimistic updates

## Solution Statement

Refactor all mutation-performing components to use `useMutation` hooks, either directly or via feature-specific hooks files. This centralizes mutation logic, provides consistent UX, and enables future enhancements.

```typescript
// ✅ Target pattern
const { mutate, isPending } = useMutation({
  mutationFn: (data) => createFarmFn({ data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['farms'] })
    toast.success('Created')
    onOpenChange(false)
  },
  onError: (error) => {
    toast.error(error.message)
  },
})
```

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: All dialog/form components performing mutations
**Dependencies**: None (uses existing TanStack Query)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

**Good Pattern Examples (follow these):**

- `app/features/sensors/hooks.ts` - Complete hooks pattern with queries + mutations
- `app/features/batches/hooks.ts` - Hooks with mutations and toast notifications
- `app/features/customers/hooks.ts` - Customer CRUD hooks pattern

**Components to Refactor (High Priority - Mutations):**

- `app/components/farms/farm-dialog.tsx` - Uses direct `createFarmFn`, `updateFarmFn`
- `app/components/farms/edit-farm-dialog.tsx` - Uses direct `updateFarmFn`
- `app/components/customers/customer-dialog.tsx` - Uses direct `createCustomerFn`
- `app/components/suppliers/supplier-dialog.tsx` - Uses direct `createSupplierFn`
- `app/components/batches/batch-dialog.tsx` - Uses direct `createBatchFn`
- `app/routes/marketplace/create.tsx` - Uses direct `createListingFn`

**Components to Refactor (Medium Priority - Mixed):**

- `app/components/invoices/invoice-dialog.tsx` - Direct mutations
- `app/components/expenses/expense-dialog.tsx` - Direct mutations
- `app/components/mortality/mortality-dialog.tsx` - Direct mutations
- `app/components/weight/weight-dialog.tsx` - Direct mutations

### New Files to Create

- `app/features/farms/hooks.ts` - Farm CRUD mutations
- `app/features/suppliers/hooks.ts` - Supplier CRUD mutations
- `app/features/marketplace/hooks.ts` - Marketplace mutations
- `app/features/invoices/hooks.ts` - Invoice mutations
- `app/features/expenses/hooks.ts` - Expense mutations
- `app/features/mortality/hooks.ts` - Mortality mutations
- `app/features/weight/hooks.ts` - Weight sample mutations

### Relevant Documentation - READ BEFORE IMPLEMENTING

- [TanStack Query Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
  - Core mutation patterns, `useMutation` hook usage
  - Why: Foundation for all refactoring work

- [Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
  - How to invalidate queries after mutations
  - Why: Proper cache invalidation pattern

- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
  - Server function patterns with validation
  - Why: Confirms server functions work directly with `useMutation`

### Patterns to Follow

**LivestockAI Mandatory Patterns:**

**Hooks File Pattern (from sensors/hooks.ts):**

```typescript
// app/features/{feature}/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createThingFn,
  updateThingFn,
  deleteThingFn,
  getThingsFn,
} from './server'

// Query hook
export function useThings(farmId: string | null) {
  return useQuery({
    queryKey: ['things', farmId],
    queryFn: () => getThingsFn({ data: { farmId: farmId ?? undefined } }),
    enabled: !!farmId,
  })
}

// Mutations hook
export function useThingMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['feature', 'common'])

  const createThing = useMutation({
    mutationFn: (data: CreateThingData) => createThingFn({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['things', variables.farmId] })
      toast.success(t('common:created'))
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.create'))
    },
  })

  const updateThing = useMutation({
    mutationFn: (data: UpdateThingData) => updateThingFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['things'] })
      toast.success(t('common:updated'))
    },
  })

  const deleteThing = useMutation({
    mutationFn: (id: string) => deleteThingFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['things'] })
      toast.success(t('common:deleted'))
    },
  })

  return {
    createThing,
    updateThing,
    deleteThing,
    isPending:
      createThing.isPending || updateThing.isPending || deleteThing.isPending,
  }
}
```

**Dialog Component Pattern (refactored):**

```typescript
// app/components/{feature}/{feature}-dialog.tsx
import { useThingMutations } from '~/features/{feature}/hooks'

export function ThingDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation(['feature', 'common'])
  const { createThing } = useThingMutations()
  const [formData, setFormData] = useState(initialState)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createThing.mutate(formData, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <Button type="submit" disabled={createThing.isPending}>
          {createThing.isPending ? t('common:saving') : t('common:save')}
        </Button>
      </form>
    </Dialog>
  )
}
```

**Cache Invalidation Pattern:**

```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['farms', farmId] })

// Invalidate all queries starting with key
queryClient.invalidateQueries({ queryKey: ['farms'] })

// Invalidate multiple related queries
onSuccess: async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['farms'] }),
    queryClient.invalidateQueries({ queryKey: ['batches'] }),
  ])
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Missing Hooks Files

Create hooks files for features that currently lack them, following the `sensors/hooks.ts` pattern.

### Phase 2: Refactor High-Priority Dialogs

Refactor dialogs that perform create/update mutations to use the new hooks.

### Phase 3: Refactor Medium-Priority Components

Refactor remaining components with direct server function calls.

### Phase 4: Cleanup & Validation

Remove unused imports, verify all mutations work correctly.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/features/farms/hooks.ts`

- **IMPLEMENT**: Farm mutations hook with `createFarm`, `updateFarm`, `deleteFarm`
- **PATTERN**: Mirror `app/features/sensors/hooks.ts` structure
- **IMPORTS**:
  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query'
  import { toast } from 'sonner'
  import { useTranslation } from 'react-i18next'
  import { createFarmFn, updateFarmFn, deleteFarmFn } from './server'
  ```
- **QUERY KEYS**: `['farms']`, `['farms', farmId]`
- **VALIDATE**: `bun run check`

### Task 2: CREATE `app/features/suppliers/hooks.ts`

- **IMPLEMENT**: Supplier mutations hook with `createSupplier`, `updateSupplier`
- **PATTERN**: Mirror `app/features/sensors/hooks.ts`
- **IMPORTS**: From `./server` - `createSupplierFn`, `updateSupplierFn`
- **QUERY KEYS**: `['suppliers']`, `['suppliers', farmId]`
- **VALIDATE**: `bun run check`

### Task 3: CREATE `app/features/marketplace/hooks.ts`

- **IMPLEMENT**: Marketplace mutations with `createListing`, `updateListing`, `deleteListing`
- **PATTERN**: Mirror `app/features/sensors/hooks.ts`
- **IMPORTS**: From `./server` - `createListingFn`, `updateListingFn`, `deleteListingFn`
- **QUERY KEYS**: `['listings']`, `['my-listings']`
- **VALIDATE**: `bun run check`

### Task 4: CREATE `app/features/invoices/hooks.ts`

- **IMPLEMENT**: Invoice mutations with `createInvoice`, `updateInvoice`
- **PATTERN**: Mirror `app/features/sensors/hooks.ts`
- **IMPORTS**: From `./server` - `createInvoiceFn`, `updateInvoiceFn`
- **QUERY KEYS**: `['invoices']`, `['invoices', farmId]`
- **VALIDATE**: `bun run check`

### Task 5: CREATE `app/features/expenses/hooks.ts`

- **IMPLEMENT**: Expense mutations with `createExpense`, `updateExpense`, `deleteExpense`
- **PATTERN**: Mirror `app/features/sensors/hooks.ts`
- **IMPORTS**: From `./server` - `createExpenseFn`, `updateExpenseFn`, `deleteExpenseFn`
- **QUERY KEYS**: `['expenses']`, `['expenses', farmId]`
- **VALIDATE**: `bun run check`

### Task 6: CREATE `app/features/mortality/hooks.ts`

- **IMPLEMENT**: Mortality mutations with `recordMortality`
- **PATTERN**: Mirror `app/features/sensors/hooks.ts`
- **IMPORTS**: From `./server` - `recordMortalityFn`
- **QUERY KEYS**: `['mortality']`, `['batches']` (mortality affects batch quantity)
- **VALIDATE**: `bun run check`

### Task 7: CREATE `app/features/weight/hooks.ts`

- **IMPLEMENT**: Weight sample mutations with `createWeightSample`
- **PATTERN**: Mirror `app/features/sensors/hooks.ts`
- **IMPORTS**: From `./server` - `createWeightSampleFn`
- **QUERY KEYS**: `['weight-samples']`, `['batches']`
- **VALIDATE**: `bun run check`

### Task 8: UPDATE `app/components/farms/farm-dialog.tsx`

- **REFACTOR**: Replace direct `createFarmFn`/`updateFarmFn` calls with `useFarmMutations()`
- **REMOVE**: `useState` for `isSubmitting`, manual try/catch/finally
- **IMPORTS**: Add `import { useFarmMutations } from '~/features/farms/hooks'`
- **REMOVE IMPORTS**: `createFarmFn`, `updateFarmFn` from `~/features/farms/server`
- **GOTCHA**: Keep `onSuccess` callback in `mutate()` for dialog close
- **VALIDATE**: `bun run check && bun run lint`

### Task 9: UPDATE `app/components/farms/edit-farm-dialog.tsx`

- **REFACTOR**: Replace direct `updateFarmFn` with `useFarmMutations().updateFarm`
- **REMOVE**: Manual `isSubmitting` state, try/catch blocks
- **IMPORTS**: Add `import { useFarmMutations } from '~/features/farms/hooks'`
- **VALIDATE**: `bun run check && bun run lint`

### Task 10: UPDATE `app/components/customers/customer-dialog.tsx`

- **REFACTOR**: Use existing `useCustomerActions` or create `useCustomerMutations`
- **CHECK**: `app/features/customers/hooks.ts` already exists - verify it has mutations
- **IMPORTS**: Update to use hooks instead of direct server function
- **VALIDATE**: `bun run check && bun run lint`

### Task 11: UPDATE `app/components/suppliers/supplier-dialog.tsx`

- **REFACTOR**: Replace direct `createSupplierFn` with `useSupplierMutations().createSupplier`
- **REMOVE**: Manual loading state management
- **IMPORTS**: Add `import { useSupplierMutations } from '~/features/suppliers/hooks'`
- **VALIDATE**: `bun run check && bun run lint`

### Task 12: UPDATE `app/components/batches/batch-dialog.tsx`

- **REFACTOR**: Use existing `useBatchMutations().createBatchMutation` from hooks
- **CHECK**: `app/features/batches/hooks.ts` already has `createBatchMutation`
- **REMOVE**: Direct `createBatchFn` import, manual state management
- **VALIDATE**: `bun run check && bun run lint`

### Task 13: UPDATE `app/routes/marketplace/create.tsx`

- **REFACTOR**: Replace inline `useMutation` with `useMarketplaceMutations().createListing`
- **BENEFIT**: Centralizes mutation logic, consistent error handling
- **IMPORTS**: Add `import { useMarketplaceMutations } from '~/features/marketplace/hooks'`
- **VALIDATE**: `bun run check && bun run lint`

### Task 14: UPDATE `app/components/invoices/invoice-dialog.tsx`

- **REFACTOR**: Replace direct `createInvoiceFn` with `useInvoiceMutations().createInvoice`
- **REMOVE**: Manual loading state, try/catch
- **IMPORTS**: Add `import { useInvoiceMutations } from '~/features/invoices/hooks'`
- **VALIDATE**: `bun run check && bun run lint`

### Task 15: UPDATE `app/components/expenses/expense-dialog.tsx`

- **REFACTOR**: Replace direct `createExpenseFn` with `useExpenseMutations().createExpense`
- **REMOVE**: Manual loading state
- **IMPORTS**: Add `import { useExpenseMutations } from '~/features/expenses/hooks'`
- **VALIDATE**: `bun run check && bun run lint`

### Task 16: UPDATE `app/components/mortality/mortality-dialog.tsx`

- **REFACTOR**: Replace direct `recordMortalityFn` with `useMortalityMutations().recordMortality`
- **GOTCHA**: Must invalidate both `['mortality']` and `['batches']` queries
- **IMPORTS**: Add `import { useMortalityMutations } from '~/features/mortality/hooks'`
- **VALIDATE**: `bun run check && bun run lint`

### Task 17: UPDATE `app/components/weight/weight-dialog.tsx`

- **REFACTOR**: Replace direct `createWeightSampleFn` with `useWeightMutations().createWeightSample`
- **IMPORTS**: Add `import { useWeightMutations } from '~/features/weight/hooks'`
- **VALIDATE**: `bun run check && bun run lint`

### Task 18: CLEANUP duplicate dialogs in `app/components/dialogs/`

- **CHECK**: `app/components/dialogs/` has duplicates of many dialogs
- **DECISION**: Either refactor these too OR remove if unused
- **FILES**: `batch-dialog.tsx`, `customer-dialog.tsx`, `supplier-dialog.tsx`, `farm-dialog.tsx`, etc.
- **VALIDATE**: `bun run check && bun run lint`

### Task 19: FINAL VALIDATION

- **RUN**: `bun run check && bun run lint && bun run test --run && bun run build`
- **VERIFY**: All dialogs still function correctly
- **CHECK**: No console errors, proper loading states shown

---

## TESTING STRATEGY

### Manual Testing

For each refactored dialog:

1. Open dialog
2. Submit with valid data → verify success toast, dialog closes, data appears
3. Submit with invalid data → verify error toast, dialog stays open
4. Check loading state shows during submission
5. Verify cache invalidation (new data appears without refresh)

### Automated Testing

No new tests required - this is a refactor that maintains existing behavior.
Existing tests should continue to pass.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
# Type checking
bun run check

# Linting
bun run lint
```

### Level 2: Unit Tests

```bash
# Run all tests
bun run test --run
```

### Level 3: Build Verification

```bash
# Verify production build
bun run build
```

### Complete Validation

```bash
bun run check && bun run lint && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All high-priority dialogs use `useMutation` hooks
- [ ] No direct `await serverFn()` calls in form handlers
- [ ] All mutations show loading state via `isPending`
- [ ] All mutations show success/error toasts
- [ ] Cache invalidation works (data refreshes after mutation)
- [ ] All validation commands pass
- [ ] No regressions in existing functionality

---

## COMPLETION CHECKLIST

- [ ] All 7 hooks files created
- [ ] All 10 dialog components refactored
- [ ] Duplicate dialogs in `app/components/dialogs/` addressed
- [ ] All validation commands pass
- [ ] Manual testing confirms dialogs work correctly

---

## NOTES

### Why This Matters

1. **Consistency**: All mutations follow the same pattern
2. **Maintainability**: Mutation logic centralized in hooks files
3. **UX**: Proper loading states, error handling
4. **Future-proofing**: Enables optimistic updates, offline support

### What NOT to Change

- **Route loaders**: Direct server function calls in loaders are correct
- **useQuery**: Dynamic imports inside `queryFn` are fine (feed-formulation does this)
- **Auth checks**: `checkAuthFn` in `_auth.tsx` is correct pattern

### Cache Invalidation Strategy

Use `queryClient.invalidateQueries()` in `onSuccess`, NOT `router.invalidate()`:

- `queryClient.invalidateQueries()` - TanStack Query cache, triggers refetch
- `router.invalidate()` - TanStack Router cache, triggers loader re-run

For mutations, prefer `queryClient.invalidateQueries()` for consistency.

### References

- [TanStack Query Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
