# Design Document: Supplies Inventory

## Overview

The Supplies Inventory feature extends LivestockAI's inventory management system to track consumable farm supplies including disinfectants, bedding materials, chemicals, pest control products, fuel, and packaging materials. This feature follows the established three-layer architecture pattern (Server → Service → Repository) used by the existing Feed and Medication inventory systems.

The design prioritizes:

- **Consistency**: Follows the same patterns as feed-server.ts and medication-server.ts
- **Atomicity**: Stock transactions are atomic to prevent race conditions
- **Validation**: Comprehensive input validation using Zod schemas
- **Authorization**: Farm-based access control for all operations
- **Extensibility**: Easy to add new supply categories or units

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (React Components, Dialogs, Tables, Hooks)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                            │
│  (Server Functions - Auth, Validation, Orchestration)       │
│  - supplies-server.ts                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  (Pure Business Logic - Calculations, Validations)          │
│  - supplies-service.ts                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                          │
│  (Database Operations - CRUD, Queries)                      │
│  - supplies-repository.ts                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  (PostgreSQL via Kysely ORM)                                │
│  - supplies_inventory table                                  │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow Example

```
User clicks "Add Stock" button
  ↓
Component calls addSuppliesStockFn({ supplyId, quantityToAdd })
  ↓
Server function validates auth and input
  ↓
Service layer validates business rules (non-negative quantity)
  ↓
Repository executes atomic UPDATE query
  ↓
Database updates quantity and lastRestocked
  ↓
Response flows back up the stack
  ↓
UI updates with new stock level
```

## Components and Interfaces

### Database Schema

#### supplies_inventory Table

```typescript
interface SuppliesInventoryTable {
  id: string // uuid, primary key
  farmId: string // uuid, foreign key to farms
  itemName: string // supply item name
  category:
    | 'disinfectant'
    | 'bedding'
    | 'chemical'
    | 'pest_control'
    | 'fuel'
    | 'packaging'
  quantityKg: number // decimal, current stock level
  unit: 'kg' | 'liters' | 'pieces' | 'bags'
  minThresholdKg: number // decimal, low stock threshold
  costPerUnit: number | null // decimal, optional cost tracking
  supplierId: string | null // uuid, optional foreign key to suppliers
  lastRestocked: Date | null // optional, last restock date
  expiryDate: Date | null // optional, for chemicals
  notes: string | null // optional, text field
  createdAt: Date // timestamp
  updatedAt: Date // timestamp
}
```

**Indexes:**

- Primary key on `id`
- Index on `farmId` for farm-based queries
- Index on `(farmId, category)` for filtered queries
- Index on `expiryDate` for expiry queries

**Constraints:**

- `quantityKg >= 0` (check constraint)
- `minThresholdKg >= 0` (check constraint)
- `costPerUnit >= 0` (check constraint, if not null)
- Foreign key `farmId` references `farms(id)` ON DELETE CASCADE
- Foreign key `supplierId` references `suppliers(id)` ON DELETE SET NULL

### TypeScript Types

```typescript
// Core types
export type SupplyCategory =
  | 'disinfectant'
  | 'bedding'
  | 'chemical'
  | 'pest_control'
  | 'fuel'
  | 'packaging'

export type SupplyUnit = 'kg' | 'liters' | 'pieces' | 'bags'

export interface SupplyItem {
  id: string
  farmId: string
  itemName: string
  category: SupplyCategory
  quantityKg: number
  unit: SupplyUnit
  minThresholdKg: number
  costPerUnit: number | null
  supplierId: string | null
  lastRestocked: Date | null
  expiryDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// Computed properties
export interface SupplyItemWithStatus extends SupplyItem {
  isLowStock: boolean
  isExpiringSoon: boolean
  isExpired: boolean
  totalValue: number | null
  daysUntilExpiry: number | null
}

// Input types
export interface CreateSupplyInput {
  farmId: string
  itemName: string
  category: SupplyCategory
  quantityKg: number
  unit: SupplyUnit
  minThresholdKg: number
  costPerUnit?: number
  supplierId?: string
  lastRestocked?: Date
  expiryDate?: Date
  notes?: string
}

export interface UpdateSupplyInput {
  id: string
  itemName?: string
  category?: SupplyCategory
  quantityKg?: number
  unit?: SupplyUnit
  minThresholdKg?: number
  costPerUnit?: number
  supplierId?: string
  lastRestocked?: Date
  expiryDate?: Date
  notes?: string
}

export interface StockTransactionInput {
  supplyId: string
  quantity: number
}
```

