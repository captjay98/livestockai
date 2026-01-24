# Feature: Optimize Dashboard Database Queries

## Feature Description

Consolidate 15 sequential database queries in `getDashboardStats()` into parallel execution using `Promise.all()`. This eliminates the "waterfall" effect where network latency compounds on serverless infrastructure (Cloudflare Workers + Neon DB).

## User Story

As a farmer
I want the dashboard to load quickly
So that I can see my farm status without waiting

## Problem Statement

The `getDashboardStats` function in `app/features/dashboard/server.ts` performs **15 sequential database queries**:

1. `getUserFarms()` - Get user's farm IDs
2. `inventoryByType` - Batch counts by livestock type
3. `activeBatchesResult` - Active batch count
4. `salesResult` - Current month revenue
5. `prevMonthSalesResult` - Previous month revenue
6. `expensesResult` - Current month expenses
7. `prevMonthExpensesResult` - Previous month expenses
8. `eggsQuery` - Egg production this month
9. `layerBirdsQuery` - Layer bird count
10. `mortalityQuery` - Deaths this month
11. `initialQuantityQuery` - Initial batch quantities
12. `feedQuery` - Feed costs and quantity
13. `totalWeightQuery` - Total livestock quantity
14. `topCustomers` - Top 5 customers by spend
15. `recentSales` + `recentExpenses` - Recent transactions

**Impact**: On Cloudflare Workers + Neon DB, each query adds ~50-100ms latency. Sequential execution = 750ms-1.5s total latency.

## Solution Statement

Group independent queries into parallel batches using `Promise.all()`:

**Batch 1** (after getting farmIds):

- inventoryByType, activeBatchesResult, salesResult, prevMonthSalesResult, expensesResult, prevMonthExpensesResult

**Batch 2** (independent):

- eggsQuery, layerBirdsQuery, mortalityQuery, initialQuantityQuery, feedQuery, totalWeightQuery

**Batch 3** (independent):

- topCustomers, recentSales, recentExpenses

**Expected improvement**: 15 sequential → 3 parallel batches = ~70% latency reduction (1.5s → 450ms)

## Feature Metadata

**Feature Type**: Enhancement (Performance)
**Estimated Complexity**: Medium
**Primary Systems Affected**: Dashboard server function
**Dependencies**: None

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/features/dashboard/server.ts` (lines 1-430) - **TARGET**: The entire getDashboardStats function
- `app/features/batches/server.ts` - **PATTERN**: Example of Promise.all usage in getInventorySummary

### Patterns to Follow

**Promise.all Pattern for Independent Queries:**

```typescript
// Group independent queries
const [
  inventoryByType,
  activeBatchesResult,
  salesResult,
  prevMonthSalesResult,
  expensesResult,
  prevMonthExpensesResult,
] = await Promise.all([
  db.selectFrom('batches')...execute(),
  db.selectFrom('batches')...executeTakeFirst(),
  db.selectFrom('sales')...executeTakeFirst(),
  db.selectFrom('sales')...executeTakeFirst(),
  db.selectFrom('expenses')...executeTakeFirst(),
  db.selectFrom('expenses')...executeTakeFirst(),
])
```

**Keep Sequential When Dependent:**

```typescript
// This must stay sequential - needs farmIds first
const targetFarmIds = await getUserFarms(userId)
if (targetFarmIds.length === 0) return emptyStats

// Now parallel queries can use targetFarmIds
const [...] = await Promise.all([...])
```

---

## IMPLEMENTATION PLAN

### Phase 1: Identify Query Dependencies

Map which queries depend on which data:

- All queries depend on `targetFarmIds` (must be fetched first)
- All queries are independent of each other (can run in parallel)

### Phase 2: Group into Promise.all Batches

Restructure into 3 parallel batches for readability.

### Phase 3: Preserve Return Types

Ensure TypeScript types are preserved with proper destructuring.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/features/dashboard/server.ts` - Restructure to Parallel Queries

