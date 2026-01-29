# LivestockAI Coding Standards

## Three-Layer Architecture

Features follow a Server → Service → Repository pattern:

```
app/features/batches/
├── server.ts      # Auth, validation, orchestration (createServerFn)
├── service.ts     # Pure business logic (calculations, validations)
├── repository.ts  # Database operations (CRUD, queries)
└── types.ts       # TypeScript interfaces
```

**Layer Responsibilities:**

| Layer          | Responsibility                                   | Example                                 |
| -------------- | ------------------------------------------------ | --------------------------------------- |
| **Server**     | Auth middleware, input validation, orchestration | `createBatchFn`                         |
| **Service**    | Business logic, calculations, validations        | `calculateFCR()`, `validateBatchData()` |
| **Repository** | Database queries, CRUD operations                | `insertBatch()`, `getBatchById()`       |

## Server Functions

All server functions MUST use `getDb()` with dynamic imports for Cloudflare Workers compatibility:

```typescript
// ✅ Correct pattern - server.ts
export const createBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('./server-middleware')
    const session = await requireAuth()

    // Use service for business logic
    const validationError = validateBatchData(data)
    if (validationError) throw new AppError('VALIDATION_ERROR')

    // Use repository for database - MUST use getDb()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    return insertBatch(db, data)
  })

// ❌ Never do this - breaks Cloudflare Workers
import { db } from '~/lib/db'

// ❌ Also wrong - old pattern
const { db } = await import('~/lib/db')
```

**Why `getDb()`?** Cloudflare Workers doesn't support `process.env`. The `getDb()` function handles environment detection and uses the appropriate env source.

## Service Layer

Pure functions with no side effects - easy to test:

```typescript
// service.ts - Pure business logic
export function calculateFCR(
  totalFeedKg: number,
  totalWeightGain: number,
): number {
  if (totalWeightGain <= 0) return 0
  return Number((totalFeedKg / totalWeightGain).toFixed(2))
}

export function validateBatchData(data: CreateBatchData): string | null {
  if (data.initialQuantity <= 0) return 'Initial quantity must be positive'
  if (data.costPerUnit < 0) return 'Cost cannot be negative'
  return null
}
```

## Repository Layer

Database operations only - no business logic:

```typescript
// repository.ts - Database operations
export async function insertBatch(
  db: Kysely<Database>,
  data: BatchInsert,
): Promise<string> {
  const result = await db
    .insertInto('batches')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

export async function getBatchById(db: Kysely<Database>, id: string) {
  return db
    .selectFrom('batches')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}
```

## Database Queries

Use Kysely's type-safe query builder:

```typescript
// Prefer explicit column selection
const batches = await db
  .selectFrom('batches')
  .select(['id', 'batchName', 'status'])
  .where('farmId', '=', farmId)
  .execute()

// Use joins for related data
const batchesWithFarm = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.batchName', 'farms.name as farmName'])
  .execute()
```

## Component Patterns

Use the established UI component library in `app/components/ui/`:

```typescript
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Dialog, DialogContent, DialogHeader } from '~/components/ui/dialog'
```

## Currency Formatting

Always use the currency utility for user's preferred currency:

```typescript
import { useFormatCurrency } from '~/features/settings'

// In components
const { format: formatCurrency, symbol } = useFormatCurrency()

// Displays based on user settings: $1,234.56 or ₦1,234.56
formatCurrency(1234.56)
```

## Date Handling

Use date-fns for date operations:

```typescript
import { format, addDays, differenceInDays } from 'date-fns'

format(new Date(), 'MMM d, yyyy') // "Jan 15, 2025"
```

## Error Handling

Server functions should return structured errors:

```typescript
.handler(async ({ data }) => {
  try {
    // ... operation
  } catch (error) {
    console.error('Operation failed:', error)
    throw new Error('Failed to complete operation')
  }
})
```

## Testing

Write property-based tests for business logic:

```typescript
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

describe('calculateProfit', () => {
  it('should always return revenue minus costs', () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat(), (revenue, costs) => {
        expect(calculateProfit(revenue, costs)).toBe(revenue - costs)
      }),
    )
  })
})
```
