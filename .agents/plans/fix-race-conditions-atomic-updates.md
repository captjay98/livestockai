# Feature: Fix Race Conditions with Atomic Database Updates

## Feature Description

Replace Read-Modify-Write (RMW) patterns with atomic SQL updates to prevent lost updates when concurrent operations modify the same data.

## User Story

As a farm manager
I want inventory and batch updates to be accurate
So that concurrent operations don't cause data loss

## Problem Statement

Several functions use the RMW anti-pattern:

1. Read current value from database
2. Calculate new value in JavaScript
3. Write new value back

**Risk**: If two operations run concurrently, one update is lost.

**Example**:

```
User A reads 100kg → User B reads 100kg →
User A adds 10kg (writes 110) → User B subtracts 5kg (writes 95)
Result: 95kg instead of 105kg
```

## Solution Statement

Use Kysely's expression builder for atomic updates:

```typescript
// Instead of RMW:
const current = await db.selectFrom('table')...
const newValue = current + delta
await db.updateTable('table').set({ quantity: newValue })...

// Use atomic:
await db.updateTable('table')
  .set((eb) => ({ quantity: eb('quantity', '+', delta) }))
  .where(...)
  .execute()
```

## Feature Metadata

**Feature Type**: Bug Fix (Critical)
**Estimated Complexity**: Medium
**Primary Systems Affected**: inventory/feed-server.ts, mortality/server.ts, batches/server.ts
**Dependencies**: None

---

## CONTEXT REFERENCES

### Files with RMW Pattern - MUST FIX

| File                       | Function                | Line    | Issue                  |
| -------------------------- | ----------------------- | ------- | ---------------------- |
| `inventory/feed-server.ts` | `addFeedStock`          | 270-273 | RMW for feed quantity  |
| `inventory/feed-server.ts` | `reduceFeedStock`       | 330-333 | RMW for feed quantity  |
| `mortality/server.ts`      | `createMortalityRecord` | 130-137 | RMW for batch quantity |
| `mortality/server.ts`      | `updateMortalityRecord` | 650     | RMW for batch quantity |
| `mortality/server.ts`      | `deleteMortalityRecord` | 743     | RMW for batch quantity |

### Files Already Using Atomic Updates ✅

- `sales/repository.ts` lines 576, 599 - Uses `eb('currentQuantity', '+', quantity)`

### Pattern to Follow

From `app/features/sales/repository.ts` (lines 570-580):

```typescript
export async function restoreBatchQuantityOnDelete(
  db: Kysely<Database>,
  batchId: string,
  quantity: number,
): Promise<void> {
  await db
    .updateTable('batches')
    .set((eb) => ({
      currentQuantity: eb('currentQuantity', '+', quantity),
      status: 'active',
      updatedAt: new Date(),
    }))
    .where('id', '=', batchId)
    .execute()
}
```

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/features/inventory/feed-server.ts` - addFeedStock

**CURRENT** (lines 268-275):

```typescript
const currentQty = parseFloat(existing.quantityKg) || 0
const newQuantity = currentQty + quantityKg
await updateFeedInventory(db, existing.id, {
  quantityKg: newQuantity.toFixed(2),
})
```

**REPLACE WITH**:

```typescript
await db
  .updateTable('feed_inventory')
  .set((eb) => ({
    quantityKg: sql`CAST(CAST("quantityKg" AS DECIMAL) + ${quantityKg} AS TEXT)`,
    updatedAt: new Date(),
  }))
  .where('id', '=', existing.id)
  .execute()
```

**VALIDATE**: `npx tsc --noEmit`

### Task 2: UPDATE `app/features/inventory/feed-server.ts` - reduceFeedStock

**CURRENT** (lines 326-333):

```typescript
const currentQty = parseFloat(existing.quantityKg) || 0
// ... validation ...
const newQuantity = currentQty - quantityKg
await updateFeedInventory(db, existing.id, {
  quantityKg: newQuantity.toFixed(2),
})
```

**REPLACE WITH**:

```typescript
// Keep validation read (needed for insufficient stock check)
const currentQty = parseFloat(existing.quantityKg) || 0
if (currentQty < quantityKg) {
  throw new AppError('INSUFFICIENT_STOCK', {...})
}

