# Commit Plan: Day 13 Implementation

## Overview
5 plans executed: Dashboard polish, notification tests, property tests, performance optimization, and notification types expansion.

## Commits (7 total)

### Commit 1: Dashboard - Add mortality and feed cards
**Files**: 2
- app/features/dashboard/server.ts
- app/routes/_auth/dashboard/index.tsx

**Message**:
```
feat(dashboard): add mortality and feed summary cards

- Add mortality data to DashboardStats (total deaths, rate)
- Add feed data to DashboardStats (total cost, kg, FCR)
- Add mortality card with AlertTriangle icon
- Add feed card with Wheat icon
- Update empty state condition to include new cards
- Both cards respect user dashboardCards preferences
```

### Commit 2: Tests - Add notification test suite
**Files**: 3
- tests/features/notifications/notifications.test.ts
- tests/features/notifications/notifications.property.test.ts
- tests/features/notifications/notifications.integration.test.ts

**Message**:
```
test(notifications): add comprehensive test coverage

- Add 11 unit tests for CRUD operations
- Add 9 property tests for filtering logic
- Add 4 integration tests for mortality → notification flow
- Total: 24 tests, 1,575 assertions, 100% pass rate
- Verify user isolation and preference handling
```

### Commit 3: Tests - Add property tests for business logic
**Files**: 3
- tests/features/batches/fcr.property.test.ts
- tests/features/monitoring/mortality.property.test.ts
- tests/features/finance/profit.property.test.ts

**Message**:
```
test(business-logic): add property-based tests

- Add 8 FCR calculation property tests
- Add 8 mortality rate property tests
- Add 8 profit/loss property tests
- Total: 24 tests, 3,098 assertions, 100% pass rate
- Verify mathematical correctness under all inputs
```

### Commit 4: Performance - Add database indexes
**Files**: 1
- app/lib/db/migrations/2026-01-14-001-add-performance-indexes.ts

**Message**:
```
perf(database): add indexes for common query patterns

Add 8 composite indexes:
- batches(farmId, status)
- sales(farmId, date)
- expenses(farmId, date)
- feed_records(batchId, date)
- mortality_records(batchId, date)
- notifications(userId, read)
- weight_samples(batchId, date)
- egg_records(batchId, date)

Improves query performance for dashboard and list views
```

### Commit 5: Notifications - Add scheduler functions
**Files**: 2
- app/features/notifications/schedulers.ts
- app/features/notifications/index.ts

**Message**:
```
feat(notifications): add low stock, invoice due, and harvest schedulers

- Add checkLowStockNotifications (feed + medication)
- Add checkInvoiceDueNotifications (7 days before due)
- Add checkBatchHarvestNotifications (7 days before harvest)
- All respect user notification preferences
- Duplicate prevention via metadata checks
- Return notification count for monitoring
```

### Commit 6: Dependencies - Add bundle analyzer
**Files**: 2
- package.json
- bun.lockb

**Message**:
```
chore(deps): add rollup-plugin-visualizer for bundle analysis

Enables bundle size monitoring and optimization
```

### Commit 7: Documentation - Update DEVLOG
**Files**: 1
- DEVLOG.md

**Message**:
```
docs: update DEVLOG with Day 13 progress

- Dashboard polish (mortality + feed cards)
- Notification tests (24 tests)
- Property tests (24 tests)
- Performance optimization (8 indexes)
- Notification types expansion (3 new types)
```

## Execution Order

Execute commits in order 1-7. Each commit is atomic and can be deployed independently.

## Validation Before Commit

```bash
# Run before committing
npx tsc --noEmit
bun run lint
bun test
```

All should pass with 0 errors.
