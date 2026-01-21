# Feature: Service Layer Refactoring for Testability

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Refactor all server functions to use a **service layer pattern** that separates:
- **Service layer** (`service.ts`) - Pure business logic functions, easily unit testable
- **Repository layer** (`repository.ts`) - Database operations only, integration testable
- **Server functions** (`server.ts`) - Thin orchestration layer, minimal code

This enables comprehensive test coverage by making business logic testable without database dependencies.

## User Story

As a developer
I want business logic separated from database operations
So that I can achieve 80%+ test coverage with fast, reliable unit tests

## Problem Statement

Current server functions mix business logic with database operations, making them untestable without a real database connection. This results in:
- **3.91% line coverage** (current)
- Server functions show 0% coverage because they require HTTP context
- Integration tests are slow (~10s per test) due to Neon HTTP latency
- Business logic bugs can only be caught with slow integration tests

## Solution Statement

Extract pure business logic into `service.ts` files that:
- Take inputs and return outputs (no side effects)
- Can be tested with fast unit tests (~1ms per test)
- Use property-based testing for mathematical operations

Keep database operations in `repository.ts` files that:
- Handle only CRUD operations
- Are tested via integration tests
- Have minimal logic (just data access)

Server functions become thin orchestration:
- Call service functions for business logic
- Call repository functions for data access
- Handle auth and error wrapping

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: High (20+ server files, ~12,000 lines)
**Primary Systems Affected**: All `app/features/*/server.ts` files
**Dependencies**: None (internal refactoring)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

**Existing Service Pattern Examples (FOLLOW THESE):**
- `app/features/finance/calculations.ts` - Pure business logic, no DB
- `app/features/settings/currency.ts` - Pure utility functions
- `app/features/settings/currency-formatter.ts` - Pure formatting functions
- `app/features/modules/utils.ts` - Pure utility functions

**Server Files to Refactor (by size/priority):**
| File | Lines | Priority |
|------|-------|----------|
| `app/features/batches/server.ts` | 1085 | HIGH - Core feature |
| `app/features/sales/server.ts` | 968 | HIGH - Financial |
| `app/features/feed/server.ts` | 830 | HIGH - Core feature |
| `app/features/vaccinations/server.ts` | 815 | MEDIUM |
| `app/features/expenses/server.ts` | 796 | HIGH - Financial |
| `app/features/mortality/server.ts` | 759 | HIGH - Core feature |
| `app/features/farms/server.ts` | 733 | HIGH - Core feature |
| `app/features/eggs/server.ts` | 660 | MEDIUM |
| `app/features/weight/server.ts` | 641 | MEDIUM |
| `app/features/water-quality/server.ts` | 623 | MEDIUM |
| `app/features/reports/server.ts` | 576 | MEDIUM |
| `app/features/structures/server.ts` | 468 | LOW |
| `app/features/invoices/server.ts` | 468 | HIGH - Financial |
| `app/features/users/server.ts` | 445 | LOW |
| `app/features/dashboard/server.ts` | 434 | LOW |
| `app/features/customers/server.ts` | 432 | LOW |
| `app/features/suppliers/server.ts` | 376 | LOW |
| `app/features/settings/server.ts` | 272 | LOW |
| `app/features/modules/server.ts` | 265 | LOW |
| `app/features/onboarding/server.ts` | 258 | LOW |

**Test Pattern Examples:**
- `tests/features/finance/profit.property.test.ts` - Property tests for calculations
- `tests/features/settings/currency.test.ts` - Unit tests for utilities
- `tests/integration/batches.integration.test.ts` - Integration tests for DB

### New Files to Create (per feature)

For each feature in `app/features/{feature}/`:
- `service.ts` - Pure business logic functions
- `repository.ts` - Database operations only
- `tests/features/{feature}/{feature}.service.test.ts` - Service unit tests

### Patterns to Follow

**Service Layer Pattern (NEW):**

