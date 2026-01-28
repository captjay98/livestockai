# Design Document: User Management System

## Overview

This design covers implementing user management using Better Auth's Admin plugin and enhancing the existing `user_farms` table with per-farm roles. The system follows a single-person-per-farm model where each user typically owns one farm, with admins able to assign users to additional farms as needed.

## Architecture

### Plugin Integration

```
┌─────────────────────────────────────────────────────────┐
│                    Better Auth                          │
├─────────────────────────────────────────────────────────┤
│  Core Auth          │  Admin Plugin                     │
│  - Sign in/out      │  - createUser()                   │
│  - Sessions         │  - banUser() / unbanUser()        │
│  - Password hash    │  - setUserPassword()              │
│                     │  - removeUser()                   │
│                     │  - listUsers()                    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Database                              │
├─────────────────────────────────────────────────────────┤
│  users (enhanced)   │  user_farms (enhanced)            │
│  + banned           │  + role (owner/manager/viewer)    │
│  + banReason        │                                   │
│  + banExpires       │                                   │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

```
Admin UI → Server Function → Admin Plugin API → Database
                ↓
         Permission Check (isAdmin)
```

## Components and Interfaces

### Auth Configuration Updates

```typescript
// app/lib/auth/config.ts
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'

export const auth = betterAuth({
    // ... existing config
    plugins: [
        admin({
            defaultRole: 'user',
            adminRoles: ['admin'],
        }),
    ],
    user: {
        additionalFields: {
            banned: { type: 'boolean', defaultValue: false },
            banReason: { type: 'string', required: false },
            banExpires: { type: 'date', required: false },
        },
    },
})
```

### Auth Client Updates

```typescript
// app/lib/auth/client.ts
import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
    plugins: [adminClient()],
})

export const { admin } = authClient
```

### Server Functions

```typescript
// app/lib/users/server.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// List all users (admin only)
export const listUsers = createServerFn({ method: 'GET' }).handler(async () => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('../db')
    return db
        .selectFrom('users')
        .select([
            'id',
            'name',
            'email',
            'role',
            'banned',
            'banReason',
            'createdAt',
        ])
        .orderBy('createdAt', 'desc')
        .execute()
})

// Create user (admin only)
export const createUser = createServerFn({ method: 'POST' })
    .validator(
        z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string().min(1),
            role: z.enum(['user', 'admin']).default('user'),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { auth } = await import('../auth/config')
        return auth.api.createUser({
            body: {
                email: data.email,
                password: data.password,
                name: data.name,
                role: data.role,
            },
        })
    })

