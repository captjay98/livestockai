# OpenLivestock Coding Standards

## Server Functions

All database operations MUST use TanStack Start server functions with dynamic imports:

```typescript
// ✅ Correct pattern
export const getData = createServerFn({ method: 'GET' })
  .validator(schema)
  .handler(async ({ data }) => {
    const { db } = await import('../db')
    return db.selectFrom('table').execute()
  })

// ❌ Never do this - breaks Cloudflare Workers
import { db } from '../db'
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  return db.selectFrom('table').execute()
})
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

Always use the currency utility for Nigerian Naira:

```typescript
import { formatCurrency } from '~/lib/currency'

// Displays: ₦1,234,567.89
formatCurrency(1234567.89)
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
