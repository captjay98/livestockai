# Design Document: Admin Data Management & Permission Enforcement

## Overview

This design covers two related features:

1. **Admin GUI for Reference Data** - UI for managing growth standards and market prices
2. **Permission Enforcement** - Actually enforcing farm-level roles (owner/manager/viewer) in server functions

Currently, growth standards and market prices can only be modified via database seeding, and the permission utilities in `app/lib/auth/utils.ts` exist but are never used.

## Architecture

### Admin Data Management

```
┌─────────────────────────────────────────────────────────┐
│                   Settings Navigation                    │
├─────────────────────────────────────────────────────────┤
│  Regional │ Modules │ Users │ Audit │ Growth │ Prices  │
│                                      (admin) (admin)    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│              Admin Data Pages                           │
├─────────────────────────────────────────────────────────┤
│  /settings/growth-standards                             │
│  - Species selector                                     │
│  - Day/Weight table (editable)                          │
│  - Growth curve chart                                   │
├─────────────────────────────────────────────────────────┤
│  /settings/market-prices                                │
│  - Species grouping                                     │
│  - Size/Price table (editable)                          │
│  - Add/Delete entries                                   │
└─────────────────────────────────────────────────────────┘
```

### Permission Enforcement Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│ Server Function │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ requireAuth() - Get session         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ hasPermission(userId, farmId, perm) │
│ - Check if admin (bypass)           │
│ - Get user's farm role              │
│ - Check role has permission         │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Allowed   Denied
    │         │
    ▼         ▼
 Continue  Throw PermissionError
```

## Components and Interfaces

### New Routes

```typescript
// app/routes/_auth.settings.growth-standards.tsx
export const Route = createFileRoute('/_auth/settings/growth-standards')({
  loader: async ({ context }) => {
    // Admin check
    const session = context.session
    if (session?.user.role !== 'admin') {
      throw redirect({ to: '/settings' })
    }
    return getGrowthStandards()
  },
  component: GrowthStandardsPage,
})

// app/routes/_auth.settings.market-prices.tsx
export const Route = createFileRoute('/_auth/settings/market-prices')({
  loader: async ({ context }) => {
    // Admin check
    const session = context.session
    if (session?.user.role !== 'admin') {
      throw redirect({ to: '/settings' })
    }
    return getMarketPrices()
  },
  component: MarketPricesPage,
})
```

### Server Functions for Reference Data

```typescript
// app/lib/reference-data/server.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Get all growth standards
export const getGrowthStandards = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('../db')
    return db
      .selectFrom('growth_standards')
      .selectAll()
      .orderBy('species', 'asc')
      .orderBy('day', 'asc')
      .execute()
  },
)

// Update growth standard entry
export const updateGrowthStandard = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      expectedWeightG: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('../db')
    await db
      .updateTable('growth_standards')
      .set({ expected_weight_g: data.expectedWeightG })
      .where('id', '=', data.id)
      .execute()
  })

// Add growth standard entry
export const addGrowthStandard = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      species: z.string().min(1),
      day: z.number().int().positive(),
      expectedWeightG: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('../db')
    return db
      .insertInto('growth_standards')
      .values({
        species: data.species,
        day: data.day,
        expected_weight_g: data.expectedWeightG,
      })
      .returning('id')
      .executeTakeFirstOrThrow()
  })

// Delete growth standard entry
export const deleteGrowthStandard = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('../db')
    await db.deleteFrom('growth_standards').where('id', '=', data.id).execute()
  })

// Similar functions for market_prices...
```

### Permission Middleware

```typescript
// app/lib/auth/permissions.ts
import type { Permission } from './utils'

export class PermissionError extends Error {
  public statusCode = 403
  public permission: Permission

  constructor(permission: Permission, message?: string) {
    super(message || `Permission denied: ${permission} required`)
    this.permission = permission
    this.name = 'PermissionError'
  }
}

/**
 * Require a specific permission for a farm operation
 * Throws PermissionError if denied
 */
export async function requirePermission(
  userId: string,
  farmId: string,
  permission: Permission,
): Promise<void> {
  const { hasPermission } = await import('./utils')

  const allowed = await hasPermission(userId, farmId, permission)
  if (!allowed) {
    throw new PermissionError(permission)
  }
}

/**
 * Require write access to a farm (owner or manager)
 */
export async function requireWriteAccess(
  userId: string,
  farmId: string,
): Promise<void> {
  return requirePermission(userId, farmId, 'batch:create')
}

/**
 * Require delete access to a farm (owner only)
 */
export async function requireDeleteAccess(
  userId: string,
  farmId: string,
): Promise<void> {
  return requirePermission(userId, farmId, 'batch:delete')
}
```

### Updated Batch Server Functions

```typescript
// app/lib/batches/server.ts (updated)

