# Database Guide

Complete guide to the OpenLivestock database schema, migrations, and Kysely patterns.

---

## Overview

OpenLivestock uses:

- **PostgreSQL** via Neon (serverless)
- **Kysely** for type-safe queries
- **Migrations** for schema versioning

---

## Schema Overview

### Core Tables

| Table           | Purpose                 | Key Columns                    |
| --------------- | ----------------------- | ------------------------------ |
| `users`         | User accounts           | id, email, name, role          |
| `user_settings` | Preferences             | userId, currencyCode, language |
| `farms`         | Farm entities           | id, name, location, type       |
| `farm_modules`  | Enabled livestock types | farmId, moduleKey, enabled     |
| `user_farms`    | Farm access control     | userId, farmId, role           |

### Livestock Tables

| Table               | Purpose            | Key Columns                                  |
| ------------------- | ------------------ | -------------------------------------------- |
| `structures`        | Houses/ponds/barns | id, farmId, name, type, capacity             |
| `batches`           | Livestock groups   | id, farmId, livestockType, species, quantity |
| `mortality_records` | Death tracking     | id, batchId, quantity, cause                 |
| `feed_records`      | Feed consumption   | id, batchId, quantityKg, cost                |
| `weight_samples`    | Growth tracking    | id, batchId, averageWeightKg                 |
| `vaccinations`      | Health records     | id, batchId, vaccineName                     |
| `water_quality`     | Fish monitoring    | id, batchId, ph, temperature                 |

### Financial Tables

| Table           | Purpose            | Key Columns                         |
| --------------- | ------------------ | ----------------------------------- |
| `sales`         | Revenue records    | id, farmId, batchId, totalAmount    |
| `expenses`      | Cost tracking      | id, farmId, category, amount        |
| `invoices`      | Customer invoices  | id, customerId, totalAmount, status |
| `invoice_items` | Invoice line items | id, invoiceId, description, total   |

### Supporting Tables

| Table                  | Purpose           | Key Columns                          |
| ---------------------- | ----------------- | ------------------------------------ |
| `customers`            | Customer contacts | id, name, phone, customerType        |
| `suppliers`            | Supplier contacts | id, name, products, supplierType     |
| `feed_inventory`       | Feed stock        | id, farmId, feedType, quantityKg     |
| `medication_inventory` | Medicine stock    | id, farmId, medicationName, quantity |
| `notifications`        | In-app alerts     | id, userId, type, message, read      |
| `audit_logs`           | Activity history  | id, userId, action, entityType       |
| `growth_standards`     | Reference data    | species, day, expected_weight_g      |

---

## Database Types

All types are defined in `app/lib/db/types.ts`:

```typescript
import type { Database } from '~/lib/db/types'

// Table interfaces
export interface BatchTable {
  id: Generated<string>
  farmId: string
  livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species: string
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string // DECIMAL stored as string
  totalCost: string // DECIMAL stored as string
  status: 'active' | 'depleted' | 'sold'
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}
```

### Important: DECIMAL Columns

PostgreSQL DECIMAL columns are returned as **strings** by the pg driver to preserve precision:

```typescript
// ❌ Wrong - treats as number
const total = batch.totalCost + 100

// ✅ Correct - use currency utilities
import { toNumber, add } from '~/features/settings/currency'

const total = add(batch.totalCost, 100)
const totalNum = toNumber(batch.totalCost)
```

---

## Kysely Query Patterns

### Basic Queries

```typescript
import { db } from '~/lib/db'

// Select all columns
const batches = await db.selectFrom('batches').selectAll().execute()

// Select specific columns
const batches = await db
  .selectFrom('batches')
  .select(['id', 'species', 'currentQuantity'])
  .execute()

// Where clause
const activeBatches = await db
  .selectFrom('batches')
  .selectAll()
  .where('status', '=', 'active')
  .execute()

// Multiple conditions
const batches = await db
  .selectFrom('batches')
  .selectAll()
  .where('farmId', '=', farmId)
  .where('status', '=', 'active')
  .execute()
```

### Joins

```typescript
// Left join
const batchesWithFarm = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.species', 'farms.name as farmName'])
  .execute()

// Multiple joins
const feedRecords = await db
  .selectFrom('feed_records')
  .innerJoin('batches', 'batches.id', 'feed_records.batchId')
  .leftJoin('suppliers', 'suppliers.id', 'feed_records.supplierId')
  .select([
    'feed_records.id',
    'feed_records.quantityKg',
    'batches.species',
    'suppliers.name as supplierName',
  ])
  .execute()
```

### Aggregations

