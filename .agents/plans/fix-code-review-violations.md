# Feature: Fix Code Review Violations

The following plan addresses 3 high-priority security and validation issues identified in comprehensive code review.

## Feature Description

OpenLivestock Manager code review identified critical gaps in input validation and farm access control that could allow security vulnerabilities. This plan systematically fixes all violations to ensure data isolation between farms and proper input validation across all server functions.

## Problem Statement

1. **Missing Input Validation**: 13 server functions use type assertions instead of Zod schemas, allowing unvalidated data to reach database operations
2. **Missing Farm Access Control**: 3 features (customers, suppliers, invoices) lack farm-level access checks, allowing cross-farm data access
3. **N+1 Query Pattern**: Notification schedulers use loops with individual database queries instead of batch operations

## Solution Statement

1. Replace all type assertions with proper Zod validation schemas
2. Add `checkFarmAccess()` validation to all farm-scoped operations
3. Refactor notification schedulers to use batch queries

## Feature Metadata

**Feature Type**: Bug Fix / Security Hardening
**Estimated Complexity**: Medium
**Primary Systems Affected**:

- `app/features/batches/server.ts`
- `app/features/customers/server.ts`
- `app/features/suppliers/server.ts`
- `app/features/invoices/server.ts`
- `app/features/notifications/schedulers.ts`
  **Dependencies**: Zod, Kysely, existing AppError system

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/features/batches/server.ts` (lines 178, 374, 420, 680, 690, 700, 710) - Validation pattern violations
- `app/features/customers/server.ts` (all functions) - Missing farm access control
- `app/features/suppliers/server.ts` (all functions) - Missing farm access control
- `app/features/invoices/server.ts` (all functions) - Missing farm access control
- `app/features/notifications/schedulers.ts` (lines 110-113, 159-160) - N+1 query pattern
- `app/features/auth/utils.ts` - Contains `checkFarmAccess()` function to use
- `app/lib/errors/app-error.ts` - AppError codes and patterns
- `app/features/sales/server.ts` - Reference implementation with proper validation and access control
- `app/features/expenses/server.ts` - Reference implementation with proper validation and access control

### New Files to Create

None - all fixes are in existing files

### Relevant Documentation - SHOULD READ BEFORE IMPLEMENTING

- [Zod Documentation - Object Validation](https://zod.dev/?id=objects)
  - Why: Need to create proper validation schemas
- [TanStack Start - Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
  - Why: Understand `.inputValidator()` pattern
- OpenLivestock AGENTS.md - Better Auth and access control patterns
  - Why: Understand `checkFarmAccess()` usage

### Patterns to Follow

**Proper Zod Validation Pattern:**

```typescript
// ✅ CORRECT - Zod schema validation
export const createBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      batch: z.object({
        farmId: z.string().uuid(),
        batchName: z.string().min(1).max(100),
        species: z.string(),
        initialQuantity: z.number().int().positive(),
        acquisitionDate: z.coerce.date(),
        costPerUnit: z.number().nonnegative(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    // data is now validated
  })

  // ❌ WRONG - Type assertion (current violation)
  .inputValidator((data: { batch: CreateBatchData }) => data)
```

**Proper Farm Access Control Pattern:**

```typescript
// ✅ CORRECT - Check farm access
export const getCustomers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { checkFarmAccess } = await import('../auth/utils')
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: data.farmId },
      })
    }

    const { db } = await import('~/lib/db')
    return db
      .selectFrom('customers')
      .where('farmId', '=', data.farmId)
      .execute()
  })
```

**Batch Query Pattern (Fix N+1):**

```typescript
// ❌ WRONG - N+1 pattern (current)
for (const item of lowFeedItems) {
  const existing = await db.selectFrom('notifications')...
}

// ✅ CORRECT - Batch query
const existingNotifications = await db
  .selectFrom('notifications')
  .where('farmId', 'in', farmIds)
  .where('type', '=', 'lowStock')
  .execute()