export const createBatch = createServerFn({ method: 'POST' })
  .validator(createBatchSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { requirePermission } = await import('../auth/permissions')

    const session = await requireAuth()
    await requirePermission(session.user.id, data.farmId, 'batch:create')

    // ... existing implementation
  })

export const updateBatch = createServerFn({ method: 'POST' })
  .validator(updateBatchSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { requirePermission } = await import('../auth/permissions')
    const { db } = await import('../db')

    const session = await requireAuth()

    // Get batch to find farmId
    const batch = await db
      .selectFrom('batches')
      .select(['farmId'])
      .where('id', '=', data.id)
      .executeTakeFirst()

    if (!batch) throw new Error('Batch not found')

    await requirePermission(session.user.id, batch.farmId, 'batch:update')

    // ... existing implementation
  })

export const deleteBatch = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { requirePermission } = await import('../auth/permissions')
    const { db } = await import('../db')

    const session = await requireAuth()

    // Get batch to find farmId
    const batch = await db
      .selectFrom('batches')
      .select(['farmId'])
      .where('id', '=', data.id)
      .executeTakeFirst()

    if (!batch) throw new Error('Batch not found')

    await requirePermission(session.user.id, batch.farmId, 'batch:delete')

    // ... existing implementation
  })
```

### Client-Side Permission Hook

```typescript
// app/hooks/use-permissions.ts
import { useQuery } from '@tanstack/react-query'
import { getUserPermissionsFn } from '~/lib/auth/server'
import type { Permission } from '~/lib/auth/utils'

export function usePermissions(farmId: string | undefined) {
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', farmId],
    queryFn: () => (farmId ? getUserPermissionsFn({ farmId }) : []),
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const can = (permission: Permission) => permissions.includes(permission)

  return {
    permissions,
    isLoading,
    can,
    canCreateBatch: can('batch:create'),
    canDeleteBatch: can('batch:delete'),
    canCreateFinance: can('finance:create'),
    canDeleteFinance: can('finance:delete'),
    canManageMembers: can('member:invite'),
  }
}
```

## Data Models

### Existing Tables (No Changes)

The `growth_standards` and `market_prices` tables already exist with the correct schema.

### TypeScript Types

```typescript
// app/lib/reference-data/types.ts
export interface GrowthStandard {
  id: string
  species: string
  day: number
  expectedWeightG: number
}

