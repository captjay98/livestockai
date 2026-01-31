# Feature: Offline Integration - Clean Architecture

**Status**: Ready for Implementation  
**Priority**: High  
**Complexity**: High  
**Estimated Time**: 6-8 hours

## Executive Summary

The offline infrastructure is **built but not wired up**. This plan integrates the optimistic mutation pattern into all components, establishing a clean single-pattern architecture.

## Current State (Problem)

| Location                    | Count    | Pattern                   | Status                |
| --------------------------- | -------- | ------------------------- | --------------------- |
| `use-*-mutations.ts`        | 14 files | Optimistic offline        | ✅ Built, ❌ Not used |
| `hooks.ts`                  | 16 files | Simple mutations          | ✅ Used by components |
| `app/components/dialogs/`   | 14 files | Direct `await serverFn()` | ❌ Anti-pattern       |
| `app/components/{feature}/` | 12 files | Import from `hooks.ts`    | ⚠️ No offline support |

## Target State (Solution)

**Single pattern for all mutations:**

```
app/features/{feature}/
├── server.ts              # Server functions (unchanged)
├── mutations.ts           # Optimistic mutations (renamed from use-*-mutations.ts)
├── queries.ts             # Query hooks (extracted from hooks.ts where needed)
└── types.ts               # Types
```

**Delete entirely:**

- All `hooks.ts` files (16 files)
- All `use-*-mutations.ts` files (renamed to `mutations.ts`)

## User Story

As a farmer using LivestockAI in areas with unreliable internet  
I want my changes to appear immediately and sync when online  
So that I can work efficiently without waiting for network responses

---

## CONTEXT REFERENCES

### Files to READ Before Implementing

**Optimistic Infrastructure (understand the pattern):**

- `app/lib/optimistic-utils.ts` - Core utilities for optimistic updates
- `app/lib/temp-id-resolver.ts` - Temp ID → Server ID mapping
- `app/features/expenses/use-expense-mutations.ts` - Reference implementation

**Components to Update (understand current usage):**

- `app/components/batches/batch-dialog.tsx` - Uses `hooks.ts`
- `app/components/dialogs/batch-dialog.tsx` - Uses direct `await`
- `app/components/weight/weight-dialog.tsx` - Already uses optimistic (reference)

**Documentation:**

- `docs/OFFLINE-SUPPORT.md` - Feature requirements

### Files to Create

| New File                              | Source                       | Action |
| ------------------------------------- | ---------------------------- | ------ |
| `app/features/batches/mutations.ts`   | `use-batch-mutations.ts`     | Rename |
| `app/features/batches/queries.ts`     | Extract from `hooks.ts`      | Create |
| `app/features/expenses/mutations.ts`  | `use-expense-mutations.ts`   | Rename |
| `app/features/mortality/mutations.ts` | `use-mortality-mutations.ts` | Rename |
| ... (14 total)                        |                              |        |

### Files to Delete

All `hooks.ts` files in features with optimistic mutations:

- `app/features/batches/hooks.ts`
- `app/features/expenses/hooks.ts`
- `app/features/mortality/hooks.ts`
- `app/features/customers/hooks.ts`
- `app/features/suppliers/hooks.ts`
- `app/features/invoices/hooks.ts`
- `app/features/eggs/hooks.ts`
- `app/features/vaccinations/hooks.ts`
- `app/features/structures/hooks.ts`
- `app/features/weight/hooks.ts`

**Keep** (no optimistic version exists):

- `app/features/farms/hooks.ts`
- `app/features/sensors/hooks.ts`
- `app/features/marketplace/hooks.ts`
- `app/features/settings/hooks.ts`
- `app/features/inventory/hooks.ts`
- `app/features/digital-foreman/hooks.ts`

---

## IMPLEMENTATION PLAN

### Phase 1: Rename Optimistic Files (14 files)

Rename `use-*-mutations.ts` → `mutations.ts` for cleaner imports.

### Phase 2: Extract Query Hooks (where needed)

Create `queries.ts` files for features that have query hooks in `hooks.ts`.

### Phase 3: Update Component Imports (~26 files)

Update all components to import from new locations.

### Phase 4: Update Dialogs in `app/components/dialogs/` (14 files)

Replace direct `await serverFn()` with mutation hooks.

### Phase 5: Delete Old Files

Remove all redundant `hooks.ts` files.

### Phase 6: Validation

Run full test suite and build.

---

## STEP-BY-STEP TASKS

### Phase 1: Rename Optimistic Mutation Files

#### Task 1.1: RENAME batches mutations