### Server Functions (supplies-server.ts)

All server functions follow the pattern:

1. Validate authentication using `requireAuth()`
2. Validate input using Zod schemas
3. Check farm access permissions
4. Call service layer for business logic
5. Call repository layer for database operations
6. Return typed response

```typescript
// Get all supplies for user's farms
export const getSuppliesInventoryFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      category: z
        .enum([
          'disinfectant',
          'bedding',
          'chemical',
          'pest_control',
          'fuel',
          'packaging',
        ])
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get user's farm IDs
    const farmIds = await getUserFarmIds(db, session.user.id)

    // Filter by farmId if provided
    const targetFarmId = data.farmId || farmIds[0]
    if (!farmIds.includes(targetFarmId)) {
      throw new AppError('FORBIDDEN', 'Access denied to this farm')
    }

    // Get supplies from repository
    const supplies = await getSuppliesByFarm(db, targetFarmId, data.category)

    // Enrich with computed properties
    return supplies.map(enrichSupplyWithStatus)
  })

// Get low stock supplies
export const getLowStockSuppliesFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const farmIds = await getUserFarmIds(db, session.user.id)
    const targetFarmId = data.farmId || farmIds[0]

    if (!farmIds.includes(targetFarmId)) {
      throw new AppError('FORBIDDEN', 'Access denied to this farm')
    }

    const supplies = await getLowStockSupplies(db, targetFarmId)
    return supplies.map(enrichSupplyWithStatus)
  })

// Get expiring supplies
export const getExpiringSuppliesFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      daysAhead: z.number().int().positive().default(30),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const farmIds = await getUserFarmIds(db, session.user.id)
    const targetFarmId = data.farmId || farmIds[0]

    if (!farmIds.includes(targetFarmId)) {
      throw new AppError('FORBIDDEN', 'Access denied to this farm')
    }

    const supplies = await getExpiringSupplies(db, targetFarmId, data.daysAhead)
    return supplies.map(enrichSupplyWithStatus)
  })

// Create supply item
export const createSuppliesInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid(),
      itemName: z.string().min(1).max(200),
      category: z.enum([
        'disinfectant',
        'bedding',
        'chemical',
        'pest_control',
        'fuel',
        'packaging',
      ]),
      quantityKg: z.number().nonnegative(),
      unit: z.enum(['kg', 'liters', 'pieces', 'bags']),
      minThresholdKg: z.number().nonnegative(),
      costPerUnit: z.number().nonnegative().optional(),
      supplierId: z.string().uuid().optional(),
      lastRestocked: z.coerce.date().optional(),
      expiryDate: z.coerce.date().optional(),
      notes: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Validate farm access
    const hasAccess = await userHasFarmAccess(db, session.user.id, data.farmId)
    if (!hasAccess) {
      throw new AppError('FORBIDDEN', 'Access denied to this farm')
    }

    // Validate business rules
    const validationError = validateSupplyData(data)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', validationError)
    }

    // Create supply
    const supplyId = await createSupply(db, data)
    return { id: supplyId }
  })

// Update supply item
export const updateSuppliesInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      itemName: z.string().min(1).max(200).optional(),
      category: z
        .enum([
          'disinfectant',
          'bedding',
          'chemical',
          'pest_control',
          'fuel',
          'packaging',
        ])
        .optional(),
      quantityKg: z.number().nonnegative().optional(),
      unit: z.enum(['kg', 'liters', 'pieces', 'bags']).optional(),
      minThresholdKg: z.number().nonnegative().optional(),
      costPerUnit: z.number().nonnegative().optional(),
      supplierId: z.string().uuid().optional(),
      lastRestocked: z.coerce.date().optional(),
      expiryDate: z.coerce.date().optional(),
      notes: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get supply and validate access
    const supply = await getSupplyById(db, data.id)
    if (!supply) {
      throw new AppError('NOT_FOUND', 'Supply not found')
    }

    const hasAccess = await userHasFarmAccess(
      db,
      session.user.id,
      supply.farmId,
    )
    if (!hasAccess) {
      throw new AppError('FORBIDDEN', 'Access denied to this supply')
    }

    // Validate business rules
    const validationError = validateSupplyUpdateData(data)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', validationError)
    }

    // Update supply
    await updateSupply(db, data)
    return { success: true }
  })

// Delete supply item
export const deleteSuppliesInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get supply and validate access
    const supply = await getSupplyById(db, data.id)
    if (!supply) {
      throw new AppError('NOT_FOUND', 'Supply not found')
    }

    const hasAccess = await userHasFarmAccess(
      db,
      session.user.id,
      supply.farmId,
    )
    if (!hasAccess) {
      throw new AppError('FORBIDDEN', 'Access denied to this supply')
    }

    // Delete supply
    await deleteSupply(db, data.id)
    return { success: true }
  })

// Add stock (atomic)
export const addSuppliesStockFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      supplyId: z.string().uuid(),
      quantity: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get supply and validate access
    const supply = await getSupplyById(db, data.supplyId)
    if (!supply) {
      throw new AppError('NOT_FOUND', 'Supply not found')
    }

    const hasAccess = await userHasFarmAccess(
      db,
      session.user.id,
      supply.farmId,
    )
    if (!hasAccess) {
      throw new AppError('FORBIDDEN', 'Access denied to this supply')
    }

    // Add stock atomically
    await addStock(db, data.supplyId, data.quantity)
    return { success: true }
  })

// Reduce stock (atomic)
export const reduceSuppliesStockFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      supplyId: z.string().uuid(),
      quantity: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get supply and validate access
    const supply = await getSupplyById(db, data.supplyId)
    if (!supply) {
      throw new AppError('NOT_FOUND', 'Supply not found')
    }

    const hasAccess = await userHasFarmAccess(
      db,
      session.user.id,
      supply.farmId,
    )
    if (!hasAccess) {
      throw new AppError('FORBIDDEN', 'Access denied to this supply')
    }

    // Validate sufficient stock
    if (supply.quantityKg < data.quantity) {
      throw new AppError('VALIDATION_ERROR', 'Insufficient stock')
    }

    // Reduce stock atomically
    await reduceStock(db, data.supplyId, data.quantity)
    return { success: true }
  })
```

