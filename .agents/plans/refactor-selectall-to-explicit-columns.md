# Feature: Refactor selectAll() to Explicit Column Selection

## Feature Description

Replace 24 instances of `.selectAll()` with explicit `.select([...columns])` across 12 repository files. This improves query performance at scale and follows the coding standard preference for explicit column selection.

## User Story

As a developer
I want database queries to use explicit column selection
So that queries are more performant and self-documenting

## Problem Statement

The codebase has 24 instances of `.selectAll()` which:

- Returns all columns even when not needed
- Less performant at scale (more data transferred)
- Violates coding standard preference (coding-standards.md:102)
- Less self-documenting (unclear what data is actually used)

## Solution Statement

Replace each `.selectAll()` with `.select([...columns])` using the exact columns defined in each table's interface from `app/lib/db/types.ts`.

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Low
**Primary Systems Affected**: Repository layer (12 files)
**Dependencies**: None

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/lib/db/types.ts` - **CRITICAL**: Contains all table schemas with column definitions
- `app/features/customers/repository.ts` (lines 54, 68) - CustomerTable columns
- `app/features/suppliers/repository.ts` (lines 46, 60) - SupplierTable columns
- `app/features/feed/repository.ts` (lines 148, 188, 210, 337, 380, 567) - FeedTable columns
- `app/features/expenses/repository.ts` (line 493) - ExpenseTable columns
- `app/features/settings/repository.ts` (lines 119, 267) - UserSettingsTable columns
- `app/features/vaccinations/repository.ts` (line 382) - VaccinationTable columns
- `app/features/mortality/server.ts` (line 199) - MortalityTable columns
- `app/features/batches/forecasting.ts` (lines 21, 41) - BatchTable, GrowthStandardTable columns
- `app/features/modules/repository.ts` (lines 19, 39) - FarmModuleTable columns
- `app/features/notifications/schedulers.ts` (lines 98, 138) - Various tables
- `app/features/notifications/server.ts` (line 59) - NotificationTable columns
- `app/features/reports/repository.ts` (lines 102, 154) - Various tables

### Column Definitions by Table

**CustomerTable** (9 columns):

```typescript
;[
  'id',
  'farmId',
  'name',
  'phone',
  'email',
  'location',
  'customerType',
  'createdAt',
  'updatedAt',
]
```

**SupplierTable** (9 columns):

```typescript
;[
  'id',
  'name',
  'phone',
  'email',
  'location',
  'products',
  'supplierType',
  'createdAt',
  'updatedAt',
]
```

**FeedTable** (12 columns):

```typescript
;[
  'id',
  'batchId',
  'feedType',
  'brandName',
  'bagSizeKg',
  'numberOfBags',
  'quantityKg',
  'cost',
  'date',
  'supplierId',
  'inventoryId',
  'notes',
  'createdAt',
]
```

**ExpenseTable** (9 columns):

```typescript
;[
  'id',
  'farmId',
  'batchId',
  'category',
  'amount',
  'date',
  'description',
  'supplierId',
  'isRecurring',
  'createdAt',
]
```

**UserSettingsTable** (30+ columns - use selectAll for this one, too many):
Keep `.selectAll()` - settings table has 30+ columns and all are needed.

**VaccinationTable** (8 columns):

```typescript
;[
  'id',
  'batchId',
  'vaccineName',
  'dateAdministered',
  'dosage',
  'nextDueDate',
  'notes',
  'createdAt',
]
```

**MortalityTable** (6 columns):

```typescript
;['id', 'batchId', 'quantity', 'date', 'cause', 'notes', 'createdAt']
```

**BatchTable** (18 columns):

```typescript
;[
  'id',
  'farmId',
  'batchName',
  'livestockType',
  'species',
  'sourceSize',
  'initialQuantity',
  'currentQuantity',
  'acquisitionDate',
  'costPerUnit',
  'totalCost',
  'status',
  'supplierId',
  'structureId',
  'targetHarvestDate',
  'target_weight_g',
  'targetPricePerUnit',
  'notes',
  'createdAt',
  'updatedAt',
]
```

**GrowthStandardTable** (4 columns):

```typescript
;['id', 'species', 'day', 'expected_weight_g']
```

**FarmModuleTable** (5 columns):

```typescript
;['id', 'farmId', 'moduleKey', 'enabled', 'createdAt']
```

**NotificationTable** (10 columns):

```typescript
;[
  'id',
  'userId',
  'farmId',
  'type',
  'title',
  'message',
  'read',
  'actionUrl',
  'metadata',
  'createdAt',
]
```

**FeedInventoryTable** (5 columns):

```typescript
;['id', 'farmId', 'feedType', 'quantityKg', 'minThresholdKg', 'updatedAt']
```

**MedicationInventoryTable** (7 columns):

```typescript
;[
  'id',
  'farmId',
  'medicationName',
  'quantity',
  'unit',
  'expiryDate',
  'minThreshold',
  'updatedAt',
]
```

### Patterns to Follow

**Before:**

```typescript
return await db
  .selectFrom('customers')
  .selectAll()
  .where('id', '=', customerId)
  .executeTakeFirst()