```bash
mv app/features/batches/use-batch-mutations.ts app/features/batches/mutations.ts
```

- **VALIDATE**: `ls app/features/batches/mutations.ts`

#### Task 1.2: RENAME expenses mutations

```bash
mv app/features/expenses/use-expense-mutations.ts app/features/expenses/mutations.ts
```

#### Task 1.3: RENAME mortality mutations

```bash
mv app/features/mortality/use-mortality-mutations.ts app/features/mortality/mutations.ts
```

#### Task 1.4: RENAME weight mutations

```bash
mv app/features/weight/use-weight-mutations.ts app/features/weight/mutations.ts
```

#### Task 1.5: RENAME customers mutations

```bash
mv app/features/customers/use-customer-mutations.ts app/features/customers/mutations.ts
```

#### Task 1.6: RENAME suppliers mutations

```bash
mv app/features/suppliers/use-supplier-mutations.ts app/features/suppliers/mutations.ts
```

#### Task 1.7: RENAME invoices mutations

```bash
mv app/features/invoices/use-invoice-mutations.ts app/features/invoices/mutations.ts
```

#### Task 1.8: RENAME eggs mutations

```bash
mv app/features/eggs/use-egg-mutations.ts app/features/eggs/mutations.ts
```

#### Task 1.9: RENAME vaccinations mutations

```bash
mv app/features/vaccinations/use-vaccination-mutations.ts app/features/vaccinations/mutations.ts
```

#### Task 1.10: RENAME structures mutations

```bash
mv app/features/structures/use-structure-mutations.ts app/features/structures/mutations.ts
```

#### Task 1.11: RENAME feed mutations

```bash
mv app/features/feed/use-feed-mutations.ts app/features/feed/mutations.ts
```

#### Task 1.12: RENAME water-quality mutations

```bash
mv app/features/water-quality/use-water-quality-mutations.ts app/features/water-quality/mutations.ts
```

#### Task 1.13: RENAME sales mutations

```bash
mv app/features/sales/use-sales-mutations.ts app/features/sales/mutations.ts
```

#### Task 1.14: RENAME tasks mutations

```bash
mv app/features/tasks/use-task-mutations.ts app/features/tasks/mutations.ts
```

---

### Phase 2: Extract Query Hooks

#### Task 2.1: CREATE `app/features/batches/queries.ts`

Extract query hooks from `hooks.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { getBatchesFn } from './server'
import { getBatchDetailsFn } from './server/stats'
import {
  getBreedsForSpeciesFn,
  getSpeciesForLivestockTypeFn,
} from '~/features/breeds/server'

export function useBatches(farmId: string | null) {
  return useQuery({
    queryKey: ['batches', farmId],
    queryFn: () =>
      farmId ? getBatchesFn({ data: { farmId } }) : Promise.resolve([]),
    enabled: !!farmId,
  })
}

export function useBatch(batchId: string | null) {
  return useQuery({
    queryKey: ['batch', batchId],
    queryFn: () =>
      batchId
        ? getBatchDetailsFn({ data: { batchId } })
        : Promise.resolve(null),
    enabled: !!batchId,
  })
}

export function useSpecies(livestockType: string | null) {
  return useQuery({
    queryKey: ['species', livestockType],
    queryFn: () =>
      livestockType
        ? getSpeciesForLivestockTypeFn({ data: { livestockType } })
        : Promise.resolve([]),
    enabled: !!livestockType,
  })
}

export function useBreeds(speciesKey: string | null) {
  return useQuery({
    queryKey: ['breeds', speciesKey],
    queryFn: () =>
      speciesKey
        ? getBreedsForSpeciesFn({ data: { speciesKey } })
        : Promise.resolve([]),
    enabled: !!speciesKey,
  })
}
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep queries.ts`

#### Task 2.2: CREATE `app/features/eggs/queries.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getPoultryBatchesForEggsFn } from './server'

export function usePoultryBatchesForEggs(farmId: string | null) {
  return useQuery({
    queryKey: ['poultry-batches-eggs', farmId],
    queryFn: () =>
      farmId
        ? getPoultryBatchesForEggsFn({ data: { farmId } })
        : Promise.resolve([]),
    enabled: !!farmId,
  })
}
```

---

### Phase 3: Update Feature Component Imports

#### Task 3.1: UPDATE `app/components/batches/batch-dialog.tsx`

**Before:**

```typescript
import { useBatchMutations } from '~/features/batches/hooks'
```

**After:**

```typescript
import { useBatchMutations } from '~/features/batches/mutations'
```

- **ALSO UPDATE**: Mutation call signature if different
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep batch-dialog`