**IMPLEMENT**: Replace sequential queries with Promise.all batches

**Current Structure** (lines 120-340):

```typescript
// Sequential - BAD
const inventoryByType = await db...execute()
const activeBatchesResult = await db...executeTakeFirst()
const salesResult = await db...executeTakeFirst()
// ... 12 more sequential queries
```

**New Structure**:

```typescript
// Parallel Batch 1: Core metrics
const [
  inventoryByType,
  activeBatchesResult,
  salesResult,
  prevMonthSalesResult,
  expensesResult,
  prevMonthExpensesResult,
] = await Promise.all([
  // Inventory by type
  db
    .selectFrom('batches')
    .select([
      'livestockType',
      sql<number>`SUM(CAST("currentQuantity" AS INTEGER))`.as('total'),
    ])
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .groupBy('livestockType')
    .execute(),

  // Active batches count
  db
    .selectFrom('batches')
    .select(sql<number>`COUNT(*)`.as('count'))
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Current month revenue
  db
    .selectFrom('sales')
    .select(
      sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as('total'),
    )
    .where('date', '>=', startOfMonth)
    .where('date', '<=', endOfMonth)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Previous month revenue
  db
    .selectFrom('sales')
    .select(
      sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as('total'),
    )
    .where('date', '>=', prevMonthStart)
    .where('date', '<=', prevMonthEnd)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Current month expenses
  db
    .selectFrom('expenses')
    .select(sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as('total'))
    .where('date', '>=', startOfMonth)
    .where('date', '<=', endOfMonth)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Previous month expenses
  db
    .selectFrom('expenses')
    .select(sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as('total'))
    .where('date', '>=', prevMonthStart)
    .where('date', '<=', prevMonthEnd)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),
])

// Parallel Batch 2: Production & health metrics
const [
  eggsQuery,
  layerBirdsQuery,
  mortalityQuery,
  initialQuantityQuery,
  feedQuery,
  totalWeightQuery,
] = await Promise.all([
  // Eggs this month
  db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      sql<number>`COALESCE(SUM("quantityCollected"), 0)`.as('totalEggs'),
    ])
    .where('egg_records.date', '>=', startOfMonth)
    .where('egg_records.date', '<=', endOfMonth)
    .where('batches.farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Layer birds count
  db
    .selectFrom('batches')
    .select(sql<number>`COALESCE(SUM("currentQuantity"), 0)`.as('total'))
    .where('species', 'ilike', '%layer%')
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Mortality this month
  db
    .selectFrom('mortality_records')
    .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
    .select([sql<number>`COALESCE(SUM(quantity), 0)`.as('totalDeaths')])
    .where('mortality_records.date', '>=', startOfMonth)
    .where('mortality_records.date', '<=', endOfMonth)
    .where('batches.farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Initial quantity for mortality rate
  db
    .selectFrom('batches')
    .select([sql<number>`COALESCE(SUM("initialQuantity"), 0)`.as('total')])
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Feed this month
  db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      sql<string>`COALESCE(SUM(CAST(cost AS DECIMAL)), 0)`.as('totalCost'),
      sql<string>`COALESCE(SUM(CAST("quantityKg" AS DECIMAL)), 0)`.as(
        'totalKg',
      ),
    ])
    .where('feed_records.date', '>=', startOfMonth)
    .where('feed_records.date', '<=', endOfMonth)
    .where('batches.farmId', 'in', targetFarmIds)
    .executeTakeFirst(),

  // Total quantity for FCR
  db
    .selectFrom('batches')
    .select([
      sql<number>`COALESCE(SUM("currentQuantity"), 0)`.as('totalQuantity'),
    ])
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst(),
])

// Parallel Batch 3: Lists (customers, transactions, alerts)
const [topCustomers, recentSales, recentExpenses, alerts] = await Promise.all([
  // Top customers
  db
    .selectFrom('customers')
    .leftJoin('sales', 'sales.customerId', 'customers.id')
    .select([
      'customers.id',
      'customers.name',
      sql<string>`COALESCE(SUM(CAST(sales."totalAmount" AS DECIMAL)), 0)`.as(
        'totalSpent',
      ),
    ])
    .where((eb) =>
      eb.or([
        eb('sales.farmId', 'in', targetFarmIds),
        eb('sales.farmId', 'is', null),
      ]),
    )
    .groupBy(['customers.id', 'customers.name'])
    .orderBy(
      sql`COALESCE(SUM(CAST(sales."totalAmount" AS DECIMAL)), 0)`,
      'desc',
    )
    .limit(5)
    .execute(),

  // Recent sales
  db
    .selectFrom('sales')
    .select([
      'id',
      sql<'sale'>`'sale'`.as('type'),
      sql<string>`CONCAT("livestockType", ' sale - ', quantity, ' units')`.as(
        'description',
      ),
      'totalAmount as amount',
      'date',
    ])
    .where('farmId', 'in', targetFarmIds)
    .orderBy('date', 'desc')
    .limit(5)
    .execute(),

  // Recent expenses
  db
    .selectFrom('expenses')
    .select([
      'id',
      sql<'expense'>`'expense'`.as('type'),
      'description',
      'amount',
      'date',
    ])
    .where('farmId', 'in', targetFarmIds)
    .orderBy('date', 'desc')
    .limit(5)
    .execute(),

  // Alerts (already async)
  (async () => {
    const { getAllBatchAlerts } = await import('~/features/monitoring/server')
    return getAllBatchAlerts({ data: { farmId } })
  })(),
])
```

