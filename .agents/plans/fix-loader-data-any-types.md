# Feature: Fix Remaining `any` Types in Loader Data

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Eliminate the remaining ~27 `any` type annotations in route files by properly typing loader data from TanStack Start server functions. This improves type safety, enables better IDE autocomplete, and catches bugs at compile time.

## User Story

As a developer maintaining LivestockAI
I want fully typed loader data in all route files
So that TypeScript catches type errors and IDE provides accurate autocomplete

## Problem Statement

Route files use `any` type annotations in map callbacks and find operations because `Route.useLoaderData()` returns untyped data. The server functions return typed data, but the type information is lost when passing through the TanStack Router loader chain.

**Current pattern (broken):**

```typescript
const batches = Route.useLoaderData()  // Type: unknown
batches.map((batch: any) => ...)       // Forces any annotation
```

## Solution Statement

Create a shared `LoaderData` interface for each route that matches the server function return type, then cast `Route.useLoaderData()` to that interface. This preserves type safety while working within TanStack Router's type inference limitations.

**Target pattern:**

```typescript
interface LoaderData {
  batches: Array<Batch>
  customers: Array<Customer>
}

const { batches, customers } = Route.useLoaderData() as LoaderData
batches.map((batch) => ...)  // Type inferred from LoaderData
```

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Route files (10 files)
**Dependencies**: None (internal refactor)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/routes/_auth/sales/new.tsx` (lines 40-55) - Has Batch/Customer interfaces but still uses any
- `app/routes/_auth/feed/new.tsx` (lines 70-95) - Simple loader pattern to fix
- `app/routes/_auth/batches/index.tsx` (lines 54-80) - Example of existing Batch interface
- `app/routes/_auth/vaccinations/index.tsx` (lines 61-70, 414-440) - Has alert types to fix

### Files to Modify

**New form routes (6 files) - Simple batch loader:**

1. `app/routes/_auth/feed/new.tsx` - batches only
2. `app/routes/_auth/weight/new.tsx` - batches only
3. `app/routes/_auth/water-quality/new.tsx` - batches only
4. `app/routes/_auth/eggs/new.tsx` - batches only
5. `app/routes/_auth/vaccinations/new.tsx` - batches only
6. `app/routes/_auth/expenses/new.tsx` - suppliers only

**Complex form routes (1 file):** 7. `app/routes/_auth/sales/new.tsx` - batches + customers

**Index routes with state (2 files):** 8. `app/routes/_auth/customers/index.tsx` - handleEditCustomer callback 9. `app/routes/_auth/vaccinations/index.tsx` - alerts.overdue/upcoming

**Detail routes (3 files):** 10. `app/routes/_auth/customers/$customerId.tsx` - customer.sales 11. `app/routes/_auth/suppliers/$supplierId.tsx` - supplier.products, supplier.expenses 12. `app/routes/_auth/farms/$farmId/index.tsx` - activeBatches, recentSales, recentExpenses

### Non-Route Files to Fix

13. `app/features/expenses/server.ts` (line 209) - `updateData: any`
14. `app/components/pwa-prompt.tsx` (lines 4, 14, 17) - PWA mock types (SKIP - intentional)
15. `app/lib/query-client.ts` (line 46) - error retry (SKIP - TanStack Query pattern)

### Patterns to Follow

**Batch Interface Pattern (from batches/index.tsx):**

```typescript
interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}
```

**Customer Interface Pattern:**

```typescript
interface Customer {
  id: string
  name: string
  phone: string
}
```

**Supplier Interface Pattern:**

```typescript
interface Supplier {
  id: string
  name: string
  phone: string
}
```

**LoaderData Cast Pattern:**

```typescript
// For simple loaders returning array
const batches = Route.useLoaderData() as Array<Batch>

// For complex loaders returning object
interface LoaderData {
  batches: Array<Batch>
  customers: Array<Customer>
}
const { batches, customers } = Route.useLoaderData() as LoaderData
```

---

## IMPLEMENTATION PLAN

### Phase 1: Simple Batch Loaders (6 files)

Fix routes that only load batches array.

### Phase 2: Complex Loaders (4 files)

Fix routes with multiple data types or nested data.

### Phase 3: Non-Route Files (1 file)

Fix the expenses server updateData type.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/routes/_auth/feed/new.tsx`