```

**After:**

```typescript
return await db
  .selectFrom('customers')
  .select([
    'id',
    'farmId',
    'name',
    'phone',
    'email',
    'location',
    'customerType',
    'createdAt',
    'updatedAt',
  ])
  .where('id', '=', customerId)
  .executeTakeFirst()
```

---

## IMPLEMENTATION PLAN

### Phase 1: Simple Tables (Few Columns)

Refactor tables with <10 columns first - lower risk.

### Phase 2: Complex Tables

Refactor tables with 10+ columns.

### Phase 3: Skip Settings

Keep `.selectAll()` for UserSettingsTable (30+ columns, all needed).

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/features/customers/repository.ts`

- **IMPLEMENT**: Replace 2 instances of `.selectAll()` at lines 54 and 68
- **COLUMNS**: `['id', 'farmId', 'name', 'phone', 'email', 'location', 'customerType', 'createdAt', 'updatedAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: UPDATE `app/features/suppliers/repository.ts`

- **IMPLEMENT**: Replace 2 instances of `.selectAll()` at lines 46 and 60
- **COLUMNS**: `['id', 'name', 'phone', 'email', 'location', 'products', 'supplierType', 'createdAt', 'updatedAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE `app/features/modules/repository.ts`

- **IMPLEMENT**: Replace 2 instances of `.selectAll()` at lines 19 and 39
- **COLUMNS**: `['id', 'farmId', 'moduleKey', 'enabled', 'createdAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE `app/features/mortality/server.ts`

- **IMPLEMENT**: Replace 1 instance of `.selectAll()` at line 199
- **COLUMNS**: `['id', 'batchId', 'quantity', 'date', 'cause', 'notes', 'createdAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: UPDATE `app/features/vaccinations/repository.ts`

- **IMPLEMENT**: Replace 1 instance of `.selectAll()` at line 382
- **COLUMNS**: `['id', 'batchId', 'vaccineName', 'dateAdministered', 'dosage', 'nextDueDate', 'notes', 'createdAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: UPDATE `app/features/notifications/server.ts`

- **IMPLEMENT**: Replace 1 instance of `.selectAll()` at line 59
- **COLUMNS**: `['id', 'userId', 'farmId', 'type', 'title', 'message', 'read', 'actionUrl', 'metadata', 'createdAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 7: UPDATE `app/features/expenses/repository.ts`

- **IMPLEMENT**: Replace 1 instance of `.selectAll()` at line 493
- **COLUMNS**: `['id', 'farmId', 'batchId', 'category', 'amount', 'date', 'description', 'supplierId', 'isRecurring', 'createdAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: UPDATE `app/features/feed/repository.ts`

- **IMPLEMENT**: Replace 6 instances of `.selectAll()` at lines 148, 188, 210, 337, 380, 567
- **COLUMNS**: `['id', 'batchId', 'feedType', 'brandName', 'bagSizeKg', 'numberOfBags', 'quantityKg', 'cost', 'date', 'supplierId', 'inventoryId', 'notes', 'createdAt']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 9: UPDATE `app/features/batches/forecasting.ts`

- **IMPLEMENT**: Replace 2 instances of `.selectAll()` at lines 21 and 41
- **LINE 21 (batches)**: `['id', 'farmId', 'batchName', 'livestockType', 'species', 'sourceSize', 'initialQuantity', 'currentQuantity', 'acquisitionDate', 'costPerUnit', 'totalCost', 'status', 'supplierId', 'structureId', 'targetHarvestDate', 'target_weight_g', 'targetPricePerUnit', 'notes', 'createdAt', 'updatedAt']`
- **LINE 41 (growth_standards)**: `['id', 'species', 'day', 'expected_weight_g']`
- **VALIDATE**: `npx tsc --noEmit`

### Task 10: UPDATE `app/features/notifications/schedulers.ts`

- **IMPLEMENT**: Replace 2 instances of `.selectAll()` at lines 98 and 138
- **CONTEXT**: Check what tables are being queried and use appropriate columns
- **VALIDATE**: `npx tsc --noEmit`

### Task 11: UPDATE `app/features/reports/repository.ts`

- **IMPLEMENT**: Replace 2 instances of `.selectAll()` at lines 102 and 154
- **CONTEXT**: Check what tables are being queried and use appropriate columns
- **VALIDATE**: `npx tsc --noEmit`

### Task 12: SKIP `app/features/settings/repository.ts`

- **DECISION**: Keep `.selectAll()` for UserSettingsTable
- **REASON**: 30+ columns, all are needed for settings functionality
- **NO CHANGES NEEDED**

### Task 13: Final Validation

- **VALIDATE**: `bun run check && bun run lint && bun run test --run`

---

## TESTING STRATEGY

### Regression Testing

No new tests needed - this is a pure refactoring with no behavior changes.

All existing 300+ tests must pass to confirm no regressions.

### Validation Commands

```bash
# After each task
npx tsc --noEmit

# Final validation
bun run check && bun run lint && bun run test --run
```

---

## ACCEPTANCE CRITERIA

- [ ] All 22 instances of `.selectAll()` replaced (excluding 2 in settings)
- [ ] All validation commands pass
- [ ] All 300+ existing tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No functional regressions

---

## COMPLETION CHECKLIST

- [ ] Task 1: customers/repository.ts (2 instances)
- [ ] Task 2: suppliers/repository.ts (2 instances)
- [ ] Task 3: modules/repository.ts (2 instances)
- [ ] Task 4: mortality/server.ts (1 instance)
- [ ] Task 5: vaccinations/repository.ts (1 instance)
- [ ] Task 6: notifications/server.ts (1 instance)
- [ ] Task 7: expenses/repository.ts (1 instance)
- [ ] Task 8: feed/repository.ts (6 instances)
- [ ] Task 9: batches/forecasting.ts (2 instances)
- [ ] Task 10: notifications/schedulers.ts (2 instances)
- [ ] Task 11: reports/repository.ts (2 instances)
- [ ] Task 12: settings/repository.ts (SKIP - keep selectAll)
- [ ] Task 13: Final validation passes

---

## NOTES

### Why Keep selectAll() for Settings

The `UserSettingsTable` has 30+ columns covering:

- Currency settings (6 columns)
- Date/time settings (3 columns)
- Unit settings (3 columns)
- Preferences (4 columns)
- Alerts (3 columns)
- Business settings (2 columns)
- Dashboard settings (1 column)
- Onboarding state (2 columns)
- Timestamps (2 columns)

All columns are needed when loading user settings, so explicit selection would just be verbose without benefit.

### Performance Impact

This refactoring will:

- Reduce data transfer from database
- Improve query performance at scale
- Make queries self-documenting
- Follow coding standards

### Risk Assessment

**Low risk** - Pure mechanical refactoring:

- No business logic changes
- Type system will catch missing columns
- Existing tests verify functionality
