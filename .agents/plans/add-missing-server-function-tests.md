# Feature: Add Missing Server Function Tests

The following plan addresses critical test coverage gaps identified in comprehensive test coverage analysis.

## Feature Description

OpenLivestock Manager has 1,256 passing tests but critical server functions lack test coverage. 7 features (customers, suppliers, invoices, notifications, dashboard, reports, tasks) have no server function tests, creating security and financial risks. This plan systematically adds 69 tests to close all critical gaps.

## User Story

As a QA engineer
I want comprehensive test coverage for all server functions
So that security vulnerabilities and financial calculation errors are caught before production

## Problem Statement

1. **Security Risk**: Farm access control not validated in tests (customers, invoices)
2. **Financial Risk**: Invoice and report calculations not tested
3. **Data Integrity Risk**: CRUD operations not validated
4. **Coverage Gap**: 7 features have 0 server function tests

## Solution Statement

Add 69 property-based and integration tests across 7 features to validate:

- Server function authentication and authorization
- Farm access control enforcement
- CRUD operations and error handling
- Financial calculations
- Data integrity

## Feature Metadata

**Feature Type**: Test Enhancement / Quality Improvement
**Estimated Complexity**: Medium
**Primary Systems Affected**:

- `app/features/customers/server.ts`
- `app/features/suppliers/server.ts`
- `app/features/invoices/server.ts`
- `app/features/notifications/server.ts`
- `app/features/dashboard/server.ts`
- `app/features/reports/server.ts`
- `app/features/tasks/server.ts`
  **Dependencies**: Vitest, fast-check, existing test patterns

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `tests/features/batches/server.test.ts` (lines 1-50) - Server function test pattern
- `tests/features/sales/sales.service.test.ts` (lines 1-100) - CRUD test pattern
- `tests/features/notifications/notifications.integration.test.ts` - Integration test pattern
- `tests/features/settings/currency.test.ts` - Financial calculation test pattern
- `app/features/customers/server.ts` - Server functions to test
- `app/features/invoices/server.ts` - Server functions to test
- `app/features/reports/server.ts` - Server functions to test
- `tests/helpers/db-integration.ts` - Test database helpers
- `app/lib/errors/app-error.ts` - AppError codes to test

### New Files to Create

- `tests/features/customers/server.test.ts` - 15 tests
- `tests/features/suppliers/server.test.ts` - 8 tests
- `tests/features/invoices/server.test.ts` - 12 tests
- `tests/features/notifications/server.test.ts` - 10 tests
- `tests/features/dashboard/server.test.ts` - 8 tests
- `tests/features/reports/server.test.ts` - 10 tests
- `tests/features/tasks/server.test.ts` - 6 tests

### Relevant Documentation - SHOULD READ BEFORE IMPLEMENTING

