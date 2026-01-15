# Feature: Daily Operations CRUD Completion

## Feature Description

Complete CRUD (Create, Read, Update, Delete) operations for all Daily Operations pages. Currently, several pages only have Create functionality. This plan adds Edit and Delete operations via dialogs for simple records, ensuring consistency across the application.

## User Story

As a farm manager
I want to edit and delete daily operation records (mortality, weight, vaccinations, water quality)
So that I can correct mistakes and maintain accurate farm data

## Problem Statement

Four Daily Operations pages (Mortality, Weight, Vaccinations, Water Quality) are missing Edit and Delete functionality. Users cannot correct data entry mistakes or remove erroneous records, leading to inaccurate farm data.

## Solution Statement

Add Edit/Delete functionality using the existing dialog pattern from Feed page. Each page will have:

- Edit button in table actions column
- Delete button with confirmation dialog
- Edit dialog pre-populated with existing data
- Server functions for update/delete operations

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Mortality, Weight, Vaccinations, Water Quality
**Dependencies**: None (uses existing patterns)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/features/feed/server.ts` (lines 147-300) - Pattern for updateFeedRecord and deleteFeedRecord
- `app/routes/_auth/feed/index.tsx` (lines 220-350) - Edit/Delete dialog pattern in UI
- `app/features/batches/server.ts` (lines 200-280) - Update/delete with audit logging pattern

### Files to Modify

**Server Functions (add update/delete):**

- `app/features/mortality/server.ts`
- `app/features/weight/server.ts`
- `app/features/vaccinations/server.ts`
- `app/features/water-quality/server.ts`

**Route Pages (add edit/delete UI):**

- `app/routes/_auth/mortality/index.tsx`
- `app/routes/_auth/weight/index.tsx`
- `app/routes/_auth/vaccinations/index.tsx`
- `app/routes/_auth/water-quality/index.tsx`

### Patterns to Follow

**Server Function Pattern (from feed/server.ts):**

```typescript
export async function updateRecord(
  userId: string,
  farmId: string,
  recordId: string,
  input: UpdateInput,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  await verifyFarmAccess(userId, farmId)

  await db
    .updateTable('table_name')
    .set({ ...input })
    .where('id', '=', recordId)
    .execute()
}

export const updateRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; recordId: string; data: UpdateInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateRecord(session.user.id, data.farmId, data.recordId, data.data)
  })
```

**Delete Pattern:**

```typescript
export async function deleteRecord(
  userId: string,
  farmId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  await verifyFarmAccess(userId, farmId)

  await db.deleteFrom('table_name').where('id', '=', recordId).execute()
}
```

**UI Pattern (table actions column):**

```typescript
{
  id: 'actions',
  cell: ({ row }) => (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(row.original)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ),
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Server Functions

Add update and delete functions to each feature's server.ts file.

### Phase 2: UI Components

Add edit/delete dialogs and table action buttons to each route page.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/features/mortality/server.ts`

Add update and delete functions for mortality records.

**IMPORTANT**: Mortality affects batch quantity. Delete must restore quantity, update must adjust if quantity changed.

```typescript
// Add after recordMortality function

export interface UpdateMortalityInput {
  quantity?: number
  date?: Date
  cause?:
    | 'disease'
    | 'predator'
    | 'weather'
    | 'unknown'
    | 'other'
    | 'starvation'
    | 'injury'
    | 'poisoning'
    | 'suffocation'
    | 'culling'
  notes?: string | null
}

export async function updateMortalityRecord(
  userId: string,
  recordId: string,
  input: UpdateMortalityInput,
): Promise<void> {
  const { db } = await import('~/lib/db')

  // Get existing record with batch info
  const existing = await db
    .selectFrom('mortality_records')
    .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
    .select([
      'mortality_records.id',
      'mortality_records.batchId',
      'mortality_records.quantity',
      'batches.farmId',
      'batches.currentQuantity',
    ])
    .where('mortality_records.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  // Verify access
  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.transaction().execute(async (trx) => {
    // If quantity changed, adjust batch
    if (input.quantity !== undefined && input.quantity !== existing.quantity) {
      const diff = existing.quantity - input.quantity // positive = restore, negative = deduct more
      const newBatchQty = existing.currentQuantity + diff

      if (newBatchQty < 0)
        throw new Error('Cannot increase mortality beyond batch quantity')

      await trx
        .updateTable('batches')
        .set({
          currentQuantity: newBatchQty,
          status: newBatchQty <= 0 ? 'depleted' : 'active',
        })
        .where('id', '=', existing.batchId)
        .execute()
    }

    await trx
      .updateTable('mortality_records')
      .set({
        quantity: input.quantity ?? existing.quantity,
        date: input.date,
        cause: input.cause,
        notes: input.notes,
      })
      .where('id', '=', recordId)
      .execute()
  })
}

export const updateMortalityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateMortalityInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateMortalityRecord(session.user.id, data.recordId, data.data)
  })