```typescript
// app/features/batches/service.ts - Pure business logic
import { multiply, toDbString } from '~/features/settings/currency'
import type { CreateBatchData } from './types'

/**
 * Calculate total cost for a batch
 * Pure function - no side effects, easily testable
 */
export function calculateBatchTotalCost(
  initialQuantity: number,
  costPerUnit: number
): string {
  return toDbString(multiply(initialQuantity, costPerUnit))
}

/**
 * Validate batch data before creation
 * Returns validation errors or null if valid
 */
export function validateBatchData(data: CreateBatchData): string | null {
  if (data.initialQuantity <= 0) {
    return 'Initial quantity must be greater than 0'
  }
  if (data.costPerUnit < 0) {
    return 'Cost per unit cannot be negative'
  }
  return null
}

/**
 * Determine batch status based on current quantity
 */
export function determineBatchStatus(
  currentQuantity: number
): 'active' | 'depleted' {
  return currentQuantity <= 0 ? 'depleted' : 'active'
}

/**
 * Calculate mortality rate for a batch
 */
export function calculateMortalityRate(
  initialQuantity: number,
  currentQuantity: number,
  totalMortality: number
): number {
  if (initialQuantity <= 0) return 0
  return (totalMortality / initialQuantity) * 100
}
```

**Repository Layer Pattern (NEW):**

```typescript
// app/features/batches/repository.ts - Database operations only
import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

export interface BatchInsert {
  farmId: string
  livestockType: string
  species: string
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: 'active' | 'depleted' | 'sold'
  batchName?: string | null
  // ... other fields
}

/**
 * Insert a new batch into the database
 */
export async function insertBatch(
  db: Kysely<Database>,
  data: BatchInsert
): Promise<string> {
  const result = await db
    .insertInto('batches')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get batch by ID with optional joins
 */
export async function getBatchById(
  db: Kysely<Database>,
  batchId: string
) {
  return db
    .selectFrom('batches')
    .selectAll()
    .where('id', '=', batchId)
    .executeTakeFirst()
}

/**
 * Update batch quantity and status
 */
export async function updateBatchQuantity(
  db: Kysely<Database>,
  batchId: string,
  newQuantity: number,
  status: 'active' | 'depleted' | 'sold'
): Promise<void> {
  await db
    .updateTable('batches')
    .set({ currentQuantity: newQuantity, status })
    .where('id', '=', batchId)
    .execute()
}
```

**Refactored Server Function Pattern:**

```typescript
// app/features/batches/server.ts - Thin orchestration
import { createServerFn } from '@tanstack/react-start'
import { AppError } from '~/lib/errors'
import { calculateBatchTotalCost, validateBatchData } from './service'
import { insertBatch, getBatchById } from './repository'
import type { CreateBatchData } from './types'

export const createBatchFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { batch: CreateBatchData }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    
    const { db } = await import('~/lib/db')
    const { checkFarmAccess } = await import('../auth/utils')

    // Auth check
    const hasAccess = await checkFarmAccess(session.user.id, data.batch.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: data.batch.farmId } })
    }

    // Business logic (testable via service.ts)
    const validationError = validateBatchData(data.batch)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', { metadata: { error: validationError } })
    }
    
    const totalCost = calculateBatchTotalCost(
      data.batch.initialQuantity,
      data.batch.costPerUnit
    )

    // Database operation (testable via repository.ts)
    const batchId = await insertBatch(db, {
      ...data.batch,
      totalCost,
      currentQuantity: data.batch.initialQuantity,
      status: 'active',
    })

    // Audit logging
    const { logAudit } = await import('../logging/audit')
    await logAudit({
      userId: session.user.id,
      action: 'create',
      entityType: 'batch',
      entityId: batchId,
      details: data.batch,
    })

    return batchId
  })
```

**Service Test Pattern:**