// Atomic update
await db
  .updateTable('feed_inventory')
  .set((eb) => ({
    quantityKg: sql`CAST(CAST("quantityKg" AS DECIMAL) - ${quantityKg} AS TEXT)`,
    updatedAt: new Date(),
  }))
  .where('id', '=', existing.id)
  .execute()
```

**GOTCHA**: Keep the validation read - we need to check for insufficient stock before updating.

**VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE `app/features/mortality/server.ts` - createMortalityRecord

**CURRENT** (lines 130-137):

```typescript
const newQuantity = batch.currentQuantity - data.quantity
await trx
  .updateTable('batches')
  .set({
    currentQuantity: newQuantity,
    status: newQuantity <= 0 ? 'depleted' : 'active',
  })
  .where('id', '=', data.batchId)
  .execute()
```

**REPLACE WITH**:

```typescript
await trx
  .updateTable('batches')
  .set((eb) => ({
    currentQuantity: eb('currentQuantity', '-', data.quantity),
    status: sql`CASE WHEN "currentQuantity" - ${data.quantity} <= 0 THEN 'depleted' ELSE 'active' END`,
    updatedAt: new Date(),
  }))
  .where('id', '=', data.batchId)
  .execute()
```

**VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE `app/features/mortality/server.ts` - updateMortalityRecord

Find the RMW pattern around line 650 and replace with atomic update.

**VALIDATE**: `npx tsc --noEmit`

### Task 5: UPDATE `app/features/mortality/server.ts` - deleteMortalityRecord

Find the RMW pattern around line 743 and replace with atomic update (restore quantity).

**VALIDATE**: `npx tsc --noEmit`

### Task 6: ADD atomic update helpers to `app/features/inventory/repository.ts`

**CREATE** new functions:

```typescript
/**
 * Atomically add to feed inventory quantity
 */
export async function atomicAddFeedQuantity(
  db: Kysely<Database>,
  id: string,
  quantityKg: number,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set((eb) => ({
      quantityKg: sql`CAST(CAST("quantityKg" AS DECIMAL) + ${quantityKg} AS TEXT)`,
      updatedAt: new Date(),
    }))
    .where('id', '=', id)
    .execute()
}

/**
 * Atomically subtract from feed inventory quantity
 */
export async function atomicSubtractFeedQuantity(
  db: Kysely<Database>,
  id: string,
  quantityKg: number,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set((eb) => ({
      quantityKg: sql`CAST(CAST("quantityKg" AS DECIMAL) - ${quantityKg} AS TEXT)`,
      updatedAt: new Date(),
    }))
    .where('id', '=', id)
    .execute()
}
```

**VALIDATE**: `npx tsc --noEmit`

### Task 7: Final Validation

**VALIDATE**: `bun run check && bun run lint && bun run test --run`

---

## TESTING STRATEGY

### Unit Tests

Add property tests for atomic operations:

- Concurrent add operations should sum correctly
- Concurrent subtract operations should subtract correctly
- Mixed operations should produce correct result

### Validation Commands

```bash
npx tsc --noEmit
bun run check && bun run lint && bun run test --run
```

---

## ACCEPTANCE CRITERIA

- [ ] No RMW patterns in inventory/feed-server.ts
- [ ] No RMW patterns in mortality/server.ts
- [ ] All atomic updates use expression builder or raw SQL
- [ ] All validation commands pass
- [ ] All existing tests pass

---

## NOTES

### Why Keep Validation Reads?

For `reduceFeedStock`, we still need to read current quantity to validate sufficient stock. The read is for validation only - the actual update is atomic.

### SQL Expression for DECIMAL Columns

Feed inventory stores `quantityKg` as TEXT (representing DECIMAL). The atomic update must:

1. Cast TEXT to DECIMAL
2. Perform arithmetic
3. Cast back to TEXT

```sql
CAST(CAST("quantityKg" AS DECIMAL) + 10 AS TEXT)
```