### Service Layer (supplies-service.ts)

Pure functions for business logic - no database access, easy to test.

```typescript
/**
 * Validate supply creation data
 */
export function validateSupplyData(data: CreateSupplyInput): string | null {
  if (data.itemName.trim().length === 0) {
    return 'Item name cannot be empty'
  }

  if (data.quantityKg < 0) {
    return 'Quantity cannot be negative'
  }

  if (data.minThresholdKg < 0) {
    return 'Minimum threshold cannot be negative'
  }

  if (data.costPerUnit !== undefined && data.costPerUnit < 0) {
    return 'Cost per unit cannot be negative'
  }

  if (data.expiryDate && data.expiryDate <= new Date()) {
    return 'Expiry date must be in the future'
  }

  return null
}

/**
 * Validate supply update data
 */
export function validateSupplyUpdateData(
  data: UpdateSupplyInput,
): string | null {
  if (data.itemName !== undefined && data.itemName.trim().length === 0) {
    return 'Item name cannot be empty'
  }

  if (data.quantityKg !== undefined && data.quantityKg < 0) {
    return 'Quantity cannot be negative'
  }

  if (data.minThresholdKg !== undefined && data.minThresholdKg < 0) {
    return 'Minimum threshold cannot be negative'
  }

  if (data.costPerUnit !== undefined && data.costPerUnit < 0) {
    return 'Cost per unit cannot be negative'
  }

  if (data.expiryDate && data.expiryDate <= new Date()) {
    return 'Expiry date must be in the future'
  }

  return null
}

/**
 * Check if supply is low stock
 */
export function isLowStock(quantity: number, minThreshold: number): boolean {
  return quantity <= minThreshold
}

/**
 * Check if supply is expiring soon (within days)
 */
export function isExpiringSoon(
  expiryDate: Date | null,
  daysAhead: number = 30,
): boolean {
  if (!expiryDate) return false

  const now = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  return daysUntilExpiry > 0 && daysUntilExpiry <= daysAhead
}

/**
 * Check if supply is expired
 */
export function isExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return false
  return expiryDate < new Date()
}

/**
 * Calculate days until expiry
 */
export function calculateDaysUntilExpiry(
  expiryDate: Date | null,
): number | null {
  if (!expiryDate) return null

  const now = new Date()
  const days = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  return days
}

/**
 * Calculate total value of supply
 */
export function calculateTotalValue(
  quantity: number,
  costPerUnit: number | null,
): number | null {
  if (costPerUnit === null) return null
  return quantity * costPerUnit
}

/**
 * Enrich supply with computed status properties
 */
export function enrichSupplyWithStatus(
  supply: SupplyItem,
): SupplyItemWithStatus {
  return {
    ...supply,
    isLowStock: isLowStock(supply.quantityKg, supply.minThresholdKg),
    isExpiringSoon: isExpiringSoon(supply.expiryDate),
    isExpired: isExpired(supply.expiryDate),
    totalValue: calculateTotalValue(supply.quantityKg, supply.costPerUnit),
    daysUntilExpiry: calculateDaysUntilExpiry(supply.expiryDate),
  }
}
```