```typescript
// tests/features/batches/batches.service.test.ts
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateBatchTotalCost,
  validateBatchData,
  determineBatchStatus,
  calculateMortalityRate,
} from '~/features/batches/service'

describe('Batch Service', () => {
  describe('calculateBatchTotalCost', () => {
    it('should calculate total = quantity * costPerUnit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 100000 }),
          (quantity, costCents) => {
            const costPerUnit = costCents / 100
            const result = calculateBatchTotalCost(quantity, costPerUnit)
            const expected = (quantity * costPerUnit).toFixed(2)
            expect(result).toBe(expected)
          }
        )
      )
    })
  })

  describe('validateBatchData', () => {
    it('should reject zero quantity', () => {
      const result = validateBatchData({
        farmId: 'farm-1',
        livestockType: 'poultry',
        species: 'broiler',
        initialQuantity: 0,
        acquisitionDate: new Date(),
        costPerUnit: 10,
      })
      expect(result).not.toBeNull()
    })

    it('should accept valid data', () => {
      const result = validateBatchData({
        farmId: 'farm-1',
        livestockType: 'poultry',
        species: 'broiler',
        initialQuantity: 100,
        acquisitionDate: new Date(),
        costPerUnit: 10,
      })
      expect(result).toBeNull()
    })
  })

  describe('determineBatchStatus', () => {
    it('should return depleted when quantity is 0', () => {
      expect(determineBatchStatus(0)).toBe('depleted')
    })

    it('should return active when quantity > 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (qty) => {
          expect(determineBatchStatus(qty)).toBe('active')
        })
      )
    })
  })

  describe('calculateMortalityRate', () => {
    it('should calculate rate as percentage', () => {
      expect(calculateMortalityRate(100, 90, 10)).toBe(10)
      expect(calculateMortalityRate(100, 50, 50)).toBe(50)
    })

    it('should return 0 for zero initial quantity', () => {
      expect(calculateMortalityRate(0, 0, 0)).toBe(0)
    })
  })
})
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Service Layer Infrastructure

Create the service layer pattern for HIGH priority features first:
1. batches
2. sales
3. expenses
4. mortality
5. farms
6. feed
7. invoices

### Phase 2: Create Repository Layer

Extract database operations into repository files for each feature.

### Phase 3: Refactor Server Functions

Update server functions to use service and repository layers.

### Phase 4: Add Service Tests

Create comprehensive unit tests for all service functions.

### Phase 5: Medium/Low Priority Features

Apply the same pattern to remaining features.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/features/batches/service.ts`

Extract pure business logic from `app/features/batches/server.ts`:

- **IMPLEMENT**: 
  - `calculateBatchTotalCost(quantity, costPerUnit)` - Returns total cost string
  - `validateBatchData(data)` - Returns validation error or null
  - `determineBatchStatus(currentQuantity)` - Returns 'active' | 'depleted'
  - `calculateMortalityRate(initial, current, mortality)` - Returns percentage
  - `calculateFCR(feedKg, weightGainKg)` - Feed conversion ratio
  
- **PATTERN**: Follow `app/features/finance/calculations.ts`
- **IMPORTS**: `~/features/settings/currency` for decimal operations
- **GOTCHA**: Use `toDbString()` for database-ready decimal strings
- **VALIDATE**: `bun test tests/features/batches/batches.service.test.ts`

### Task 2: CREATE `app/features/batches/repository.ts`

Extract database operations:

- **IMPLEMENT**:
  - `insertBatch(db, data)` - Insert and return ID
  - `getBatchById(db, batchId)` - Get single batch
  - `getBatchesByFarm(db, farmId, filters)` - Get filtered batches
  - `updateBatch(db, batchId, data)` - Update batch fields
  - `updateBatchQuantity(db, batchId, quantity, status)` - Update quantity
  - `deleteBatch(db, batchId)` - Delete batch
  - `getBatchStats(db, batchId)` - Get aggregated stats