export async function deleteMortalityRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('mortality_records')
    .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
    .select([
      'mortality_records.id',
      'mortality_records.batchId',
      'mortality_records.quantity',
      'batches.farmId',
      'batches.currentQuantity',
    ])
    .where('mortality_records.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.transaction().execute(async (trx) => {
    // Restore batch quantity
    await trx
      .updateTable('batches')
      .set({
        currentQuantity: existing.currentQuantity + existing.quantity,
        status: 'active',
      })
      .where('id', '=', existing.batchId)
      .execute()

    await trx
      .deleteFrom('mortality_records')
      .where('id', '=', recordId)
      .execute()
  })
}

export const deleteMortalityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteMortalityRecord(session.user.id, data.recordId)
  })
```

**VALIDATE**: `bun run check`

---

### Task 2: UPDATE `app/features/weight/server.ts`

Add update and delete functions (simpler - no batch quantity impact).

```typescript
export interface UpdateWeightSampleInput {
  date?: Date
  sampleSize?: number
  averageWeightKg?: number
  minWeightKg?: number | null
  maxWeightKg?: number | null
  notes?: string | null
}

export async function updateWeightSample(
  userId: string,
  recordId: string,
  input: UpdateWeightSampleInput,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.id', 'batches.farmId'])
    .where('weight_samples.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db
    .updateTable('weight_samples')
    .set({
      date: input.date,
      sampleSize: input.sampleSize,
      averageWeightKg: input.averageWeightKg?.toString(),
      minWeightKg: input.minWeightKg?.toString() ?? null,
      maxWeightKg: input.maxWeightKg?.toString() ?? null,
      notes: input.notes,
    })
    .where('id', '=', recordId)
    .execute()
}

export const updateWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateWeightSampleInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateWeightSample(session.user.id, data.recordId, data.data)
  })

export async function deleteWeightSample(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.id', 'batches.farmId'])
    .where('weight_samples.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.deleteFrom('weight_samples').where('id', '=', recordId).execute()
}

export const deleteWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteWeightSample(session.user.id, data.recordId)
  })
```

**VALIDATE**: `bun run check`

---

### Task 3: UPDATE `app/features/vaccinations/server.ts`

Add update and delete for both vaccinations and treatments.

```typescript
export interface UpdateVaccinationInput {
  vaccineName?: string
  dateAdministered?: Date
  dosage?: string
  nextDueDate?: Date | null
  notes?: string | null
}

export interface UpdateTreatmentInput {
  medicationName?: string
  reason?: string
  date?: Date
  dosage?: string
  withdrawalDays?: number
  notes?: string | null
}

export async function updateVaccination(
  userId: string,
  recordId: string,
  input: UpdateVaccinationInput,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .select(['vaccinations.id', 'batches.farmId'])
    .where('vaccinations.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db
    .updateTable('vaccinations')
    .set({
      vaccineName: input.vaccineName,
      dateAdministered: input.dateAdministered,
      dosage: input.dosage,
      nextDueDate: input.nextDueDate,
      notes: input.notes,
    })
    .where('id', '=', recordId)
    .execute()
}

export const updateVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateVaccinationInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateVaccination(session.user.id, data.recordId, data.data)
  })

export async function deleteVaccination(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .select(['vaccinations.id', 'batches.farmId'])
    .where('vaccinations.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.deleteFrom('vaccinations').where('id', '=', recordId).execute()
}

export const deleteVaccinationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteVaccination(session.user.id, data.recordId)
  })

export async function updateTreatment(
  userId: string,
  recordId: string,
  input: UpdateTreatmentInput,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .select(['treatments.id', 'batches.farmId'])
    .where('treatments.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db
    .updateTable('treatments')
    .set({
      medicationName: input.medicationName,
      reason: input.reason,
      date: input.date,
      dosage: input.dosage,
      withdrawalDays: input.withdrawalDays,
      notes: input.notes,
    })
    .where('id', '=', recordId)
    .execute()
}

export const updateTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateTreatmentInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateTreatment(session.user.id, data.recordId, data.data)
  })

export async function deleteTreatment(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .select(['treatments.id', 'batches.farmId'])
    .where('treatments.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.deleteFrom('treatments').where('id', '=', recordId).execute()
}

export const deleteTreatmentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteTreatment(session.user.id, data.recordId)
  })