### Repository Layer (supplies-repository.ts)

Database operations using Kysely ORM.

```typescript
import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type {
  CreateSupplyInput,
  UpdateSupplyInput,
  SupplyItem,
  SupplyCategory,
} from './types'

/**
 * Get all supplies for a farm
 */
export async function getSuppliesByFarm(
  db: Kysely<Database>,
  farmId: string,
  category?: SupplyCategory,
): Promise<SupplyItem[]> {
  let query = db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .orderBy('itemName', 'asc')

  if (category) {
    query = query.where('category', '=', category)
  }

  return query.execute()
}

/**
 * Get supply by ID
 */
export async function getSupplyById(
  db: Kysely<Database>,
  id: string,
): Promise<SupplyItem | undefined> {
  return db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}

/**
 * Get low stock supplies for a farm
 */
export async function getLowStockSupplies(
  db: Kysely<Database>,
  farmId: string,
): Promise<SupplyItem[]> {
  return db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .where((eb) => eb('quantityKg', '<=', eb.ref('minThresholdKg')))
    .orderBy('quantityKg', 'asc')
    .execute()
}

/**
 * Get expiring supplies for a farm
 */
export async function getExpiringSupplies(
  db: Kysely<Database>,
  farmId: string,
  daysAhead: number,
): Promise<SupplyItem[]> {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .where('expiryDate', 'is not', null)
    .where('expiryDate', '>', new Date())
    .where('expiryDate', '<=', futureDate)
    .orderBy('expiryDate', 'asc')
    .execute()
}

/**
 * Create a new supply item
 */
export async function createSupply(
  db: Kysely<Database>,
  data: CreateSupplyInput,
): Promise<string> {
  const result = await db
    .insertInto('supplies_inventory')
    .values({
      farmId: data.farmId,
      itemName: data.itemName,
      category: data.category,
      quantityKg: data.quantityKg,
      unit: data.unit,
      minThresholdKg: data.minThresholdKg,
      costPerUnit: data.costPerUnit ?? null,
      supplierId: data.supplierId ?? null,
      lastRestocked: data.lastRestocked ?? null,
      expiryDate: data.expiryDate ?? null,
      notes: data.notes ?? null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Update a supply item
 */
export async function updateSupply(
  db: Kysely<Database>,
  data: UpdateSupplyInput,
): Promise<void> {
  const { id, ...updates } = data

  await db
    .updateTable('supplies_inventory')
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

/**
 * Delete a supply item
 */
export async function deleteSupply(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db.deleteFrom('supplies_inventory').where('id', '=', id).execute()
}

/**
 * Add stock to a supply item (atomic)
 */
export async function addStock(
  db: Kysely<Database>,
  supplyId: string,
  quantity: number,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('supplies_inventory')
      .set((eb) => ({
        quantityKg: eb('quantityKg', '+', quantity),
        lastRestocked: new Date(),
        updatedAt: new Date(),
      }))
      .where('id', '=', supplyId)
      .execute()
  })
}

/**
 * Reduce stock from a supply item (atomic)
 */
export async function reduceStock(
  db: Kysely<Database>,
  supplyId: string,
  quantity: number,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('supplies_inventory')
      .set((eb) => ({
        quantityKg: eb('quantityKg', '-', quantity),
        updatedAt: new Date(),
      }))
      .where('id', '=', supplyId)
      .execute()
  })
}

/**
 * Get user's farm IDs
 */
export async function getUserFarmIds(
  db: Kysely<Database>,
  userId: string,
): Promise<string[]> {
  const farms = await db
    .selectFrom('user_farms')
    .select('farmId')
    .where('userId', '=', userId)
    .execute()

  return farms.map((f) => f.farmId)
}

/**
 * Check if user has access to a farm
 */
export async function userHasFarmAccess(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
): Promise<boolean> {
  const result = await db
    .selectFrom('user_farms')
    .select('farmId')
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  return !!result
}
```

