# Feature: Codebase Type Safety & Consistency Cleanup

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Systematic cleanup of type safety issues and code consistency across the OpenLivestock codebase. This includes eliminating `any` types, consolidating duplicate interfaces, and removing debug console statements from production code.

## User Story

As a developer maintaining OpenLivestock
I want a fully type-safe codebase with consistent patterns
So that I can catch bugs at compile time and maintain code quality

## Problem Statement

The codebase has accumulated 39 uses of `any` type, 10 duplicate `PaginatedQuery` interfaces, and scattered console statements that reduce type safety and code quality.

## Solution Statement

1. Replace all `any` types with proper TypeScript types
2. Create `BasePaginatedQuery` and extend in each feature
3. Remove non-essential console.log statements
4. Add `LucideIcon` type for icon props

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Low-Medium
**Primary Systems Affected**: Routes, Features, Hooks
**Dependencies**: None (internal refactor)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/lib/types.ts` (lines 1-20) - Already has `BasePaginatedQuery` defined
- `app/features/auth/server.ts` (lines 20-40) - Catch block patterns to fix
- `app/routes/_auth.tsx` (lines 40-55) - Catch block pattern to fix
- `app/hooks/useModuleNavigation.ts` (lines 1-15) - Icon type to fix
- `app/routes/_auth/feed/index.tsx` (lines 280-290) - Search param pattern example

### Files to Modify

**Catch Block Fixes (3 files):**
- `app/features/auth/server.ts`
- `app/routes/_auth.tsx`

**Search Param Fixes (8 files):**
- `app/routes/_auth/weight/index.tsx`
- `app/routes/_auth/settings/audit.tsx`
- `app/routes/_auth/suppliers/index.tsx`
- `app/routes/_auth/invoices/index.tsx`
- `app/routes/_auth/water-quality/index.tsx`
- `app/routes/_auth/feed/index.tsx`
- `app/routes/_auth/mortality/index.tsx`
- `app/routes/_auth/vaccinations/index.tsx`

**Map Callback Fixes (10 files):**
- `app/routes/_auth/sales/new.tsx`
- `app/routes/_auth/farms/$farmId/index.tsx`
- `app/routes/_auth/weight/new.tsx`
- `app/routes/_auth/customers/index.tsx`
- `app/routes/_auth/customers/$customerId.tsx`
- `app/routes/_auth/expenses/new.tsx`
- `app/routes/_auth/water-quality/new.tsx`
- `app/routes/_auth/feed/new.tsx`
- `app/routes/_auth/eggs/new.tsx`
- `app/routes/_auth/vaccinations/new.tsx`

**Icon Type Fix (1 file):**
- `app/hooks/useModuleNavigation.ts`

**Console.log Removal (2 files):**
- `app/routes/_auth/invoices/index.tsx` (line 229)
- `app/components/pwa-prompt.tsx` (lines 15, 18) - KEEP these, they're for PWA debugging

**PaginatedQuery Consolidation (10 files):**
- `app/features/weight/server.ts`
- `app/features/customers/server.ts`
- `app/features/suppliers/server.ts`
- `app/features/sales/server.ts`
- `app/features/invoices/server.ts`
- `app/features/expenses/server.ts`
- `app/features/water-quality/server.ts`
- `app/features/feed/server.ts`
- `app/features/mortality/server.ts`
- `app/features/eggs/server.ts`

### Patterns to Follow

**Catch Block Pattern (use `unknown`):**
```typescript
// BEFORE
} catch (e: any) {
  return { success: false, error: e.message || 'Failed' }
}

// AFTER
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : 'Failed'
  return { success: false, error: message }
}
```

**Search Param Pattern (use route's type):**
```typescript
// BEFORE
const updateSearch = (updates: Partial<FeedSearchParams>) => {
  navigate({
    search: (prev: any) => ({ ...prev, ...updates }),
  })
}