```typescript
// Count
const count = await db
  .selectFrom('batches')
  .select(db.fn.count('id').as('total'))
  .where('farmId', '=', farmId)
  .executeTakeFirst()

// Sum
const totalCost = await db
  .selectFrom('expenses')
  .select(db.fn.sum('amount').as('total'))
  .where('farmId', '=', farmId)
  .executeTakeFirst()

// Group by
const batchesBySpecies = await db
  .selectFrom('batches')
  .select([
    'species',
    db.fn.count('id').as('count'),
    db.fn.sum('currentQuantity').as('totalQuantity'),
  ])
  .where('farmId', '=', farmId)
  .groupBy('species')
  .execute()
```

### Ordering & Pagination

```typescript
// Order by
const batches = await db
  .selectFrom('batches')
  .selectAll()
  .orderBy('acquisitionDate', 'desc')
  .execute()

// Pagination
const page = 1
const pageSize = 10

const batches = await db
  .selectFrom('batches')
  .selectAll()
  .orderBy('acquisitionDate', 'desc')
  .limit(pageSize)
  .offset((page - 1) * pageSize)
  .execute()
```

### Insert

```typescript
// Insert single row
const result = await db
  .insertInto('batches')
  .values({
    farmId: 'farm-id',
    livestockType: 'poultry',
    species: 'broiler',
    initialQuantity: 100,
    currentQuantity: 100,
    acquisitionDate: new Date(),
    costPerUnit: '500',
    totalCost: '50000',
    status: 'active',
  })
  .returning('id')
  .executeTakeFirstOrThrow()

// Insert multiple rows
await db
  .insertInto('mortality_records')
  .values([
    { batchId: 'batch-1', quantity: 5, date: new Date(), cause: 'disease' },
    { batchId: 'batch-2', quantity: 3, date: new Date(), cause: 'predator' },
  ])
  .execute()
```

### Update

```typescript
// Update single row
await db
  .updateTable('batches')
  .set({ currentQuantity: 95, status: 'active' })
  .where('id', '=', batchId)
  .execute()

// Update with expression
await db
  .updateTable('batches')
  .set({ currentQuantity: db.fn('currentQuantity', ['-', 5]) })
  .where('id', '=', batchId)
  .execute()
```

### Delete

```typescript
// Delete single row
await db.deleteFrom('batches').where('id', '=', batchId).execute()

// Delete with condition
await db
  .deleteFrom('mortality_records')
  .where('batchId', '=', batchId)
  .where('date', '<', new Date('2025-01-01'))
  .execute()
```

### Transactions

```typescript
await db.transaction().execute(async (trx) => {
  // Create sale
  const sale = await trx
    .insertInto('sales')
    .values({
      farmId,
      batchId,
      quantity: 50,
      totalAmount: '25000',
      date: new Date(),
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  // Update batch quantity
  await trx
    .updateTable('batches')
    .set({ currentQuantity: db.fn('currentQuantity', ['-', 50]) })
    .where('id', '=', batchId)
    .execute()

  return sale.id
})
```

---

## Migrations

### Migration Structure

Migrations are in `app/lib/db/migrations/`:

```
app/lib/db/migrations/
└── 2025-01-08-001-initial-schema.ts
```

### Migration Format

```typescript
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create table
  await db.schema
    .createTable('batches')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(db.fn('gen_random_uuid()')),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.references('farms.id').onDelete('cascade').notNull(),
    )
    .addColumn('species', 'varchar(100)', (col) => col.notNull())
    .addColumn('initialQuantity', 'integer', (col) => col.notNull())
    .addColumn('currentQuantity', 'integer', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(db.fn.now()).notNull(),
    )
    .execute()

  // Add index
  await db.schema
    .createIndex('batches_farmId_status_idx')
    .on('batches')
    .columns(['farmId', 'status'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('batches').execute()
}
```

### Running Migrations

```bash
# Run all pending migrations
bun run db:migrate

# Rollback last migration
bun run db:rollback

# Check migration status
bun run db:status

# Reset database (drop all tables and re-migrate)
bun run db:reset
```

### Creating Migrations

1. Create file: `app/lib/db/migrations/YYYY-MM-DD-NNN-description.ts`
2. Implement `up()` and `down()` functions
3. Update `app/lib/db/types.ts` with new types
4. Run migration: `bun run db:migrate`

---

## Indexes