## Data Models

### Database Migration

```typescript
// app/lib/db/migrations/2026-01-XX-XXX-create-supplies-inventory.ts
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('supplies_inventory')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(db.fn('gen_random_uuid()')),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('itemName', 'varchar(200)', (col) => col.notNull())
    .addColumn('category', 'varchar(50)', (col) => col.notNull())
    .addColumn('quantityKg', 'decimal(10,2)', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('unit', 'varchar(20)', (col) => col.notNull())
    .addColumn('minThresholdKg', 'decimal(10,2)', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('costPerUnit', 'decimal(10,2)')
    .addColumn('supplierId', 'uuid', (col) =>
      col.references('suppliers.id').onDelete('set null'),
    )
    .addColumn('lastRestocked', 'timestamp')
    .addColumn('expiryDate', 'timestamp')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.notNull().defaultTo(db.fn.now()),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.notNull().defaultTo(db.fn.now()),
    )
    .execute()

  // Add indexes
  await db.schema
    .createIndex('supplies_inventory_farmId_idx')
    .on('supplies_inventory')
    .column('farmId')
    .execute()

  await db.schema
    .createIndex('supplies_inventory_farmId_category_idx')
    .on('supplies_inventory')
    .columns(['farmId', 'category'])
    .execute()

  await db.schema
    .createIndex('supplies_inventory_expiryDate_idx')
    .on('supplies_inventory')
    .column('expiryDate')
    .execute()

  // Add check constraints
  await db.schema
    .alterTable('supplies_inventory')
    .addCheckConstraint(
      'supplies_inventory_quantityKg_check',
      db.raw('quantityKg >= 0'),
    )
    .execute()

  await db.schema
    .alterTable('supplies_inventory')
    .addCheckConstraint(
      'supplies_inventory_minThresholdKg_check',
      db.raw('minThresholdKg >= 0'),
    )
    .execute()

  await db.schema
    .alterTable('supplies_inventory')
    .addCheckConstraint(
      'supplies_inventory_costPerUnit_check',
      db.raw('costPerUnit IS NULL OR costPerUnit >= 0'),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('supplies_inventory').execute()
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Consolidation 1**: Input validation properties (1.2, 1.3, 1.4, 2.2, 9.2-9.6) can be grouped into comprehensive validation properties rather than separate properties for each field.

**Consolidation 2**: Authorization properties (7.1-7.5) all test the same underlying authorization mechanism, so they can be combined into fewer comprehensive properties.

**Consolidation 3**: Alert generation properties (8.1-8.3) test the same alert mechanism with different conditions, so they can be combined.

**Consolidation 4**: Stock arithmetic properties (2.5, 2.6) are both testing arithmetic operations and can be combined into a single property about stock transactions preserving arithmetic invariants.

### Core Properties

#### Property 1: Supply Creation Stores All Fields

_For any_ valid supply item data (name, category, quantity, unit, threshold, and optional fields), creating a supply and then retrieving it should return an item with all the same field values.

**Validates: Requirements 1.1, 1.5**

**Test Strategy**: Generate random supply data with all combinations of required and optional fields, create the supply, retrieve it, and verify all fields match.

#### Property 2: Input Validation Rejects Invalid Data

_For any_ supply item data with invalid fields (empty name, negative quantity, negative threshold, negative cost, invalid category, invalid unit, or past expiry date), the validation function should return an error message.

**Validates: Requirements 1.2, 1.3, 1.4, 2.2, 4.1, 5.1, 9.2, 9.3, 9.4, 9.5, 9.6**

**Test Strategy**: Generate random invalid supply data covering all validation rules, call validation function, and verify it returns an error.

#### Property 3: Stock Transactions Preserve Arithmetic

_For any_ supply item with initial quantity Q, adding amount A then reducing amount B should result in final quantity Q + A - B (when Q + A - B >= 0).

**Validates: Requirements 2.5, 2.6**

**Test Strategy**: Generate random initial quantities and transaction amounts, perform add/reduce operations, and verify final quantity matches expected arithmetic result.

#### Property 4: Stock Reduction Prevents Negative Quantities

_For any_ supply item with quantity Q, attempting to reduce by amount R where R > Q should be rejected with an error.

**Validates: Requirements 2.7**

**Test Strategy**: Generate random quantities and reduction amounts where reduction exceeds quantity, attempt the operation, and verify it's rejected.

#### Property 5: Low Stock Detection

_For any_ supply item with quantity Q and minimum threshold T, the item should be marked as low stock if and only if Q <= T.

**Validates: Requirements 2.3, 2.4**

**Test Strategy**: Generate random quantities and thresholds, compute low stock status, and verify it matches the Q <= T condition.

#### Property 6: Expiry Date Calculations

_For any_ supply item with expiry date E and current date C:

- Item is expired if E < C
- Item is expiring soon if C < E <= C + 30 days
- Days until expiry equals ceil((E - C) / 1 day)

**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

**Test Strategy**: Generate random expiry dates relative to current date, compute expiry status and days until expiry, and verify calculations match expected formulas.

#### Property 7: Total Value Calculation

_For any_ supply item with quantity Q and cost per unit C, the total value should equal Q × C (or null if C is null).

**Validates: Requirements 5.2**

**Test Strategy**: Generate random quantities and costs, calculate total value, and verify it matches Q × C.

#### Property 8: Inventory Value Aggregation

_For any_ collection of supply items with costs, the total inventory value should equal the sum of all individual item values.

**Validates: Requirements 5.3**

**Test Strategy**: Generate random collections of supplies with costs, calculate total inventory value, and verify it equals the sum of individual values.

#### Property 9: CreatedAt Timestamp Immutability

_For any_ supply item, updating any field should preserve the original createdAt timestamp.

**Validates: Requirements 1.6**

**Test Strategy**: Generate random supply data, create supply, record createdAt, update the supply, and verify createdAt remains unchanged.

#### Property 10: Delete Operation Removes Item

_For any_ supply item, after deletion, querying for that item by ID should return null/undefined.

**Validates: Requirements 1.7**

**Test Strategy**: Generate random supply data, create supply, delete it, query by ID, and verify it no longer exists.

#### Property 11: Farm Access Authorization

_For any_ user and supply item, the user should only be able to view, create, update, delete, or perform stock transactions on supplies belonging to farms they have access to.

**Validates: Requirements 1.8, 7.1, 7.2, 7.3, 7.4, 7.5**

**Test Strategy**: Generate random users, farms, and supplies, attempt operations on supplies from farms the user doesn't have access to, and verify all operations are rejected.

#### Property 12: Stock Transaction Atomicity

_For any_ supply item, when adding stock, both the quantity and lastRestocked date should be updated together atomically.

**Validates: Requirements 3.1, 3.2**

**Test Strategy**: Generate random supply and stock addition amount, perform add stock operation, and verify both quantity and lastRestocked are updated.

#### Property 13: Alert Generation Completeness

_For any_ collection of supply items, the low stock alerts should include exactly those items where quantity <= threshold, expiring alerts should include exactly those items with expiry within 30 days, and expired alerts should include exactly those items with expiry in the past.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

**Test Strategy**: Generate random collections of supplies with various stock levels and expiry dates, compute alerts, and verify each alert list contains exactly the expected items.

### Edge Cases

The following edge cases should be explicitly tested in unit tests:

1. **Empty string item name**: Should be rejected by validation
2. **Zero quantity**: Should be accepted (valid state)
3. **Zero threshold**: Should be accepted (alerts when quantity reaches zero)
4. **Null cost per unit**: Should be accepted (total value should be null)
5. **Expiry date exactly 30 days away**: Should be marked as expiring soon
6. **Expiry date exactly today**: Should be marked as expired
7. **Multiple supplies with same name**: Should be allowed (different items)
8. **Stock reduction to exactly zero**: Should be accepted
9. **Very large quantities**: Should handle decimal precision correctly
10. **Concurrent stock transactions**: Should be handled by database transaction isolation

## Error Handling

### Error Types

The system uses structured error handling with the `AppError` class:

```typescript
class AppError extends Error {
  constructor(
    public code:
      | 'VALIDATION_ERROR'
      | 'NOT_FOUND'
      | 'FORBIDDEN'
      | 'INTERNAL_ERROR',
    message: string,
  ) {
    super(message)
  }
}
```

### Error Scenarios

| Scenario           | Error Code       | Message                        | HTTP Status |
| ------------------ | ---------------- | ------------------------------ | ----------- |
| Invalid input data | VALIDATION_ERROR | Descriptive validation message | 400         |
| Supply not found   | NOT_FOUND        | "Supply not found"             | 404         |
| No farm access     | FORBIDDEN        | "Access denied to this farm"   | 403         |
| Insufficient stock | VALIDATION_ERROR | "Insufficient stock"           | 400         |
| Database error     | INTERNAL_ERROR   | "Failed to complete operation" | 500         |

### Error Handling Patterns

**Server Function Level**:

```typescript
.handler(async ({ data }) => {
  try {
    // Validate auth
    const session = await requireAuth()

    // Validate input
    const validationError = validateSupplyData(data)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', validationError)
    }

    // Validate authorization
    const hasAccess = await userHasFarmAccess(db, session.user.id, data.farmId)
    if (!hasAccess) {
      throw new AppError('FORBIDDEN', 'Access denied to this farm')
    }

    // Perform operation
    return await createSupply(db, data)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error('Unexpected error:', error)
    throw new AppError('INTERNAL_ERROR', 'Failed to complete operation')
  }
})
```

**Service Layer**:

```typescript
// Return null for success, error message for failure
export function validateSupplyData(data: CreateSupplyInput): string | null {
  if (data.itemName.trim().length === 0) {
    return 'Item name cannot be empty'
  }
  // ... more validations
  return null
}
```

**Repository Layer**:

```typescript
// Let database errors propagate up
// Use executeTakeFirstOrThrow() for operations that must succeed
export async function createSupply(
  db: Kysely<Database>,
  data: CreateSupplyInput,
) {
  const result = await db
    .insertInto('supplies_inventory')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow() // Throws if insert fails

  return result.id
}
```

### Client-Side Error Handling

```typescript
// In React components
const createSupply = useMutation({
  mutationFn: (data: CreateSupplyInput) => createSuppliesInventoryFn({ data }),
  onError: (error) => {
    if (error.message.includes('VALIDATION_ERROR')) {
      toast.error('Invalid input: ' + error.message)
    } else if (error.message.includes('FORBIDDEN')) {
      toast.error('You do not have permission to perform this action')
    } else {
      toast.error('Failed to create supply. Please try again.')
    }
  },
  onSuccess: () => {
    toast.success('Supply created successfully')
    queryClient.invalidateQueries({ queryKey: ['supplies'] })
  },
})
```

## Testing Strategy

### Dual Testing Approach

The Supplies Inventory feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and error conditions

- Test specific validation scenarios (empty name, negative values)
- Test edge cases (zero quantity, null cost, expiry exactly 30 days away)
- Test error handling (not found, forbidden, insufficient stock)
- Test UI component rendering and interactions

**Property-Based Tests**: Verify universal properties across all inputs

- Test arithmetic invariants (stock transactions preserve quantity calculations)
- Test validation completeness (all invalid inputs are rejected)
- Test authorization (users can only access their farms' supplies)
- Test computed properties (low stock, expiring, expired flags)
- Test aggregations (total inventory value)

### Property-Based Testing Configuration

**Library**: fast-check (already used in the project)

**Configuration**:

```typescript
import * as fc from 'fast-check'