- **ADD**: Batch interface after imports (if not exists)
- **UPDATE**: Cast loader data: `const batches = Route.useLoaderData() as Array<Batch>`
- **REMOVE**: All `: any` from batch callbacks
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep feed/new`

**Implementation:**

```typescript
// Add interface if missing
interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

// Update useLoaderData call
const batches = Route.useLoaderData() as Array<Batch>

// Remove : any from callbacks
batches.find((b) => b.id === formData.batchId)
batches.map((batch) => ...)
```

### Task 2: UPDATE `app/routes/_auth/weight/new.tsx`

- **ADD**: Batch interface
- **UPDATE**: Cast loader data as `Array<Batch>`
- **REMOVE**: All `: any` from batch callbacks (3 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep weight/new`

### Task 3: UPDATE `app/routes/_auth/water-quality/new.tsx`

- **ADD**: Batch interface
- **UPDATE**: Cast loader data as `Array<Batch>`
- **REMOVE**: All `: any` from batch callbacks (2 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep water-quality/new`

### Task 4: UPDATE `app/routes/_auth/eggs/new.tsx`

- **ADD**: Batch interface
- **UPDATE**: Cast loader data as `Array<Batch>`
- **REMOVE**: All `: any` from batch callbacks (3 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep eggs/new`

### Task 5: UPDATE `app/routes/_auth/vaccinations/new.tsx`

- **ADD**: Batch interface
- **UPDATE**: Cast loader data as `Array<Batch>`
- **REMOVE**: All `: any` from batch callbacks (2 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep vaccinations/new`

### Task 6: UPDATE `app/routes/_auth/expenses/new.tsx`

- **ADD**: Supplier interface
- **UPDATE**: Cast loader data as `Array<Supplier>`
- **REMOVE**: All `: any` from supplier callbacks (2 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep expenses/new`

**Supplier interface:**

```typescript
interface Supplier {
  id: string
  name: string
}
```

### Task 7: UPDATE `app/routes/_auth/sales/new.tsx`

- **VERIFY**: Batch and Customer interfaces exist
- **ADD**: LoaderData interface
- **UPDATE**: Cast loader data as `LoaderData`
- **REMOVE**: All `: any` from callbacks (2 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep sales/new`

**Implementation:**

```typescript
interface LoaderData {
  batches: Array<Batch>
  customers: Array<Customer>
}

const { batches, customers } = Route.useLoaderData() as LoaderData
```

### Task 8: UPDATE `app/routes/_auth/customers/index.tsx`

- **FIND**: Existing Customer interface or state type
- **UPDATE**: Type the `handleEditCustomer` parameter
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep customers/index`

**Implementation:**

```typescript
// Find the Customer type used in state
const handleEditCustomer = (customer: Customer) => {
  setSelectedCustomer(customer)
  // ...
}
```

### Task 9: UPDATE `app/routes/_auth/vaccinations/index.tsx`

- **ADD**: VaccinationAlert interface
- **UPDATE**: Type the alerts.overdue and alerts.upcoming arrays
- **REMOVE**: `: any` from alert map callbacks (2 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep vaccinations/index`

**Implementation:**

```typescript
interface VaccinationAlert {
  batchId: string
  species: string
  vaccineName: string
  dueDate: Date
}

// In component, cast alerts state or loader data
```

### Task 10: UPDATE `app/routes/_auth/customers/$customerId.tsx`

- **ADD**: Sale interface for customer.sales
- **UPDATE**: Type the sales map callback
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep 'customers/\$customerId'`

**Implementation:**

```typescript
interface CustomerSale {
  id: string
  date: Date
  quantity: number
  totalAmount: string
  livestockType: string
}

// Cast or type the customer.sales array
customer.sales.slice(0, 10).map((sale: CustomerSale) => ...)
```

### Task 11: UPDATE `app/routes/_auth/suppliers/$supplierId.tsx`

- **ADD**: Product and Expense interfaces
- **UPDATE**: Type the supplier.products and supplier.expenses arrays
- **REMOVE**: `: any` from callbacks (2 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep 'suppliers/\$supplierId'`

### Task 12: UPDATE `app/routes/_auth/farms/$farmId/index.tsx`

- **ADD**: Batch, Sale, Expense interfaces (if not exist)
- **UPDATE**: Type activeBatches, recentSales, recentExpenses
- **REMOVE**: `: any` from callbacks (3 occurrences)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep 'farms/\$farmId'`

### Task 13: UPDATE `app/features/expenses/server.ts`

- **FIND**: Line 209 with `updateData: any`
- **UPDATE**: Use `Partial<UpdateExpenseData>` or explicit interface
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep expenses/server`

**Implementation:**

```typescript
// Before
const updateData: any = {}

// After
const updateData: Partial<{
  category?: string
  amount?: string
  date?: Date
  description?: string
  // ... other fields
}> = {}
```

### Task 14: Final Validation

- **VALIDATE**: `npx tsc --noEmit`
- **VALIDATE**: `bun run lint`
- **VALIDATE**: `bun test`
- **VALIDATE**: `grep -r ": any" app --include="*.tsx" | grep -v pwa-prompt | wc -l` (should be ~2-3)

---

## TESTING STRATEGY

### Unit Tests

No new tests needed - this is a type-level refactor with no runtime behavior changes.

### Validation Tests

Run full test suite to ensure no regressions:

```bash
bun test
```

### Type Checking

Primary validation is TypeScript compilation:

```bash
npx tsc --noEmit
```

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
bun run lint
```

### Level 2: Type Checking

```bash
npx tsc --noEmit
```

### Level 3: Tests

```bash
bun test
```

### Level 4: Any Count Verification

```bash
# Should be reduced from 27 to ~5 (PWA + query-client intentional)
grep -r ": any" app --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts" | wc -l
```

### Level 5: Remaining Any Audit

```bash
# Should only show pwa-prompt.tsx and query-client.ts
grep -rn ": any" app --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts"
```

---

## ACCEPTANCE CRITERIA

- [ ] All route files have typed loader data (no `any` in map/find callbacks)
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `bun run lint` passes with 0 errors
- [ ] `bun test` passes with 0 failures
- [ ] `any` count reduced from 27 to ≤5
- [ ] Remaining `any` types are intentional (PWA mock, query-client error)
- [ ] No runtime behavior changes

---

## COMPLETION CHECKLIST

- [ ] Task 1: feed/new.tsx
- [ ] Task 2: weight/new.tsx
- [ ] Task 3: water-quality/new.tsx
- [ ] Task 4: eggs/new.tsx
- [ ] Task 5: vaccinations/new.tsx
- [ ] Task 6: expenses/new.tsx
- [ ] Task 7: sales/new.tsx
- [ ] Task 8: customers/index.tsx
- [ ] Task 9: vaccinations/index.tsx
- [ ] Task 10: customers/$customerId.tsx
- [ ] Task 11: suppliers/$supplierId.tsx
- [ ] Task 12: farms/$farmId/index.tsx
- [ ] Task 13: expenses/server.ts
- [ ] Task 14: Final validation
- [ ] All validation commands pass
- [ ] Any count ≤5

---

## NOTES

### Design Decisions

1. **Cast over Generic** - Using `as Type` cast instead of trying to make TanStack Router infer types. The router's type inference is complex and casting is the pragmatic solution.

2. **Local Interfaces** - Define interfaces in each route file rather than importing from a shared location. This keeps routes self-contained and avoids circular dependencies.

3. **Minimal Interfaces** - Only include fields actually used in the component, not the full server response type.

4. **Skip PWA/Query** - The `any` types in `pwa-prompt.tsx` and `query-client.ts` are intentional workarounds for library types and should not be changed.

### Estimated Time

- Tasks 1-6 (simple loaders): 5 min each = 30 min
- Tasks 7-12 (complex loaders): 10 min each = 60 min
- Task 13 (server file): 5 min
- Task 14 (validation): 10 min

**Total: ~2 hours**

### Risk Assessment

**Low Risk** - All changes are type-level with no runtime behavior changes. The full test suite provides a safety net.

### Alternative Approaches Considered

1. **Export types from server functions** - Would require significant refactoring of server function patterns
2. **Use Zod inference** - Would require adding Zod schemas to all server functions
3. **Generic loader typing** - TanStack Router's type system doesn't support this well

The chosen approach (local interfaces + cast) is the simplest and most maintainable.
