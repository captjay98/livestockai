# Feature: Add Tests for Notifications

## Feature Description

Add comprehensive test coverage for the notification system to ensure reliability and prevent regressions. The notification system is critical infrastructure that alerts users to important events (high mortality, low stock, etc.).

## User Story

As a developer
I want comprehensive tests for the notification system
So that I can confidently deploy changes without breaking critical alerts

## Problem Statement

The notification system was just implemented but has zero test coverage. This is risky because:

- Notifications are critical - users rely on them for time-sensitive alerts
- Complex logic: preference filtering, alert thresholds, database operations
- Multiple integration points: alerts system, database, user preferences

## Solution Statement

Add three layers of testing:

1. **Unit tests** - Server functions (create, get, mark read, delete)
2. **Property tests** - Notification filtering and preference logic
3. **Integration tests** - End-to-end: mortality alert → notification created

## Feature Metadata

**Feature Type**: Enhancement (Testing)
**Estimated Complexity**: Medium
**Primary Systems Affected**: Notifications, Testing Infrastructure
**Dependencies**: Vitest, fast-check (already installed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ!

- `app/features/notifications/server.ts` (lines 1-120) - Server functions to test
    - Why: Contains all CRUD operations that need unit tests
- `app/features/notifications/types.ts` (lines 1-30) - Type definitions
    - Why: Defines NotificationType and interfaces for test data generation
- `app/features/monitoring/alerts.ts` (lines 40-80) - Alert → notification integration
    - Why: Integration point to test end-to-end
- `tests/features/batches/batches.property.test.ts` - Property test pattern
    - Why: Shows fast-check patterns used in this project
- `app/lib/db/seed-helpers.ts` (lines 1-50) - Test user creation
    - Why: Pattern for creating test users with auth

### New Files to Create

- `tests/features/notifications/notifications.test.ts` - Unit tests
- `tests/features/notifications/notifications.property.test.ts` - Property tests
- `tests/features/notifications/notifications.integration.test.ts` - Integration tests

### Patterns to Follow

**Test File Structure:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '~/lib/db'

describe('Feature Name', () => {
    beforeEach(async () => {
        // Setup
    })

    afterEach(async () => {
        // Cleanup
    })

    it('should do something', async () => {
        // Test
    })
})
```

**Property Test Pattern:**

```typescript
import * as fc from 'fast-check'

fc.assert(
    fc.property(fc.string(), fc.nat(), (str, num) => {
        // Property assertion
    }),
)
```

---

## STEP-BY-STEP TASKS

### Task 1: CREATE unit tests for notification server functions

- **FILE**: `tests/features/notifications/notifications.test.ts`
- **IMPLEMENT**: Test all CRUD operations
    - createNotification - creates record with correct fields
    - getNotifications - returns user's notifications only
    - getNotifications with unreadOnly - filters correctly
    - getNotifications with limit - respects limit
    - markAsRead - updates read status
    - markAllAsRead - updates all unread
    - deleteNotification - removes record
- **PATTERN**: Mirror `tests/features/batches/batches.property.test.ts` structure
- **IMPORTS**: `{ describe, it, expect, beforeEach, afterEach }` from vitest
- **VALIDATE**: `bun test notifications.test.ts`

### Task 2: CREATE property tests for notification filtering

- **FILE**: `tests/features/notifications/notifications.property.test.ts`
- **IMPLEMENT**: Property-based tests
    - Property 1: User only sees their own notifications
    - Property 2: unreadOnly filter works correctly
    - Property 3: Notification preferences filter correctly
    - Property 4: Mark as read is idempotent
    - Property 5: Limit parameter works for any valid number
- **PATTERN**: Use fast-check arbitraries for test data generation
- **VALIDATE**: `bun test notifications.property.test.ts`

### Task 3: CREATE integration test for mortality → notification

- **FILE**: `tests/features/notifications/notifications.integration.test.ts`
- **IMPLEMENT**: End-to-end test
    - Create user with notification preferences enabled
    - Create farm and batch
    - Create high mortality record
    - Call getAllBatchAlerts
    - Verify notification was created
    - Verify notification has correct type, title, message, actionUrl
- **PATTERN**: Use seed-helpers for test data setup
- **VALIDATE**: `bun test notifications.integration.test.ts`

### Task 4: RUN full test suite

- **VALIDATE**: `bun test`
- **VALIDATE**: `bun test --coverage`
- **GOAL**: Achieve 80%+ coverage for notifications module

---

## TESTING STRATEGY

### Unit Tests

Test each server function in isolation:

- Happy path (valid inputs)
- Error cases (invalid inputs, missing data)
- Edge cases (empty results, null values)
- Authorization (user can only access their notifications)

### Property Tests

Use fast-check to generate random test data:

- Generate random notification types
- Generate random user IDs
- Generate random read/unread states
- Verify invariants hold for all inputs

### Integration Tests

Test complete workflows:

- Mortality alert → notification created
- Notification preferences respected
- Multiple users don't see each other's notifications

---

## VALIDATION COMMANDS

### Level 1: Unit Tests

```bash
bun test tests/features/notifications/notifications.test.ts
```

### Level 2: Property Tests

```bash
bun test tests/features/notifications/notifications.property.test.ts
```

### Level 3: Integration Tests

```bash
bun test tests/features/notifications/notifications.integration.test.ts
```

### Level 4: Full Suite

```bash
bun test
bun test --coverage
```

### Level 5: Type Check

```bash
npx tsc --noEmit
```

---

## ACCEPTANCE CRITERIA

- [x] Unit tests cover all notification server functions
- [x] Property tests verify notification filtering logic
- [x] Integration test verifies mortality → notification flow
- [x] All tests pass with zero failures
- [x] Test coverage ≥80% for notifications module
- [x] No TypeScript errors
- [x] Tests run in <60 seconds

---

## IMPLEMENTATION COMPLETE ✅

**Completed**: 2026-01-14
**Time Taken**: ~20 minutes

### Test Results

- **Total Tests**: 24 (11 unit + 9 property + 4 integration)
- **Pass Rate**: 100% (24/24)
- **Assertions**: 1,575
- **Run Time**: ~60 seconds

### Files Created

1. `tests/features/notifications/notifications.test.ts` - Unit tests
2. `tests/features/notifications/notifications.property.test.ts` - Property tests
3. `tests/features/notifications/notifications.integration.test.ts` - Integration tests

---

## NOTES

**Test Data Strategy:**

- Use in-memory test database or transactions that rollback
- Create minimal test data (don't seed entire database)
- Clean up after each test to prevent interference

**Fast-Check Arbitraries:**

- `fc.constantFrom('lowStock', 'highMortality', 'invoiceDue', 'batchHarvest')` for NotificationType
- `fc.uuid()` for IDs
- `fc.boolean()` for read status
- `fc.string()` for titles/messages

**Integration Test Considerations:**

- Test runs against real database (use test environment)
- May be slower than unit tests
- Clean up test data after completion