// Minimum 100 iterations per property test
fc.assert(
  fc.property(
    // ... arbitraries
    (data) => {
      // ... test logic
    },
  ),
  { numRuns: 100 },
)
```

**Test Tags**: Each property test must reference its design document property

```typescript
describe('Supplies Inventory Properties', () => {
  it('Property 1: Supply Creation Stores All Fields - Feature: supplies-inventory', () => {
    // Test implementation
  })

  it('Property 2: Input Validation Rejects Invalid Data - Feature: supplies-inventory', () => {
    // Test implementation
  })

  // ... more property tests
})
```

### Test File Organization

```
tests/
├── features/
│   └── inventory/
│       ├── supplies-service.test.ts           # Unit tests for service layer
│       ├── supplies-service.property.test.ts  # Property tests for service layer
│       ├── supplies-repository.integration.test.ts  # Integration tests for repository
│       └── supplies-validation.test.ts        # Unit tests for validation edge cases
```

### Arbitraries for Property Tests

```typescript
// Generate valid supply categories
const categoryArb = fc.constantFrom(
  'disinfectant',
  'bedding',
  'chemical',
  'pest_control',
  'fuel',
  'packaging',
)

// Generate valid units
const unitArb = fc.constantFrom('kg', 'liters', 'pieces', 'bags')