export interface MarketPrice {
  id: string
  species: string
  sizeCategory: string
  pricePerKg: number
  updatedAt: Date
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do._

### Property 1: Admin Page Access Control

_For any_ user without the 'admin' global role, attempting to access `/settings/growth-standards` or `/settings/market-prices` should result in a redirect to `/settings`.

**Validates: Requirements 1.1, 2.1**

### Property 2: Positive Number Validation

_For any_ weight or price value that is zero, negative, or non-numeric, the validation should reject the input and prevent database update.

**Validates: Requirements 1.4, 2.3**

### Property 3: Reference Data Round-Trip

_For any_ valid growth standard or market price update, saving the value and then fetching it should return an equivalent value.

**Validates: Requirements 1.5, 2.4**

### Property 4: Deletion Removes Entry

_For any_ growth standard or market price entry that is deleted, subsequent queries should not return that entry.

**Validates: Requirements 1.7, 2.6**

### Property 5: Day Entry Ordering

_For any_ species in growth standards, the entries should always be ordered by day number in ascending order.

**Validates: Requirements 1.6**

### Property 6: Viewer Role Blocks Writes

_For any_ user with 'viewer' farm role, all create, update, and delete operations on batches, sales, expenses, and farm settings should be rejected with a 403 error.

**Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.3**

### Property 7: Manager Role Blocks Deletes

_For any_ user with 'manager' farm role, all delete operations on batches, sales, expenses, and member management operations should be rejected with a 403 error.

**Validates: Requirements 3.4, 4.3, 4.4, 5.2, 5.4**

### Property 8: Owner Role Full Access

_For any_ user with 'owner' farm role, all operations (create, read, update, delete) on batches, sales, expenses, and farm settings should succeed.

**Validates: Requirements 3.5, 4.5, 5.5**

### Property 9: Manager Role Create/Update Access

_For any_ user with 'manager' farm role, create and update operations on batches, sales, expenses, and farm details should succeed.

**Validates: Requirements 3.6, 4.6, 5.6**

### Property 10: Permission Error Format

_For any_ permission check failure, the response should include a 403 status code and a message indicating the required permission.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 11: Required Fields Validation

_For any_ new market price entry missing species, size category, or price, the creation should be rejected.

**Validates: Requirements 2.5**

## Error Handling

| Error Condition                   | Response                              |
| --------------------------------- | ------------------------------------- |
| Non-admin accesses admin page     | Redirect to /settings                 |
| Invalid weight/price value        | 400 Bad Request with validation error |
| Permission denied                 | 403 Forbidden with PermissionError    |
| Entry not found for update/delete | 404 Not Found                         |
| Duplicate day entry for species   | 409 Conflict                          |

## Testing Strategy

### Unit Tests

- Permission checking utilities
- Validation functions for weights and prices
- PermissionError class behavior

### Property-Based Tests (fast-check)

- Admin access control (Property 1)
- Positive number validation (Property 2)
- Reference data round-trip (Property 3)
- Viewer role blocks writes (Property 6)
- Manager role blocks deletes (Property 7)
- Owner role full access (Property 8)
- Permission error format (Property 10)

### Integration Tests

- Full CRUD flow for growth standards
- Full CRUD flow for market prices
- Permission enforcement across all server functions
- UI permission awareness (buttons hidden/disabled)

### Test Configuration

- Minimum 100 iterations per property test
- Use fast-check for property-based testing
- Tag format: **Feature: admin-data-management, Property N: description**

## UI Components

### Settings Navigation Update

Add two new admin-only nav items to `settingsNav` in `_auth.settings.tsx`:

```typescript
const settingsNav = [
  { name: 'Regional', href: '/settings', icon: Settings, adminOnly: false },
  {
    name: 'Modules',
    href: '/settings/modules',
    icon: Boxes,
    adminOnly: false,
  },
  { name: 'Users', href: '/settings/users', icon: Users, adminOnly: true },
  {
    name: 'Audit Log',
    href: '/settings/audit',
    icon: ClipboardList,
    adminOnly: true,
  },
  {
    name: 'Growth Standards',
    href: '/settings/growth-standards',
    icon: TrendingUp,
    adminOnly: true,
  },
  {
    name: 'Market Prices',
    href: '/settings/market-prices',
    icon: DollarSign,
    adminOnly: true,
  },
]
```

### Growth Standards Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Growth Standards                              [+ Add]   │
├─────────────────────────────────────────────────────────┤
│ Species: [Broiler ▼] [Catfish] [Layer] [Tilapia]       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐  ┌────────────────────────────┐│
│ │ Day │ Weight (g)    │  │     Growth Curve Chart     ││
│ ├─────┼───────────────┤  │                            ││
│ │  1  │ [42]     [🗑] │  │         ___________        ││
│ │  7  │ [180]    [🗑] │  │       /             \      ││
│ │ 14  │ [480]    [🗑] │  │     /                      ││
│ │ 21  │ [900]    [🗑] │  │   /                        ││
│ │ 28  │ [1400]   [🗑] │  │ /                          ││
│ │ ... │ ...           │  │                            ││
│ └─────┴───────────────┘  └────────────────────────────┘│
│                                                         │
│                                    [Save Changes]       │
└─────────────────────────────────────────────────────────┘
```

### Market Prices Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Market Prices                                 [+ Add]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐│
│ │ Broiler                                             ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Size Category │ Price/kg  │ Updated    │           ││
│ │ Small (<1.5kg)│ [₦2,500]  │ Jan 10     │ [🗑]      ││
│ │ Medium        │ [₦2,800]  │ Jan 10     │ [🗑]      ││
│ │ Large (>2.5kg)│ [₦3,200]  │ Jan 10     │ [🗑]      ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────┐│
│ │ Catfish                                             ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Size Category │ Price/kg  │ Updated    │           ││
│ │ Table Size    │ [₦1,800]  │ Jan 8      │ [🗑]      ││
│ │ Jumbo         │ [₦2,200]  │ Jan 8      │ [🗑]      ││
│ └─────────────────────────────────────────────────────┘│
│                                    [Save Changes]       │
└─────────────────────────────────────────────────────────┘
```

## Migration Plan

### Phase 1: Permission Infrastructure

1. Create `PermissionError` class
2. Create `requirePermission` helper
3. Add `getUserPermissionsFn` server function

### Phase 2: Enforce Permissions

1. Update batch server functions
2. Update sales server functions
3. Update expense server functions
4. Update farm server functions

### Phase 3: Admin Data UI

1. Create reference data server functions
2. Create Growth Standards page
3. Create Market Prices page
4. Update settings navigation

### Phase 4: UI Permission Awareness

1. Create `usePermissions` hook
2. Update batch list/forms to use permissions
3. Update sales/expense forms to use permissions
4. Update farm settings to use permissions