// AFTER
const updateSearch = (updates: Partial<FeedSearchParams>) => {
  navigate({
    search: (prev) => ({ ...prev, ...updates }),
  })
}
// Note: TanStack Router infers the type from Route.useSearch()
```

**Map Callback Pattern (use Batch interface):**
```typescript
// BEFORE
{batches.map((batch: any) => (

// AFTER  
{batches.map((batch) => (
// Note: TypeScript infers from useState<Array<Batch>>
```

**Icon Type Pattern:**
```typescript
import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
}
```

**PaginatedQuery Extension Pattern:**
```typescript
// BEFORE (in each feature)
export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
  category?: string  // feature-specific
}

// AFTER
import type { BasePaginatedQuery } from '~/lib/types'

interface ExpenseQuery extends BasePaginatedQuery {
  category?: string
  batchId?: string
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Quick Wins (Catch Blocks & Icon Type)

Fix the simplest `any` usages that have clear replacements.

### Phase 2: Route Search Params

Remove unnecessary `any` annotations - TypeScript can infer these.

### Phase 3: Map Callbacks

Remove `any` from map callbacks - TypeScript infers from state types.

### Phase 4: PaginatedQuery Consolidation

Extend `BasePaginatedQuery` in each feature server file.

### Phase 5: Console Cleanup

Remove debug console.log from production code.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/hooks/useModuleNavigation.ts`

- **IMPLEMENT**: Change `icon: any` to `icon: LucideIcon`
- **IMPORTS**: Add `import type { LucideIcon } from 'lucide-react'`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep useModuleNavigation`

### Task 2: UPDATE `app/features/auth/server.ts`

- **IMPLEMENT**: Change `catch (e: any)` to `catch (e: unknown)` with type guard
- **PATTERN**: Use `e instanceof Error ? e.message : 'Failed'`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep auth/server`

### Task 3: UPDATE `app/routes/_auth.tsx`

- **IMPLEMENT**: Change `catch (error: any)` to `catch (error: unknown)` with type guard
- **GOTCHA**: Must preserve redirect error pass-through logic
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep _auth.tsx`

### Task 4: UPDATE Search Param Routes (8 files)

For each file, remove `: any` from `search: (prev: any) =>`:

- `app/routes/_auth/weight/index.tsx` (line 198)
- `app/routes/_auth/settings/audit.tsx` (line 71)
- `app/routes/_auth/suppliers/index.tsx` (line 186)
- `app/routes/_auth/invoices/index.tsx` (line 148)
- `app/routes/_auth/water-quality/index.tsx` (line 204)
- `app/routes/_auth/feed/index.tsx` (line 282)
- `app/routes/_auth/mortality/index.tsx` (line 267)
- `app/routes/_auth/vaccinations/index.tsx` (line 222)

- **IMPLEMENT**: Change `(prev: any)` to `(prev)`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | head -20`

### Task 5: UPDATE Map Callback Routes (10 files)

For each file, remove `: any` from map callbacks:

- `app/routes/_auth/sales/new.tsx` - `(batch: any)`, `(customer: any)`
- `app/routes/_auth/farms/$farmId/index.tsx` - `(batch: any)`, `(sale: any)`
- `app/routes/_auth/weight/new.tsx` - `(batch: any)` x3
- `app/routes/_auth/customers/index.tsx` - `(customer: any)`
- `app/routes/_auth/customers/$customerId.tsx` - `(sale: any)`
- `app/routes/_auth/expenses/new.tsx` - `(supplier: any)` x2
- `app/routes/_auth/water-quality/new.tsx` - `(batch: any)` x2
- `app/routes/_auth/feed/new.tsx` - `(batch: any)`
- `app/routes/_auth/eggs/new.tsx` - `(batch: any)`
- `app/routes/_auth/vaccinations/new.tsx` - `(batch: any)`

- **IMPLEMENT**: Remove type annotation, let TypeScript infer
- **GOTCHA**: Ensure state is properly typed with `useState<Array<Batch>>`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | head -20`

### Task 6: UPDATE Feature Server Files - PaginatedQuery (10 files)

For each feature server file:

1. Import `BasePaginatedQuery` from `~/lib/types`
2. Rename local `PaginatedQuery` to feature-specific name (e.g., `ExpenseQuery`)
3. Extend `BasePaginatedQuery` with feature-specific fields only

Files and their specific fields:
- `app/features/weight/server.ts` - `batchId?: string`
- `app/features/customers/server.ts` - `customerType?: string`
- `app/features/suppliers/server.ts` - `supplierType?: string`
- `app/features/sales/server.ts` - `batchId?, customerId?, paymentStatus?, livestockType?`
- `app/features/invoices/server.ts` - `status?, customerId?`
- `app/features/expenses/server.ts` - `batchId?, category?`
- `app/features/water-quality/server.ts` - `batchId?`
- `app/features/feed/server.ts` - `batchId?, feedType?`
- `app/features/mortality/server.ts` - `batchId?, cause?`
- `app/features/eggs/server.ts` - `batchId?`

- **VALIDATE**: `npx tsc --noEmit 2>&1 | head -20`

### Task 7: REMOVE Console.log

- `app/routes/_auth/invoices/index.tsx` (line 229) - Remove debug log
- **KEEP**: `app/components/pwa-prompt.tsx` - PWA debugging logs are intentional

- **VALIDATE**: `grep -rn "console.log" app/routes --include="*.tsx"`

### Task 8: Final Validation

- **VALIDATE**: `npx tsc --noEmit && bun run lint && bun test`

---

## TESTING STRATEGY

### Unit Tests

No new tests needed - this is a refactor that should not change behavior.

### Validation Tests

Run full test suite to ensure no regressions:
```bash
bun test
```

---

## VALIDATION COMMANDS

### Level 1: Type Safety

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

### Level 4: Any Type Count

```bash
# Should be significantly reduced from 39
grep -r ": any" app --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts" | wc -l
```

### Level 5: Console.log Count

```bash
# Should only show PWA and DB script logs
grep -rn "console.log" app --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "lib/db"
```

---

## ACCEPTANCE CRITERIA

- [ ] All `catch (e: any)` replaced with `catch (e: unknown)` + type guard
- [ ] All `search: (prev: any)` simplified to `search: (prev)`
- [ ] All map callbacks have inferred types (no explicit `: any`)
- [ ] `NavigationItem.icon` uses `LucideIcon` type
- [ ] All feature `PaginatedQuery` interfaces extend `BasePaginatedQuery`
- [ ] Debug console.log removed from routes (except PWA)
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `bun run lint` passes with 0 errors
- [ ] `bun test` passes with 0 failures
- [ ] `any` type count reduced from 39 to <10

---

## COMPLETION CHECKLIST

- [ ] Task 1: Icon type fix
- [ ] Task 2: Auth server catch blocks
- [ ] Task 3: Auth route catch block
- [ ] Task 4: Search param routes (8 files)
- [ ] Task 5: Map callback routes (10 files)
- [ ] Task 6: PaginatedQuery consolidation (10 files)
- [ ] Task 7: Console.log cleanup
- [ ] Task 8: Final validation
- [ ] All validation commands pass
- [ ] Any count significantly reduced

---

## NOTES

### Design Decisions

1. **Keep `BasePaginatedQuery` in `~/lib/types.ts`** - Already exists, just need to use it
2. **Use `unknown` over `any` for catch blocks** - TypeScript best practice
3. **Remove type annotations from map callbacks** - Let TypeScript infer from state
4. **Keep PWA console.logs** - Needed for service worker debugging

### Estimated Time

- Tasks 1-3: 10 minutes
- Task 4: 15 minutes (8 files, simple change)
- Task 5: 20 minutes (10 files, verify state types)
- Task 6: 30 minutes (10 files, interface refactoring)
- Task 7: 5 minutes
- Task 8: 5 minutes

**Total: ~1.5 hours**

### Risk Assessment

**Low Risk** - All changes are type-level refactoring with no runtime behavior changes. Full test suite provides safety net.