// Generate valid supply data
const validSupplyArb = fc.record({
  farmId: fc.uuid(),
  itemName: fc.string({ minLength: 1, maxLength: 200 }),
  category: categoryArb,
  quantityKg: fc.double({ min: 0, max: 10000, noNaN: true }),
  unit: unitArb,
  minThresholdKg: fc.double({ min: 0, max: 1000, noNaN: true }),
  costPerUnit: fc.option(fc.double({ min: 0, max: 1000, noNaN: true })),
  supplierId: fc.option(fc.uuid()),
  lastRestocked: fc.option(fc.date()),
  expiryDate: fc.option(fc.date({ min: new Date(), noInvalidDate: true })),
  notes: fc.option(fc.string({ maxLength: 500 })),
})

// Generate invalid supply data (for validation tests)
const invalidSupplyArb = fc.oneof(
  // Empty name
  fc.record({ ...validSupplyArb, itemName: fc.constant('') }),
  // Negative quantity
  fc.record({
    ...validSupplyArb,
    quantityKg: fc.double({ max: -0.01, noNaN: true }),
  }),
  // Negative threshold
  fc.record({
    ...validSupplyArb,
    minThresholdKg: fc.double({ max: -0.01, noNaN: true }),
  }),
  // Negative cost
  fc.record({
    ...validSupplyArb,
    costPerUnit: fc.double({ max: -0.01, noNaN: true }),
  }),
  // Invalid category
  fc.record({ ...validSupplyArb, category: fc.string() }),
  // Invalid unit
  fc.record({ ...validSupplyArb, unit: fc.string() }),
  // Past expiry date
  fc.record({
    ...validSupplyArb,
    expiryDate: fc.date({ max: new Date(Date.now() - 86400000) }),
  }),
)
```

### Integration Test Patterns

Integration tests should use the test database helpers:

```typescript
import {
  getTestDb,
  truncateAllTables,
  seedTestUser,
  seedTestFarm,
  closeTestDb,
} from '../../../helpers/db-integration'