#### Task 3.2: UPDATE `app/components/batches/batch-form.tsx`

**Before:**

```typescript
import {
  useBatches,
  useBatch,
  useSpecies,
  useBreeds,
  useBatchMutations,
} from '~/features/batches/hooks'
```

**After:**

```typescript
import { useBatchMutations } from '~/features/batches/mutations'
import {
  useBatches,
  useBatch,
  useSpecies,
  useBreeds,
} from '~/features/batches/queries'
```

#### Task 3.3: UPDATE `app/components/expenses/expense-dialog.tsx`

**Before:**

```typescript
import { useExpenseMutations } from '~/features/expenses/hooks'
```

**After:**

```typescript
import { useExpenseMutations } from '~/features/expenses/mutations'
```

#### Task 3.4: UPDATE `app/components/mortality/mortality-dialog.tsx`

**Before:**

```typescript
import { useMortalityMutations } from '~/features/mortality/hooks'
```

**After:**

```typescript
import { useMortalityMutations } from '~/features/mortality/mutations'
```

#### Task 3.5: UPDATE `app/components/suppliers/supplier-dialog.tsx`

**Before:**

```typescript
import { useSupplierMutations } from '~/features/suppliers/hooks'
```

**After:**

```typescript
import { useSupplierMutations } from '~/features/suppliers/mutations'
```

#### Task 3.6: UPDATE `app/components/invoices/invoice-dialog.tsx`

**Before:**

```typescript
import { useInvoiceMutations } from '~/features/invoices/hooks'
```

**After:**

```typescript
import { useInvoiceMutations } from '~/features/invoices/mutations'
```

#### Task 3.7: UPDATE `app/components/eggs/egg-dialog.tsx`

Update imports to use mutations and queries.

#### Task 3.8: UPDATE `app/components/vaccinations/vaccination-dialog.tsx`

**Before:**

```typescript
import { useVaccinationMutations } from '~/features/vaccinations/hooks'
```

**After:**

```typescript
import { useVaccinationMutations } from '~/features/vaccinations/mutations'
```

#### Task 3.9: UPDATE `app/components/onboarding/create-structure-step.tsx`

**Before:**

```typescript
import { useStructureMutations } from '~/features/structures/hooks'
```

**After:**

```typescript
import { useStructureMutations } from '~/features/structures/mutations'
```

#### Task 3.10: UPDATE `app/components/weight/weight-dialog.tsx`

**Before:**

```typescript
import { useWeightMutations } from '~/features/weight/use-weight-mutations'
```

**After:**

```typescript
import { useWeightMutations } from '~/features/weight/mutations'
```

---

### Phase 4: Refactor Dialogs in `app/components/dialogs/`

These use direct `await serverFn()` and need full refactoring.

#### Task 4.1: REFACTOR `app/components/dialogs/batch-dialog.tsx`

**Current pattern (anti-pattern):**

```typescript
const handleSubmit = async () => {
  setIsSubmitting(true)
  try {
    const batchId = await createBatchFn({ data: { batch: formData } })
    toast.success('Batch created')
    router.invalidate()
  } catch (e) {
    toast.error(e.message)
  } finally {
    setIsSubmitting(false)
  }
}
```

**Target pattern:**

```typescript
import { useBatchMutations } from '~/features/batches/mutations'

const { createBatch } = useBatchMutations()

const handleSubmit = () => {
  createBatch.mutate(
    { batch: formData },
    { onSuccess: () => onOpenChange(false) }
  )
}

// In JSX:
<Button disabled={createBatch.isPending}>
  {createBatch.isPending ? 'Creating...' : 'Create'}
</Button>
```

- **REMOVE**: `useState` for `isSubmitting`
- **REMOVE**: try/catch/finally block
- **REMOVE**: `router.invalidate()` (handled by mutation)
- **REMOVE**: manual `toast.success/error` (handled by mutation)

#### Task 4.2: REFACTOR `app/components/dialogs/expense-dialog.tsx`

Same pattern as 4.1, using `useExpenseMutations`.

#### Task 4.3: REFACTOR `app/components/dialogs/mortality-dialog.tsx`

Same pattern as 4.1, using `useMortalityMutations`.

#### Task 4.4: REFACTOR `app/components/dialogs/sale-dialog.tsx`

Same pattern as 4.1, using `useSalesMutations`.

#### Task 4.5: REFACTOR `app/components/dialogs/invoice-dialog.tsx`