- [Vitest Documentation](https://vitest.dev/guide/)
  - Why: Test framework and patterns
- [fast-check Documentation](https://fast-check.dev/)
  - Why: Property-based testing for calculations
- OpenLivestock AGENTS.md - Better Auth and access control patterns
  - Why: Understand `checkFarmAccess()` usage in tests

### Patterns to Follow

**Server Function Test Pattern:**

```typescript
// tests/features/{feature}/server.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getTestDb,
  seedTestUser,
  seedTestFarm,
  truncateAllTables,
  closeTestDb,
} from '../../helpers/db-integration'
import {
  createCustomerFn,
  getCustomersFn,
  updateCustomerFn,
  deleteCustomerFn,
} from '~/features/customers/server'

describe('customers server functions', () => {
  let db: any
  let userId: string
  let farmId: string

  beforeEach(async () => {
    db = getTestDb()
    await truncateAllTables()
    const user = await seedTestUser({ email: 'test@example.com' })
    userId = user.userId
    const farm = await seedTestFarm(userId)
    farmId = farm.farmId
  })

  afterEach(async () => {
    await closeTestDb()
  })

  describe('createCustomerFn', () => {
    it('creates customer for authorized farm', async () => {
      const result = await createCustomerFn({
        data: {
          farmId,
          name: 'Test Customer',
          phone: '1234567890',
          email: 'customer@example.com',
          location: 'Test Location',
          customerType: 'individual',
        },
      })
      expect(result).toBeDefined()
      expect(result.farmId).toBe(farmId)
    })

    it('throws ACCESS_DENIED for unauthorized farm', async () => {
      const otherUser = await seedTestUser({ email: 'other@example.com' })
      const otherFarm = await seedTestFarm(otherUser.userId)

      await expect(
        createCustomerFn({
          data: {
            farmId: otherFarm.farmId,
            name: 'Test Customer',
            phone: '1234567890',
          },
        }),
      ).rejects.toThrow('ACCESS_DENIED')
    })

    it('validates required fields', async () => {
      await expect(
        createCustomerFn({
          data: {
            farmId,
            name: '', // Invalid: empty name
            phone: '1234567890',
          },
        }),
      ).rejects.toThrow('VALIDATION_ERROR')
    })
  })
})
```

**Property-Based Test Pattern:**

```typescript
// For financial calculations
import * as fc from 'fast-check'

describe('invoice calculations', () => {
  it('total always equals sum of line items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.nat({ min: 1 }),
            unitPrice: fc.nat({ min: 1 }),
          }),
          { minLength: 1 },
        ),
        (items) => {
          const total = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0,
          )
          expect(total).toBeGreaterThan(0)
        },
      ),
    )
  })
})
```

**Integration Test Pattern:**

```typescript
// Test server function with database
describe('getCustomersFn integration', () => {
  it('returns only customers from authorized farm', async () => {
    // Create customer in farm1
    await createCustomerFn({
      data: { farmId: farm1Id, name: 'Customer 1', phone: '123' },
    })

    // Create customer in farm2
    await createCustomerFn({
      data: { farmId: farm2Id, name: 'Customer 2', phone: '456' },
    })

    // Query farm1 - should only get Customer 1
    const result = await getCustomersFn({ data: { farmId: farm1Id } })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Customer 1')
  })
})
```

---

## IMPLEMENTATION PLAN

### Phase 1: Critical Tests (Customers, Invoices, Reports)

Add tests for security-critical and financial-critical features.

### Phase 2: High Priority Tests (Suppliers, Notifications, Dashboard)

Add tests for data integrity and user-facing features.

### Phase 3: Medium Priority Tests (Tasks)

Add tests for task management features.

### Phase 4: Validation & Coverage Report

Verify all tests pass and coverage targets met.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE customers/server.test.ts (15 tests)

**File**: `tests/features/customers/server.test.ts`

**IMPLEMENT**: 15 tests covering:

- createCustomerFn: 4 tests (success, access denied, validation, duplicate)
- getCustomersFn: 3 tests (success, access denied, empty list)
- updateCustomerFn: 4 tests (success, access denied, validation, not found)
- deleteCustomerFn: 2 tests (success, access denied)
- getCustomersPaginatedFn: 2 tests (pagination, filtering)

**PATTERN**: Mirror from `tests/features/sales/sales.service.test.ts`

**IMPORTS**:

- `describe, it, expect, beforeEach, afterEach` from vitest
- Test helpers from `../../helpers/db-integration`
- Server functions from `~/features/customers/server`

**GOTCHA**: Farm access control must be tested - use different users for different farms

**VALIDATE**: `bun run test tests/features/customers/server.test.ts`

---

### Task 2: CREATE invoices/server.test.ts (12 tests)

**File**: `tests/features/invoices/server.test.ts`

**IMPLEMENT**: 12 tests covering:

- createInvoiceFn: 4 tests (success, access denied, validation, financial calculation)
- getInvoiceByIdFn: 3 tests (success, access denied, not found)
- updateInvoiceStatusFn: 3 tests (success, access denied, invalid status)
- getInvoicesPaginatedFn: 2 tests (pagination, filtering)

**PATTERN**: Mirror from `tests/features/sales/sales.service.test.ts`

**IMPORTS**: Same as Task 1

**GOTCHA**: Test financial calculations - verify totals are correct

**VALIDATE**: `bun run test tests/features/invoices/server.test.ts`

---

### Task 3: CREATE reports/server.test.ts (10 tests)

**File**: `tests/features/reports/server.test.ts`

**IMPLEMENT**: 10 tests covering:

- getReportDataFn: 4 tests (success, access denied, date range, financial calculations)
- generateReportFn: 3 tests (success, access denied, format validation)
- getReportsPaginatedFn: 3 tests (pagination, filtering, sorting)

**PATTERN**: Mirror from `tests/features/sales/sales.service.test.ts`

**IMPORTS**: Same as Task 1

**GOTCHA**: Test financial calculations - P&L must be accurate

**VALIDATE**: `bun run test tests/features/reports/server.test.ts`

---

### Task 4: CREATE suppliers/server.test.ts (8 tests)

**File**: `tests/features/suppliers/server.test.ts`

**IMPLEMENT**: 8 tests covering:

- createSupplierFn: 2 tests (success, validation)
- getSuppliersFn: 2 tests (success, empty list)
- updateSupplierFn: 2 tests (success, not found)
- deleteSupplierFn: 2 tests (success, not found)

**PATTERN**: Mirror from `tests/features/sales/sales.service.test.ts`

**IMPORTS**: Same as Task 1

**GOTCHA**: Suppliers are global (no farm access control) - test authentication only

**VALIDATE**: `bun run test tests/features/suppliers/server.test.ts`

---

### Task 5: CREATE notifications/server.test.ts (10 tests)

**File**: `tests/features/notifications/server.test.ts`

**IMPLEMENT**: 10 tests covering:

- createNotificationFn: 3 tests (success, validation, duplicate prevention)
- getNotificationsFn: 2 tests (success, filtering)
- markAsReadFn: 2 tests (success, not found)
- deleteNotificationFn: 2 tests (success, not found)
- getUnreadCountFn: 1 test (success)

**PATTERN**: Mirror from `tests/features/notifications/notifications.integration.test.ts`

**IMPORTS**: Same as Task 1

**GOTCHA**: Test duplicate prevention - same notification shouldn't be created twice

**VALIDATE**: `bun run test tests/features/notifications/server.test.ts`

---

### Task 6: CREATE dashboard/server.test.ts (8 tests)

**File**: `tests/features/dashboard/server.test.ts`

**IMPLEMENT**: 8 tests covering:

- getDashboardDataFn: 4 tests (success, access denied, multi-farm aggregation, calculations)
- getDashboardStatsFn: 2 tests (success, empty data)
- getDashboardSummaryFn: 2 tests (success, filtering)

**PATTERN**: Mirror from `tests/features/sales/sales.service.test.ts`

**IMPORTS**: Same as Task 1

**GOTCHA**: Test multi-farm aggregation - dashboard should only show data from authorized farms

**VALIDATE**: `bun run test tests/features/dashboard/server.test.ts`

---

### Task 7: CREATE tasks/server.test.ts (6 tests)

**File**: `tests/features/tasks/server.test.ts`

**IMPLEMENT**: 6 tests covering:

- createTaskFn: 2 tests (success, validation)
- completeTaskFn: 2 tests (success, not found)
- getTasksFn: 2 tests (success, filtering by frequency)

**PATTERN**: Mirror from `tests/features/sales/sales.service.test.ts`

**IMPORTS**: Same as Task 1

**GOTCHA**: Test task completion tracking - verify completion records created

**VALIDATE**: `bun run test tests/features/tasks/server.test.ts`

---

### Task 8: ADD property-based tests for financial calculations

**File**: `tests/features/invoices/invoices.property.test.ts` (if not exists)

**IMPLEMENT**: 5 property tests for invoice calculations:

- Total always equals sum of line items
- Discount never exceeds total
- Tax calculation is consistent
- Status transitions are valid
- Amounts are always non-negative

**PATTERN**: Mirror from `tests/features/finance/profit.property.test.ts`

**IMPORTS**:

- `describe, it, expect` from vitest
- `* as fc` from fast-check

**GOTCHA**: Use realistic ranges for amounts (0-1000000)

**VALIDATE**: `bun run test tests/features/invoices/invoices.property.test.ts`

---

### Task 9: ADD property-based tests for report calculations

**File**: `tests/features/reports/reports.property.test.ts` (if not exists)

**IMPLEMENT**: 5 property tests for report calculations:

- Revenue always >= 0
- Expenses always >= 0
- Profit = Revenue - Expenses
- Percentages always 0-100
- Date ranges are valid

**PATTERN**: Mirror from `tests/features/finance/profit.property.test.ts`

**IMPORTS**: Same as Task 8

**GOTCHA**: Use realistic date ranges

**VALIDATE**: `bun run test tests/features/reports/reports.property.test.ts`

---

### Task 10: RUN full test suite and verify coverage

**VALIDATE**:

```bash
bun run test --run
bun run test --coverage
```

**EXPECTED RESULTS**:

- All 1,256+ tests passing
- New tests: 69 tests added
- Coverage improved for server functions
- No regressions

---

## TESTING STRATEGY

### Unit Tests

**Location**: `tests/features/{feature}/server.test.ts`
**Framework**: Vitest
**Coverage Target**: 80%+ for server functions

Test patterns:

- Happy path (success case)
- Error cases (access denied, validation, not found)
- Edge cases (empty data, duplicates, boundary values)

### Property-Based Tests

**Location**: `tests/features/{feature}/{feature}.property.test.ts`
**Framework**: Vitest + fast-check
**Coverage Target**: 90%+ for financial calculations

Test patterns:

- Mathematical invariants (totals, percentages)
- Constraint validation (non-negative, ranges)
- Consistency checks (calculations match formulas)

### Integration Tests

**Scope**: Server functions with database operations
**Pattern**: Use `seedTestUser`, `seedTestFarm`, `truncateAllTables` helpers

Test patterns:

- Multi-farm isolation (farm access control)
- CRUD operations with database
- Error handling with AppError codes

---

## VALIDATION COMMANDS

### Level 1: Individual Test Files

```bash
# Test customers
bun run test tests/features/customers/server.test.ts

# Test invoices
bun run test tests/features/invoices/server.test.ts

# Test reports
bun run test tests/features/reports/server.test.ts

# Test suppliers
bun run test tests/features/suppliers/server.test.ts

# Test notifications
bun run test tests/features/notifications/server.test.ts

# Test dashboard
bun run test tests/features/dashboard/server.test.ts

# Test tasks
bun run test tests/features/tasks/server.test.ts
```

### Level 2: All New Tests

```bash
# Run all new tests
bun run test tests/features/{customers,suppliers,invoices,notifications,dashboard,reports,tasks}/server.test.ts
```

### Level 3: Full Test Suite

```bash
# Run all tests
bun run test --run

# Run with coverage
bun run test --coverage
```

### Level 4: Type & Lint Check

```bash
# Type checking
npx tsc --noEmit

# Linting
bun run lint
```

### Complete Validation

```bash
# Run all checks
bun run check && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All 69 new tests created and passing
- [ ] Server function tests cover: CRUD, auth, access control, error handling
- [ ] Property tests cover: financial calculations, constraints, consistency
- [ ] Integration tests verify: multi-farm isolation, database operations
- [ ] All validation commands pass: `bun run check && bun run test --run && bun run build`
- [ ] Test coverage improved for server functions (target 80%+)
- [ ] No regressions in existing tests (all 1,256+ tests pass)
- [ ] Code follows OpenLivestock test patterns
- [ ] Farm access control validated in tests
- [ ] Financial calculations validated in tests
- [ ] Error handling (AppError codes) validated in tests

---

## COMPLETION CHECKLIST

- [ ] Task 1: customers/server.test.ts (15 tests) ✅
- [ ] Task 2: invoices/server.test.ts (12 tests) ✅
- [ ] Task 3: reports/server.test.ts (10 tests) ✅
- [ ] Task 4: suppliers/server.test.ts (8 tests) ✅
- [ ] Task 5: notifications/server.test.ts (10 tests) ✅
- [ ] Task 6: dashboard/server.test.ts (8 tests) ✅
- [ ] Task 7: tasks/server.test.ts (6 tests) ✅
- [ ] Task 8: invoices property tests (5 tests) ✅
- [ ] Task 9: reports property tests (5 tests) ✅
- [ ] Task 10: Full validation suite passes ✅

---

## NOTES

**Priority Order**: Implement in phases to catch critical issues early

- Phase 1 (Critical): Customers, Invoices, Reports (37 tests)
- Phase 2 (High): Suppliers, Notifications, Dashboard (26 tests)
- Phase 3 (Medium): Tasks (6 tests)

**Test Database**: Use `seedTestUser`, `seedTestFarm`, `truncateAllTables` helpers from `tests/helpers/db-integration.ts`

**Farm Access Control**: Critical to test - create different users and farms to verify access is properly enforced

**Financial Calculations**: Use property-based tests to verify mathematical invariants

**Error Handling**: Test all AppError codes (ACCESS_DENIED, VALIDATION_ERROR, NOT_FOUND, DATABASE_ERROR)

**Estimated Effort**: 8-10 hours total

- Phase 1: 4-5 hours
- Phase 2: 3-4 hours
- Phase 3: 1 hour