describe('Supplies Repository Integration', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  it('should create supply with all fields', async () => {
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    const { farmId } = await seedTestFarm(userId)

    const db = getTestDb()
    const supplyId = await createSupply(db, {
      farmId,
      itemName: 'Test Disinfectant',
      category: 'disinfectant',
      quantityKg: 50,
      unit: 'liters',
      minThresholdKg: 10,
      costPerUnit: 25.5,
    })

    const supply = await getSupplyById(db, supplyId)
    expect(supply).toBeDefined()
    expect(supply?.itemName).toBe('Test Disinfectant')
    expect(supply?.quantityKg).toBe(50)
  })

  it('should enforce non-negative quantity constraint', async () => {
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    const { farmId } = await seedTestFarm(userId)

    const db = getTestDb()

    await expect(
      createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'bedding',
        quantityKg: -10, // Invalid
        unit: 'kg',
        minThresholdKg: 5,
      }),
    ).rejects.toThrow() // Database constraint violation
  })
})
```

### Test Coverage Goals

- **Service Layer**: 100% coverage (pure functions, easy to test)
- **Repository Layer**: 90%+ coverage (integration tests)
- **Server Functions**: 85%+ coverage (auth, validation, orchestration)
- **UI Components**: 80%+ coverage (user interactions, rendering)

### Running Tests

```bash
# Run unit and property tests (fast, no database)
bun run test

# Run integration tests (requires DATABASE_URL_TEST)
bun run test:integration

# Run all tests
bun run test:all

# Run specific test file
bun run test tests/features/inventory/supplies-service.property.test.ts

# Run with coverage
bun run test:coverage
```