Same pattern as 4.1, using `useInvoiceMutations`.

#### Task 4.6: REFACTOR `app/components/dialogs/customer-dialog.tsx`

Same pattern as 4.1, using `useCustomerMutations`.

#### Task 4.7: REFACTOR `app/components/dialogs/supplier-dialog.tsx`

Same pattern as 4.1, using `useSupplierMutations`.

#### Task 4.8: REFACTOR `app/components/dialogs/egg-dialog.tsx`

Same pattern as 4.1, using `useEggMutations`.

#### Task 4.9: REFACTOR `app/components/dialogs/vaccination-dialog.tsx`

Same pattern as 4.1, using `useVaccinationMutations`.

#### Task 4.10: REFACTOR `app/components/dialogs/feed-dialog.tsx`

Same pattern as 4.1, using `useFeedMutations`.

#### Task 4.11: REFACTOR `app/components/dialogs/water-quality-dialog.tsx`

Same pattern as 4.1, using `useWaterQualityMutations`.

#### Task 4.12: REFACTOR `app/components/dialogs/weight-dialog.tsx`

Same pattern as 4.1, using `useWeightMutations`.

#### Task 4.13: REFACTOR `app/components/dialogs/farm-dialog.tsx`

**Note**: Farms don't have optimistic mutations (online required).
Keep using simple pattern but use `useFarmMutations` from `hooks.ts`.

#### Task 4.14: REFACTOR `app/components/dialogs/edit-farm-dialog.tsx`

Same as 4.13.

---

### Phase 5: Delete Old Files

#### Task 5.1: DELETE redundant hooks.ts files

```bash
rm app/features/batches/hooks.ts
rm app/features/expenses/hooks.ts
rm app/features/mortality/hooks.ts
rm app/features/customers/hooks.ts
rm app/features/suppliers/hooks.ts
rm app/features/invoices/hooks.ts
rm app/features/eggs/hooks.ts
rm app/features/vaccinations/hooks.ts
rm app/features/structures/hooks.ts
rm app/features/weight/hooks.ts
```

**KEEP these (no optimistic version):**

- `app/features/farms/hooks.ts`
- `app/features/sensors/hooks.ts`
- `app/features/marketplace/hooks.ts`
- `app/features/settings/hooks.ts`
- `app/features/inventory/hooks.ts`
- `app/features/digital-foreman/hooks.ts`

---

### Phase 6: Validation

#### Task 6.1: TypeScript Check

```bash
npx tsc --noEmit
```

#### Task 6.2: Lint Check

```bash
bun run lint
```

#### Task 6.3: Test Suite

```bash
bun run test --run
```

#### Task 6.4: Build Check

```bash
bun run build
```

#### Task 6.5: Full Validation

```bash
bun run check && bun run test --run && bun run build
```

---

## MUTATION SIGNATURE REFERENCE

### Simple hooks.ts pattern (OLD):

```typescript
createExpense.mutate({ data: { expense: {...} } })
```

### Optimistic mutations.ts pattern (NEW):

```typescript
createExpense.mutate({ expense: {...} })
```

**Key difference**: No nested `data` wrapper in optimistic hooks.

---

## TESTING STRATEGY

### Manual Testing - Optimistic Updates

1. Go offline (DevTools → Network → Offline)
2. Create a batch - should appear immediately with temp ID
3. Check sync status - should show "Pending (1)"
4. Go online - should sync automatically
5. Verify temp ID replaced - record should have real UUID

### Manual Testing - Conflict Resolution

1. Create a batch on Device A (offline)
2. Update same batch on Device B (online)
3. Sync Device A - should handle conflict

---

## ACCEPTANCE CRITERIA

- [ ] All 14 `use-*-mutations.ts` renamed to `mutations.ts`
- [ ] All components import from `mutations.ts`
- [ ] All `app/components/dialogs/` use mutation hooks
- [ ] All redundant `hooks.ts` deleted
- [ ] `bun run check` passes
- [ ] `bun run test --run` passes
- [ ] `bun run build` passes
- [ ] Optimistic updates work offline
- [ ] Temp ID resolution works on sync

---

## ROLLBACK PLAN

```bash
git stash  # Before starting
# If issues:
git stash pop
```

---

## FILES SUMMARY

### Rename (14 files)

`use-*-mutations.ts` → `mutations.ts`

### Create (2-3 files)

`queries.ts` for features with query hooks

### Update (~26 files)

Component imports

### Delete (10 files)

Redundant `hooks.ts` files

### Keep (6 files)

`hooks.ts` for features without optimistic support
