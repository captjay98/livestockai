# Feature: Add Soft Delete for Primary Entities

## Feature Description

Implement soft delete pattern for primary business entities (batches, customers, suppliers, farms) to prevent accidental data loss and preserve historical records for reporting.

## User Story

As a farm manager
I want deleted records to be recoverable
So that accidental deletions don't cause permanent data loss

## Problem Statement

Current delete operations perform hard `DELETE` from the database:

- Accidental deletions require full database backup restoration
- Historical records are lost (e.g., deleted supplier still referenced in old expenses)
- Financial reports become incomplete when referenced entities are deleted

## Solution Statement

Add `deletedAt` column to primary entities. Change delete operations to set `deletedAt = NOW()` instead of removing rows. Add `WHERE deletedAt IS NULL` to all queries.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**: Database schema, all repositories, all queries
**Dependencies**: Database migration

---

## CONTEXT REFERENCES

### Tables to Add Soft Delete

| Table        | Priority | Reason                                          |
| ------------ | -------- | ----------------------------------------------- |
| `batches`    | HIGH     | Core business entity, referenced by many tables |
| `customers`  | HIGH     | Referenced in sales, invoices                   |
| `suppliers`  | HIGH     | Referenced in expenses, feed records            |
| `farms`      | MEDIUM   | Parent entity for all data                      |
| `structures` | LOW      | Can be hard deleted (less critical)             |

### Files to Update

**Repositories** (add `WHERE deletedAt IS NULL`):

- `app/features/batches/repository.ts`
- `app/features/customers/repository.ts`
- `app/features/suppliers/repository.ts`
- `app/features/farms/server.ts`

**Server functions** (change delete to soft delete):

- `app/features/batches/server.ts` - `deleteBatch`
- `app/features/customers/server.ts` - `deleteCustomer`
- `app/features/suppliers/server.ts` - `deleteSupplier`

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE existing migration `app/lib/db/migrations/2025-01-08-001-initial-schema.ts`

**ADD** `deletedAt` column to batches, customers, and suppliers table definitions.

**FIND** the batches table creation and add:

```typescript
.addColumn('deletedAt', 'timestamp', (col) => col.defaultTo(null))
```

**FIND** the customers table creation and add:

```typescript
.addColumn('deletedAt', 'timestamp', (col) => col.defaultTo(null))
```

**FIND** the suppliers table creation and add:

```typescript
.addColumn('deletedAt', 'timestamp', (col) => col.defaultTo(null))
```

**ADD** indexes after table creation (in the indexes section):

```typescript
// Soft delete indexes
await db.schema
    .createIndex('idx_batches_deleted_at')
    .on('batches')
    .column('deletedAt')
    .execute()

await db.schema
    .createIndex('idx_customers_deleted_at')
    .on('customers')
    .column('deletedAt')
    .execute()

await db.schema
    .createIndex('idx_suppliers_deleted_at')
    .on('suppliers')
    .column('deletedAt')
    .execute()
```

**IMPORTANT**: After modifying the initial migration, you must reset and re-run:

```bash
bun run db:reset && bun run db:migrate
```

**VALIDATE**: `bun run db:migrate`

### Task 2: UPDATE `app/lib/db/types.ts` - Add deletedAt to interfaces

**ADD** to BatchTable, CustomerTable, SupplierTable:

```typescript
deletedAt: Date | null
```

**VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE `app/features/batches/repository.ts` - Add soft delete filter

**ADD** `.where('deletedAt', 'is', null)` to all SELECT queries.

**CHANGE** `deleteBatch` to soft delete:

```typescript
export async function deleteBatch(
    db: Kysely<Database>,
    id: string,
): Promise<void> {
    await db
        .updateTable('batches')
        .set({ deletedAt: new Date() })
        .where('id', '=', id)
        .execute()
}
```

**VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE `app/features/customers/repository.ts` - Add soft delete

Same pattern as Task 3.

**VALIDATE**: `npx tsc --noEmit`

### Task 5: UPDATE `app/features/suppliers/repository.ts` - Add soft delete

Same pattern as Task 3.

**VALIDATE**: `npx tsc --noEmit`

### Task 6: ADD restore functions

**ADD** to each repository:

```typescript
export async function restoreBatch(
    db: Kysely<Database>,
    id: string,
): Promise<void> {
    await db
        .updateTable('batches')
        .set({ deletedAt: null })
        .where('id', '=', id)
        .execute()
}
```

**VALIDATE**: `npx tsc --noEmit`

### Task 7: Final Validation

**VALIDATE**: `bun run check && bun run lint && bun run test --run`

---

## ACCEPTANCE CRITERIA

- [ ] Migration adds deletedAt to batches, customers, suppliers
- [ ] All SELECT queries filter by `deletedAt IS NULL`
- [ ] Delete operations set deletedAt instead of removing rows
- [ ] Restore functions exist for each entity
- [ ] All validation commands pass
- [ ] All existing tests pass

---

## NOTES

### Why Not All Tables?

Soft delete adds complexity. Only primary business entities need it:

- **Batches**: Core data, referenced everywhere
- **Customers**: Referenced in sales history
- **Suppliers**: Referenced in expense history

Child records (feed_records, mortality_records, etc.) can be hard deleted since they're meaningless without their parent batch.

### Future Enhancement: Admin UI

Consider adding an admin page to:

- View deleted records
- Restore deleted records
- Permanently purge old deleted records