```

**VALIDATE**: `bun run check`

---

### Task 4: UPDATE `app/features/water-quality/server.ts`

Add update and delete functions.

```typescript
export interface UpdateWaterQualityInput {
  date?: Date
  ph?: number
  temperatureCelsius?: number
  dissolvedOxygenMgL?: number
  ammoniaMgL?: number
  notes?: string | null
}

export async function updateWaterQualityRecord(
  userId: string,
  recordId: string,
  input: UpdateWaterQualityInput,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .select(['water_quality.id', 'batches.farmId'])
    .where('water_quality.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db
    .updateTable('water_quality')
    .set({
      date: input.date,
      ph: input.ph?.toString(),
      temperatureCelsius: input.temperatureCelsius?.toString(),
      dissolvedOxygenMgL: input.dissolvedOxygenMgL?.toString(),
      ammoniaMgL: input.ammoniaMgL?.toString(),
      notes: input.notes,
    })
    .where('id', '=', recordId)
    .execute()
}

export const updateWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateWaterQualityInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateWaterQualityRecord(session.user.id, data.recordId, data.data)
  })

export async function deleteWaterQualityRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

  const existing = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .select(['water_quality.id', 'batches.farmId'])
    .where('water_quality.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const { checkFarmAccess } = await import('../auth/utils')
  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.deleteFrom('water_quality').where('id', '=', recordId).execute()
}

export const deleteWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteWaterQualityRecord(session.user.id, data.recordId)
  })
```

**VALIDATE**: `bun run check`

---

### Task 5: UPDATE `app/routes/_auth/mortality/index.tsx`

Add Edit and Delete buttons to table, add edit dialog, add delete confirmation.

**Changes needed:**

1. Import `Edit, Trash2` icons
2. Import `updateMortalityRecordFn, deleteMortalityRecordFn` from server
3. Add state: `editDialogOpen`, `deleteDialogOpen`, `selectedRecord`
4. Add `handleEdit`, `handleDelete`, `handleEditSubmit`, `handleDeleteConfirm` functions
5. Add actions column to table with Edit/Delete buttons
6. Add Edit Dialog (copy create dialog structure, pre-populate with selectedRecord)
7. Add Delete Confirmation Dialog

**VALIDATE**: `bun run check`

---

### Task 6: UPDATE `app/routes/_auth/weight/index.tsx`

Same pattern as mortality - add Edit/Delete to table and dialogs.

**VALIDATE**: `bun run check`

---

### Task 7: UPDATE `app/routes/_auth/vaccinations/index.tsx`

Same pattern - add Edit/Delete for both vaccinations and treatments.

**VALIDATE**: `bun run check`

---

### Task 8: UPDATE `app/routes/_auth/water-quality/index.tsx`

Same pattern - add Edit/Delete to table and dialogs.

**VALIDATE**: `bun run check`

---

## VALIDATION COMMANDS

### Level 1: Type Check

```bash
bun run check
```

### Level 2: Lint

```bash
bun run lint
```

### Level 3: Tests

```bash
bun test
```

### Level 4: Manual Testing

1. Navigate to each Daily Operations page
2. Create a new record
3. Click Edit - verify dialog opens with correct data
4. Modify and save - verify changes persist
5. Click Delete - verify confirmation appears
6. Confirm delete - verify record removed
7. For Mortality: verify batch quantity adjusts correctly on edit/delete

---

## ACCEPTANCE CRITERIA

- [ ] All 4 server files have update and delete functions
- [ ] All 4 route pages have Edit/Delete buttons in table
- [ ] Edit dialogs pre-populate with existing data
- [ ] Delete shows confirmation before removing
- [ ] Mortality edit/delete correctly adjusts batch quantities
- [ ] Toast notifications on success/error
- [ ] `bun run check` passes with 0 errors
- [ ] `bun run lint` passes with 0 errors

---

## COMPLETION CHECKLIST

- [ ] Task 1: Mortality server functions
- [ ] Task 2: Weight server functions
- [ ] Task 3: Vaccinations server functions
- [ ] Task 4: Water Quality server functions
- [ ] Task 5: Mortality UI
- [ ] Task 6: Weight UI
- [ ] Task 7: Vaccinations UI
- [ ] Task 8: Water Quality UI
- [ ] All validation commands pass
- [ ] Manual testing complete

---

## NOTES

- Mortality is the most complex because deleting/editing affects batch quantity
- Weight, Vaccinations, Water Quality are simpler (no side effects)
- Follow existing Feed page pattern exactly for consistency
- Use same dialog components and styling