- **PATTERN**: Pass `Kysely<Database>` as first parameter
- **IMPORTS**: `~/lib/db/types` for Database type
- **GOTCHA**: Keep functions simple - just data access, no business logic
- **VALIDATE**: `bun test:integration tests/integration/batches.integration.test.ts`

### Task 3: UPDATE `app/features/batches/server.ts`

Refactor to use service and repository:

- **REFACTOR**: 
  - Import from `./service` and `./repository`
  - Replace inline calculations with service function calls
  - Replace inline DB queries with repository function calls
  - Keep only: auth checks, error handling, audit logging

- **PATTERN**: See "Refactored Server Function Pattern" above
- **GOTCHA**: Keep dynamic imports for `db` and auth modules
- **VALIDATE**: `bun test && bun test:integration`

### Task 4: CREATE `tests/features/batches/batches.service.test.ts`

Add comprehensive service tests:

- **IMPLEMENT**: Property tests for all service functions
- **PATTERN**: Follow `tests/features/finance/profit.property.test.ts`
- **COVERAGE TARGET**: 100% of service.ts
- **VALIDATE**: `bun test tests/features/batches/batches.service.test.ts --coverage`

### Task 5-8: Repeat for `sales` feature

- Task 5: CREATE `app/features/sales/service.ts`
  - `calculateSaleTotal(quantity, unitPrice)`
  - `validateSaleData(data)`
  - `calculateRevenueByPeriod(sales, startDate, endDate)`
  
- Task 6: CREATE `app/features/sales/repository.ts`
- Task 7: UPDATE `app/features/sales/server.ts`
- Task 8: CREATE `tests/features/sales/sales.service.test.ts`

### Task 9-12: Repeat for `expenses` feature

- Task 9: CREATE `app/features/expenses/service.ts`
  - `validateExpenseData(data)`
  - `categorizeExpenses(expenses)`
  - `calculateTotalByCategory(expenses)`
  
- Task 10: CREATE `app/features/expenses/repository.ts`
- Task 11: UPDATE `app/features/expenses/server.ts`
- Task 12: CREATE `tests/features/expenses/expenses.service.test.ts`

### Task 13-16: Repeat for `mortality` feature

- Task 13: CREATE `app/features/mortality/service.ts`
  - `validateMortalityData(data, batchQuantity)`
  - `calculateNewBatchQuantity(current, mortalityCount)`
  - `analyzeMortalityCauses(records)`
  
- Task 14: CREATE `app/features/mortality/repository.ts`
- Task 15: UPDATE `app/features/mortality/server.ts`
- Task 16: CREATE `tests/features/mortality/mortality.service.test.ts`

### Task 17-20: Repeat for `farms` feature

- Task 17: CREATE `app/features/farms/service.ts`
- Task 18: CREATE `app/features/farms/repository.ts`
- Task 19: UPDATE `app/features/farms/server.ts`
- Task 20: CREATE `tests/features/farms/farms.service.test.ts`

### Task 21-24: Repeat for `feed` feature

- Task 21: CREATE `app/features/feed/service.ts`
  - `calculateFeedCost(quantityKg, pricePerKg)`
  - `validateFeedRecord(data)`
  - `calculateDailyFeedRate(records)`
  
- Task 22: CREATE `app/features/feed/repository.ts`
- Task 23: UPDATE `app/features/feed/server.ts`
- Task 24: CREATE `tests/features/feed/feed.service.test.ts`

### Task 25-28: Repeat for `invoices` feature

- Task 25: CREATE `app/features/invoices/service.ts`
  - `calculateInvoiceTotal(items)`
  - `generateInvoiceNumber(prefix, sequence)`
  - `validateInvoiceData(data)`
  
- Task 26: CREATE `app/features/invoices/repository.ts`
- Task 27: UPDATE `app/features/invoices/server.ts`
- Task 28: CREATE `tests/features/invoices/invoices.service.test.ts`

### Task 29-44: Medium Priority Features