// Ban user (admin only)
export const banUser = createServerFn({ method: 'POST' })
    .validator(
        z.object({
            userId: z.string().uuid(),
            reason: z.string().optional(),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { auth } = await import('../auth/config')
        return auth.api.banUser({
            body: { userId: data.userId, banReason: data.reason },
        })
    })

// Unban user (admin only)
export const unbanUser = createServerFn({ method: 'POST' })
    .validator(z.object({ userId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { auth } = await import('../auth/config')
        return auth.api.unbanUser({ body: { userId: data.userId } })
    })
```

### Farm Role Management

```typescript
// app/lib/farms/server.ts (additions)

// Assign user to farm with role
export const assignUserToFarm = createServerFn({ method: 'POST' })
    .validator(
        z.object({
            userId: z.string().uuid(),
            farmId: z.string().uuid(),
            role: z.enum(['owner', 'manager', 'viewer']),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { db } = await import('../db')
        await db
            .insertInto('user_farms')
            .values({
                userId: data.userId,
                farmId: data.farmId,
                role: data.role,
            })
            .onConflict((oc) =>
                oc
                    .columns(['userId', 'farmId'])
                    .doUpdateSet({ role: data.role }),
            )
            .execute()
    })

// Remove user from farm (with owner protection)
export const removeUserFromFarm = createServerFn({ method: 'POST' })
    .validator(
        z.object({
            userId: z.string().uuid(),
            farmId: z.string().uuid(),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { db } = await import('../db')

        // Check if this is the last owner
        const owners = await db
            .selectFrom('user_farms')
            .select(['userId'])
            .where('farmId', '=', data.farmId)
            .where('role', '=', 'owner')
            .execute()

        const isLastOwner =
            owners.length === 1 && owners[0].userId === data.userId
        if (isLastOwner) {
            throw new Error('Cannot remove the last owner from a farm')
        }

        await db
            .deleteFrom('user_farms')
            .where('userId', '=', data.userId)
            .where('farmId', '=', data.farmId)
            .execute()
    })
```

## Data Models

### Users Table (Enhanced)

```sql
ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN "banReason" TEXT;
ALTER TABLE users ADD COLUMN "banExpires" TIMESTAMP;
```

### User Farms Table (Enhanced)

```sql
ALTER TABLE user_farms ADD COLUMN role VARCHAR(20) DEFAULT 'owner';
ALTER TABLE user_farms ADD CONSTRAINT user_farms_role_check
  CHECK (role IN ('owner', 'manager', 'viewer'));

-- Update existing records
UPDATE user_farms SET role = 'owner' WHERE role IS NULL;
```

### TypeScript Types

```typescript
// app/lib/db/types.ts (updates)

export interface UserTable {
    id: Generated<string>
    email: string
    password: string | null
    name: string
    role: 'admin' | 'user' // Changed from 'admin' | 'staff'
    emailVerified: Generated<boolean>
    image: string | null
    banned: Generated<boolean>
    banReason: string | null
    banExpires: Date | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

export interface UserFarmTable {
    userId: string
    farmId: string
    role: 'owner' | 'manager' | 'viewer'
}

export type FarmRole = 'owner' | 'manager' | 'viewer'
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do._

### Property 1: User Creation Preserves Data

_For any_ valid user creation request with email, password, and name, creating the user and then retrieving them should return the same email and name.

**Validates: Requirements 1.2**

### Property 2: Ban/Unban Round-Trip

_For any_ user, banning and then unbanning them should restore their ability to log in (banned = false).

**Validates: Requirements 1.4, 1.5**

### Property 3: Farm Role Assignment Persistence

_For any_ user and farm, assigning a role and then querying the assignment should return the same role.

**Validates: Requirements 2.3**

### Property 4: Last Owner Protection

_For any_ farm with exactly one owner, attempting to remove that owner should fail and the owner should remain assigned.

**Validates: Requirements 2.4, 4.5**

### Property 5: New User Has No Farms

_For any_ newly created user, querying their farm assignments should return an empty list.

**Validates: Requirements 6.1**

### Property 6: Farm Creator Becomes Owner

_For any_ user creating a farm, after creation they should have 'owner' role for that farm.

**Validates: Requirements 2.2**

## Error Handling

| Error Condition                    | Response                     |
| ---------------------------------- | ---------------------------- |
| Non-admin attempts admin operation | 403 Forbidden                |
| Create user with existing email    | 409 Conflict                 |
| Ban already banned user            | 400 Bad Request              |
| Remove last owner from farm        | 400 Bad Request with message |
| Invalid role value                 | 400 Bad Request              |

## Testing Strategy

### Unit Tests

- Permission checking utilities
- Role validation logic
- Farm assignment logic
- Onboarding state management

### Property-Based Tests (fast-check)

- User creation data preservation
- Ban/unban round-trip
- Role assignment persistence
- Last owner protection

### Integration Tests

- Admin plugin API calls
- Database constraint enforcement
- Session handling for banned users
- Onboarding flow completion

### Test Configuration

- Minimum 100 iterations per property test
- Use fast-check for property-based testing
- Tag format: **Feature: user-management, Property N: description**

## Onboarding Flow Design

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ONBOARDING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ Welcome  │ → │  Create  │ → │  Enable  │ → │  Create  │     │
│  │  Screen  │   │   Farm   │   │ Modules  │   │Structure │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│       ↓              ↓              ↓              ↓            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │  Create  │ → │  Config  │ → │ Feature  │ → │ Complete │     │
│  │  Batch   │   │  Prefs   │   │   Tour   │   │          │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                                 │
│  [Skip] available on each step                                  │
│  Progress bar shows completion                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step Details

| Step                | Purpose                | Key Elements                          |
| ------------------- | ---------------------- | ------------------------------------- |
| 1. Welcome          | Introduce the app      | Benefits, what it does, "Get Started" |
| 2. Create Farm      | Set up their farm      | Name, location, type with tooltips    |
| 3. Enable Modules   | Choose livestock types | Poultry, Fish, Cattle, etc.           |
| 4. Create Structure | First house/pond/pen   | Explain hierarchy                     |
| 5. Create Batch     | First livestock batch  | Explain tracking concepts             |
| 6. Preferences      | Customize experience   | Currency, date, weight units          |
| 7. Feature Tour     | Learn the UI           | Spotlight key areas                   |
| 8. Complete         | Celebrate success      | Summary, go to dashboard              |

### Admin-Added User Flow

```
Welcome → Feature Tour → Complete
(Skip farm/structure/batch creation since they already have access)
```

### State Management

```typescript
interface OnboardingState {
    currentStep: number
    completedSteps: number[]
    skippedSteps: number[]
    farmId?: string // Created in step 2
    structureId?: string // Created in step 4
    batchId?: string // Created in step 5
    isComplete: boolean
}
```

### Persistence

- Store in `user_settings` table (new column: `onboardingState`)
- Also cache in localStorage for quick access
- Resume from last incomplete step on return