### Existing Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX batches_farmId_status_idx ON batches(farmId, status);
CREATE INDEX sales_farmId_date_idx ON sales(farmId, date);
CREATE INDEX expenses_farmId_date_idx ON expenses(farmId, date);
CREATE INDEX feed_records_batchId_date_idx ON feed_records(batchId, date);
CREATE INDEX mortality_records_batchId_date_idx ON mortality_records(batchId, date);
CREATE INDEX notifications_userId_read_idx ON notifications(userId, read);
CREATE INDEX weight_samples_batchId_date_idx ON weight_samples(batchId, date);
CREATE INDEX egg_records_batchId_date_idx ON egg_records(batchId, date);
```

### When to Add Indexes

Add indexes for:

- **Foreign keys** used in joins
- **Columns in WHERE clauses** (farmId, status, date)
- **Columns in ORDER BY** (date, createdAt)
- **Composite indexes** for multi-column queries

Don't over-index:

- Indexes slow down writes
- Each index uses storage
- PostgreSQL can use partial indexes

---

## Seeding

### Production Seed

`app/lib/db/seeds/production.ts`:

- Admin user
- Growth standards (reference data)

```bash
bun run db:seed
```

### Development Seed

`app/lib/db/seeds/development.ts`:

- 5 Nigerian farms
- Batches across all 6 livestock types
- Complete transaction history

```bash
bun run db:seed:dev
```

### Seed Helpers

```typescript
import { createUserWithAuth } from '~/lib/db/seeds/helpers'

// Create user with hashed password
const user = await createUserWithAuth(db, {
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe',
  role: 'user',
})
```

---

## Query Optimization

### Use Explicit Column Selection

```typescript
// ❌ Slow - fetches all columns
const batches = await db.selectFrom('batches').selectAll().execute()

// ✅ Fast - only needed columns
const batches = await db
  .selectFrom('batches')
  .select(['id', 'species', 'currentQuantity'])
  .execute()
```

### Use Indexes

```typescript
// ✅ Uses index: batches_farmId_status_idx
const batches = await db
  .selectFrom('batches')
  .selectAll()
  .where('farmId', '=', farmId)
  .where('status', '=', 'active')
  .execute()
```

### Avoid N+1 Queries

```typescript
// ❌ N+1 - queries database for each batch
for (const batch of batches) {
  const farm = await db
    .selectFrom('farms')
    .selectAll()
    .where('id', '=', batch.farmId)
    .executeTakeFirst()
}

// ✅ Single query with join
const batchesWithFarm = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.species', 'farms.name as farmName'])
  .execute()
```

### Use Transactions for Multiple Writes

```typescript
// ✅ Atomic - all or nothing
await db.transaction().execute(async (trx) => {
  await trx
    .insertInto('sales')
    .values({
      /* ... */
    })
    .execute()
  await trx
    .updateTable('batches')
    .set({
      /* ... */
    })
    .execute()
})
```

---

## Common Patterns

### Pagination

```typescript
export async function getBatchesPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
) {
  // Get total count
  const countResult = await db
    .selectFrom('batches')
    .select(db.fn.count('id').as('count'))
    .where('farmId', 'in', farmIds)
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Get paginated data
  const data = await db
    .selectFrom('batches')
    .selectAll()
    .where('farmId', 'in', farmIds)
    .orderBy('acquisitionDate', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return { data, total, page, pageSize, totalPages }
}
```

### Search

```typescript
const batches = await db
  .selectFrom('batches')
  .selectAll()
  .where((eb) =>
    eb.or([
      eb('species', 'ilike', `%${search}%`),
      eb('batchName', 'ilike', `%${search}%`),
    ]),
  )
  .execute()
```

### Soft Delete

```typescript
// Add deletedAt column
await db.schema
  .alterTable('batches')
  .addColumn('deletedAt', 'timestamp')
  .execute()

// Soft delete
await db
  .updateTable('batches')
  .set({ deletedAt: new Date() })
  .where('id', '=', batchId)
  .execute()

// Query only non-deleted
const batches = await db
  .selectFrom('batches')
  .selectAll()
  .where('deletedAt', 'is', null)
  .execute()
```

---

## Troubleshooting

### Connection Issues

```typescript
// Test connection
import { db } from '~/lib/db'

try {
  await db.selectFrom('users').select('id').limit(1).execute()
  console.log('✅ Database connected')
} catch (error) {
  console.error('❌ Database connection failed:', error)
}
```

### Query Debugging

```typescript
// Log generated SQL
const query = db.selectFrom('batches').selectAll().where('farmId', '=', farmId)

console.log(query.compile())
// { sql: 'SELECT * FROM batches WHERE farmId = $1', parameters: ['farm-id'] }
```

### Migration Errors

```bash
# Check current migration status
bun run db:status

# Rollback and retry
bun run db:rollback
bun run db:migrate

# Nuclear option: reset database
bun run db:reset
```

---

## Resources

- [Kysely Documentation](https://kysely.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Documentation](https://neon.tech/docs)

---

**Last Updated**: January 15, 2026