Apply same pattern to:
- vaccinations (Tasks 29-32)
- eggs (Tasks 33-36)
- weight (Tasks 37-40)
- water-quality (Tasks 41-44)

### Task 45-60: Low Priority Features

Apply same pattern to:
- structures (Tasks 45-48)
- users (Tasks 49-52)
- dashboard (Tasks 53-56)
- customers (Tasks 57-60)
- suppliers, settings, modules, onboarding (Tasks 61-76)

### Task 77: Final Validation

- **RUN**: `bun test:coverage`
- **VERIFY**: Line coverage > 60%, Branch coverage > 80%
- **RUN**: `bun test:integration`
- **VERIFY**: All 28+ integration tests pass

---

## TESTING STRATEGY

### Unit Tests (Service Layer)

**Location**: `tests/features/{feature}/{feature}.service.test.ts`
**Framework**: Vitest + fast-check
**Coverage Target**: 100% of service.ts files

Test patterns:
- Property tests for calculations (mathematical invariants)
- Edge case tests (zero, negative, boundary values)
- Validation tests (valid/invalid inputs)

### Integration Tests (Repository Layer)

**Location**: `tests/integration/{feature}.integration.test.ts`
**Framework**: Vitest with real test database
**Coverage**: Database constraints, cascades, relationships

Existing integration tests cover repository operations.

### Edge Cases to Test

- Zero quantities (batch, mortality, sales)
- Negative values (should be rejected)
- Currency precision (decimal handling)
- Date boundaries (fiscal year, reporting periods)
- Empty arrays (no records)
- Large numbers (overflow prevention)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit || exit 1
bun run lint || exit 1
```

### Level 2: Unit Tests

```bash
bun test --run || exit 1
```

### Level 3: Integration Tests

```bash
bun test:integration || exit 1
```

### Level 4: Coverage Check

```bash
bun test:coverage
# Verify: Statements > 60%, Branches > 80%
```

### Complete Validation

```bash
bun run check && bun test --run && bun test:integration && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All HIGH priority features have service.ts, repository.ts
- [ ] All service functions have unit tests with property-based testing
- [ ] Server functions are thin orchestration (< 50 lines each)
- [ ] All validation commands pass
- [ ] Test coverage: Statements > 60%, Branches > 80%
- [ ] No regressions (all existing tests pass)
- [ ] Integration tests still pass (28+ tests)
- [ ] Build succeeds for Cloudflare Workers

---

## COMPLETION CHECKLIST

- [ ] Phase 1: Service layer for 7 HIGH priority features
- [ ] Phase 2: Repository layer for 7 HIGH priority features
- [ ] Phase 3: Server functions refactored
- [ ] Phase 4: Service tests created (7 test files)
- [ ] Phase 5: Medium/Low priority features (optional, can be incremental)
- [ ] All validation commands pass
- [ ] Coverage targets met

---

## NOTES

### Why This Approach

1. **Incremental**: Can refactor one feature at a time
2. **Safe**: Existing tests catch regressions
3. **Testable**: Service functions are pure, fast to test
4. **Maintainable**: Clear separation of concerns

### Existing Good Patterns

These files already follow the service pattern:
- `app/features/finance/calculations.ts` - Pure profit/ROI calculations
- `app/features/settings/currency.ts` - Pure currency utilities
- `app/features/modules/utils.ts` - Pure module utilities

### Risk Mitigation

- Run full test suite after each feature refactor
- Keep server function signatures unchanged (no API breaking changes)
- Repository functions mirror existing query patterns

### Estimated Effort

- HIGH priority (7 features): ~4-6 hours
- MEDIUM priority (4 features): ~2-3 hours
- LOW priority (9 features): ~3-4 hours
- **Total**: ~10-13 hours

### Confidence Score

**8/10** - High confidence because:
- Clear patterns to follow
- Existing tests catch regressions
- Incremental approach reduces risk
- No external dependencies

Risk factors:
- Large scope (20+ files)
- Some complex server functions may need careful extraction