**GOTCHA**: Keep the data processing logic (parsing, calculations) after the Promise.all blocks - only the queries go inside Promise.all.

**VALIDATE**: `npx tsc --noEmit`

### Task 2: Verify Type Safety

- **IMPLEMENT**: Ensure all destructured variables have correct types
- **PATTERN**: Use explicit type annotations if TypeScript inference fails
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: Final Validation

- **VALIDATE**: `bun run check && bun run lint && bun run test --run`

---

## TESTING STRATEGY

### Regression Testing

No new tests needed - existing dashboard tests verify functionality.

### Performance Validation

Manual testing to verify latency improvement:

1. Before: Measure dashboard load time
2. After: Measure dashboard load time
3. Expected: ~70% reduction (1.5s → 450ms)

### Validation Commands

```bash
# Type checking
npx tsc --noEmit

# Full validation
bun run check && bun run lint && bun run test --run
```

---

## ACCEPTANCE CRITERIA

- [ ] All 15 queries grouped into 3 Promise.all batches
- [ ] No sequential queries except initial `getUserFarms()`
- [ ] All validation commands pass
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] Dashboard functionality unchanged

---

## COMPLETION CHECKLIST

- [ ] Task 1: Restructure queries into Promise.all batches
- [ ] Task 2: Verify type safety
- [ ] Task 3: Final validation passes

---

## NOTES

### Why 3 Batches Instead of 1?

While all queries could theoretically run in a single Promise.all, grouping into 3 batches:

1. Improves code readability
2. Groups related queries logically
3. Makes debugging easier
4. Still achieves ~70% latency reduction

### Alternative: CTE Approach

A single SQL query with CTEs could further reduce latency to a single roundtrip, but:

- Much more complex to implement
- Harder to maintain
- Kysely CTE support is limited
- Promise.all achieves 70% improvement with minimal risk

### Performance Expectations

| Approach                | Roundtrips | Estimated Latency |
| ----------------------- | ---------- | ----------------- |
| Current (sequential)    | 15         | 750ms - 1.5s      |
| Promise.all (3 batches) | 3          | 150ms - 450ms     |
| Single CTE              | 1          | 50ms - 150ms      |

Promise.all is the best balance of improvement vs. implementation risk.