const existingMap = new Map(
  existingNotifications.map(n => [`${n.farmId}-${n.metadata?.itemId}`, n])
)

for (const item of lowFeedItems) {
  const key = `${item.farmId}-${item.id}`
  if (!existingMap.has(key)) {
    // Create notification
  }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Fix Input Validation (13 functions)

Add Zod schemas to all server functions missing proper validation.

### Phase 2: Add Farm Access Control (3 features)

Add `checkFarmAccess()` checks to customers, suppliers, invoices.

### Phase 3: Fix N+1 Queries (2 instances)

Refactor notification schedulers to use batch queries.

### Phase 4: Testing & Validation

Verify all fixes with tests and validation commands.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE validation schemas for batches

**File**: `app/features/batches/server.ts`

**IMPLEMENT**: Add Zod schemas at top of file (after imports, before server functions)

```typescript
const createBatchSchema = z.object({
  farmId: z.string().uuid(),
  livestockType: z.enum([
    'poultry',
    'fish',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]),
  species: z.string().min(1).max(100),
  initialQuantity: z.number().int().positive(),
  acquisitionDate: z.coerce.date(),
  costPerUnit: z.number().nonnegative(),
  batchName: z.string().max(100).nullable().optional(),
  sourceSize: z.string().max(50).nullable().optional(),
  structureId: z.string().uuid().nullable().optional(),
  targetHarvestDate: z.coerce.date().nullable().optional(),
  target_weight_g: z.number().positive().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

const updateBatchSchema = z.object({
  species: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'depleted', 'sold']).optional(),
  batchName: z.string().max(100).nullable().optional(),
  sourceSize: z.string().max(50).nullable().optional(),
  structureId: z.string().uuid().nullable().optional(),
  targetHarvestDate: z.coerce.date().nullable().optional(),
  target_weight_g: z.number().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

const paginatedQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  farmId: z.string().uuid().optional(),
  status: z.enum(['active', 'depleted', 'sold']).optional(),
  livestockType: z
    .enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'])
    .optional(),
})
```

**PATTERN**: Mirror from `app/features/sales/server.ts` (lines 1-50)

**VALIDATE**: `npx tsc --noEmit app/features/batches/server.ts`

---

### Task 2: UPDATE createBatchFn validation

**File**: `app/features/batches/server.ts`
**Line**: 178

**REPLACE**:

```typescript
.inputValidator((data: { batch: CreateBatchData }) => data)
```

**WITH**:

```typescript
.inputValidator(z.object({ batch: createBatchSchema }))
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 3: UPDATE updateBatchFn validation

**File**: `app/features/batches/server.ts`
**Line**: 374

**REPLACE**:

```typescript
.inputValidator((data: { batchId: string; batch: UpdateBatchData }) => data)
```

**WITH**:

```typescript
.inputValidator(
  z.object({
    batchId: z.string().uuid(),
    batch: updateBatchSchema,
  })
)
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 4: UPDATE deleteBatchFn validation

**File**: `app/features/batches/server.ts`
**Line**: 420

**REPLACE**:

```typescript
.inputValidator((data: { batchId: string }) => data)
```

**WITH**:

```typescript
.inputValidator(z.object({ batchId: z.string().uuid() }))
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 5: UPDATE getBatchesPaginatedFn validation

**File**: `app/features/batches/server.ts`
**Line**: 680

**REPLACE**:

```typescript
.inputValidator((data: PaginatedQuery) => data)
```

**WITH**:

```typescript
.inputValidator(paginatedQuerySchema)
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 6: UPDATE getBatchDetailsFn validation

**File**: `app/features/batches/server.ts`
**Line**: 690

**REPLACE**:

```typescript
.inputValidator((data: { batchId: string }) => data)
```

**WITH**:

```typescript
.inputValidator(z.object({ batchId: z.string().uuid() }))
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 7: UPDATE getBatchesFn validation

**File**: `app/features/batches/server.ts`
**Line**: 700

**REPLACE**:

```typescript
.inputValidator((data: { farmId?: string }) => data)
```

**WITH**:

```typescript
.inputValidator(z.object({ farmId: z.string().uuid().optional() }))
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 8: UPDATE getBatchesForFarmFn validation

**File**: `app/features/batches/server.ts`
**Line**: 710

**REPLACE**:

```typescript
.inputValidator((data: GetBatchesForFarmInput) => data)
```

**WITH**:

```typescript
.inputValidator(
  z.object({
    farmId: z.string().uuid().optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    livestockType: z.string().optional(),
  })
)
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 9: ADD farm access control to customers

**File**: `app/features/customers/server.ts`

**IMPLEMENT**: Add to ALL server functions that take `farmId` parameter

**Pattern**: Add after `requireAuth()` call:

```typescript
const { checkFarmAccess } = await import('../auth/utils')
const hasAccess = await checkFarmAccess(session.user.id, data.farmId)
if (!hasAccess) {
  throw new AppError('ACCESS_DENIED', { metadata: { farmId: data.farmId } })
}
```

**Functions to update**:

- `createCustomerFn` (line 35)
- `getCustomersFn` (line 56)
- `updateCustomerFn` (line 85)
- `deleteCustomerFn` (line 105)
- `getCustomersPaginatedFn` (line 157)
- `getTopCustomersFn` (line 189)

**VALIDATE**: `npx tsc --noEmit`

---

### Task 10: ADD farm access control to suppliers

**File**: `app/features/suppliers/server.ts`

**IMPLEMENT**: Add farm access check to all functions

**Pattern**: Same as Task 9

**Functions to update**: All server functions that operate on suppliers

**VALIDATE**: `npx tsc --noEmit`

---

### Task 11: ADD farm access control to invoices

**File**: `app/features/invoices/server.ts`

**IMPLEMENT**: Add farm access check to all functions

**Pattern**: Same as Task 9

**Functions to update**: All server functions that operate on invoices

**VALIDATE**: `npx tsc --noEmit`

---

### Task 12: FIX N+1 query in low stock notifications

**File**: `app/features/notifications/schedulers.ts`
**Lines**: 110-113

**REPLACE**:

```typescript
for (const item of lowFeedItems) {
  // Check if notification already exists (avoid duplicates)
  const existing = await db
    .selectFrom('notifications')
    .where('userId', '=', userId)
    .where('type', '=', 'lowStock')
    .where('metadata', '->>', 'itemId', '=', item.id)
    .executeTakeFirst()
```

**WITH**:

```typescript
// Batch query for all existing notifications
const existingNotifications = await db
  .selectFrom('notifications')
  .where('userId', '=', userId)
  .where('type', '=', 'lowStock')
  .execute()

const existingMap = new Map(
  existingNotifications.map(n => [n.metadata?.itemId, n])
)

for (const item of lowFeedItems) {
  const existing = existingMap.get(item.id)
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 13: FIX N+1 query in medication expiry notifications

**File**: `app/features/notifications/schedulers.ts`
**Lines**: 159-160

**REPLACE**:

```typescript
for (const item of lowMedItems) {
  const existing = await db
    .selectFrom('notifications')
    .where('userId', '=', userId)
    .where('type', '=', 'medicationExpiry')
    .where('metadata', '->>', 'itemId', '=', item.id)
    .executeTakeFirst()
```

**WITH**:

```typescript
// Batch query for all existing notifications
const existingMedNotifications = await db
  .selectFrom('notifications')
  .where('userId', '=', userId)
  .where('type', '=', 'medicationExpiry')
  .execute()

const existingMedMap = new Map(
  existingMedNotifications.map(n => [n.metadata?.itemId, n])
)

for (const item of lowMedItems) {
  const existing = existingMedMap.get(item.id)
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 14: ADD validation schemas to customers

**File**: `app/features/customers/server.ts`

**IMPLEMENT**: Add Zod schemas at top of file

```typescript
const createCustomerSchema = z.object({
  farmId: z.string().uuid(),
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  customerType: z
    .enum([
      'individual',
      'restaurant',
      'retailer',
      'wholesaler',
      'processor',
      'exporter',
      'government',
    ])
    .optional()
    .nullable(),
})

const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  email: z.string().email().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  customerType: z
    .enum([
      'individual',
      'restaurant',
      'retailer',
      'wholesaler',
      'processor',
      'exporter',
      'government',
    ])
    .optional()
    .nullable(),
})
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 15: UPDATE customers server function validators

**File**: `app/features/customers/server.ts`

**IMPLEMENT**: Replace all `.inputValidator()` calls with Zod schemas

**Pattern**:

```typescript
.inputValidator(z.object({ farmId: z.string().uuid(), customer: createCustomerSchema }))
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 16: ADD validation schemas to suppliers

**File**: `app/features/suppliers/server.ts`

**IMPLEMENT**: Add Zod schemas (similar to customers)

**VALIDATE**: `npx tsc --noEmit`

---

### Task 17: UPDATE suppliers server function validators

**File**: `app/features/suppliers/server.ts`

**IMPLEMENT**: Replace all `.inputValidator()` calls with Zod schemas

**VALIDATE**: `npx tsc --noEmit`

---

### Task 18: ADD validation schemas to invoices

**File**: `app/features/invoices/server.ts`

**IMPLEMENT**: Add Zod schemas for invoice operations

**VALIDATE**: `npx tsc --noEmit`

---

### Task 19: UPDATE invoices server function validators

**File**: `app/features/invoices/server.ts`

**IMPLEMENT**: Replace all `.inputValidator()` calls with Zod schemas

**VALIDATE**: `npx tsc --noEmit`

---

### Task 20: RUN full validation suite

**VALIDATE**:

```bash
bun run check && bun run test --run && bun run build
```

---

## TESTING STRATEGY

### Unit Tests

**Location**: `tests/features/{feature}/`

Add tests for:

- Zod validation schemas (valid/invalid inputs)
- Farm access control (allowed/denied access)
- Error handling (AppError codes)

**Pattern**: See `tests/features/sales/sales.test.ts`

### Integration Tests

Test end-to-end:

- Server function with validation
- Farm access check
- Database operation

**Pattern**: See `tests/features/notifications/notifications.integration.test.ts`

### Validation Commands

```bash
# Type checking
npx tsc --noEmit

# Linting
bun run lint

# All tests
bun run test --run

# Build
bun run build

# Complete validation
bun run check && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All 13 server functions have proper Zod validation
- [ ] All farm-scoped operations check `checkFarmAccess()`
- [ ] N+1 queries replaced with batch queries
- [ ] `bun run check` passes (0 TypeScript errors, 0 ESLint errors)
- [ ] `bun run test --run` passes (all 1256+ tests)
- [ ] `bun run build` succeeds
- [ ] No functionality regression
- [ ] Security vulnerabilities fixed

---

## COMPLETION CHECKLIST

- [ ] Task 1-8: Batches validation schemas added
- [ ] Task 9-11: Farm access control added to customers, suppliers, invoices
- [ ] Task 12-13: N+1 queries fixed in notifications
- [ ] Task 14-19: Validation schemas added to customers, suppliers, invoices
- [ ] Task 20: Full validation suite passes
- [ ] All acceptance criteria met

---

## NOTES

**Security Impact**: These fixes prevent:

- Unvalidated data reaching database (injection attacks)
- Cross-farm data access (data isolation breach)
- Performance degradation from N+1 queries

**Backward Compatibility**: All changes are internal - no API changes, no breaking changes to existing functionality.

**Testing**: Existing test suite (1256+ tests) should continue to pass. New tests recommended for validation schemas and access control.
