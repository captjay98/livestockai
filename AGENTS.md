# AI Agent Guide for OpenLivestock Manager

This document helps AI coding assistants (Claude, GPT, Kiro, Cursor, etc.) understand and work with this codebase effectively.

---

## Project Overview

**OpenLivestock Manager** is a full-stack livestock management application supporting 6 livestock types (poultry, fish, cattle, goats, sheep, bees). It's built with:

- **Frontend**: React 19 + TanStack Router + TanStack Query
- **Backend**: TanStack Start (SSR) + Server Functions
- **Database**: PostgreSQL (Neon serverless) + Kysely ORM
- **Deployment**: Cloudflare Workers

---

## Architecture

### Request Flow

```
Browser → Cloudflare Worker → TanStack Start → Server Functions → Kysely → Neon PostgreSQL
```

### Key Patterns

1. **Three-Layer Architecture**: Features use Server → Service → Repository pattern:

   ```
   app/features/batches/
   ├── server.ts      # Auth, validation, orchestration
   ├── service.ts     # Pure business logic (calculations, validations)
   ├── repository.ts  # Database operations (CRUD, queries)
   └── types.ts       # TypeScript interfaces
   ```

2. **Server Functions**: Orchestrate auth, validation, and call service/repository:

   ```typescript
   // app/features/batches/server.ts
   export const createBatchFn = createServerFn({ method: 'POST' })
     .inputValidator(schema)
     .handler(async ({ data }) => {
       const { requireAuth } = await import('./server-middleware')
       const session = await requireAuth()

       // Service layer for business logic
       const error = validateBatchData(data)
       if (error) throw new AppError('VALIDATION_ERROR')

       // Repository layer for database (use getDb() for Cloudflare Workers)
       const { getDb } = await import('~/lib/db')
       const db = await getDb()
       return insertBatch(db, data)
     })
   ```

3. **Dynamic Imports & Async DB**: Database access MUST use `getDb()` inside server functions for Cloudflare Workers compatibility:

   ```typescript
   // ✅ Correct - works on Cloudflare Workers
   const { getDb } = await import('~/lib/db')
   const db = await getDb()

   // ❌ Wrong - will break on Cloudflare Workers
   import { db } from '~/lib/db'

   // ❌ Also wrong - old pattern, doesn't work
   const { db } = await import('~/lib/db')
   ```

   **Why?** Cloudflare Workers doesn't support `process.env`. Environment variables are only available through the `env` binding from `cloudflare:workers`, and that binding is only accessible during request handling, not at module load time. The `getDb()` function handles this by trying `process.env` first (for Node.js/Bun), then falling back to `cloudflare:workers`.

4. **Service Layer**: Pure functions for business logic (easy to test):

   ```typescript
   // service.ts
   export function calculateFCR(feedKg: number, weightGain: number): number {
     if (weightGain <= 0) return 0
     return Number((feedKg / weightGain).toFixed(2))
   }
   ```

5. **Repository Layer**: Database operations only:
   ```typescript
   // repository.ts
   export async function insertBatch(db: Kysely<Database>, data: BatchInsert) {
     return db
       .insertInto('batches')
       .values(data)
       .returning('id')
       .executeTakeFirstOrThrow()
   }
   ```

---

## Database Schema

The database schema is defined in `app/lib/db/types.ts`. Key tables:

| Table               | Purpose                                 |
| ------------------- | --------------------------------------- |
| `users`             | User accounts (Better Auth)             |
| `user_settings`     | Preferences (currency, units, language) |
| `farms`             | Farm entities                           |
| `farm_modules`      | Enabled livestock types per farm        |
| `batches`           | Livestock batches (all 6 types)         |
| `mortality_records` | Death tracking                          |
| `feed_records`      | Feed consumption                        |
| `weight_samples`    | Growth tracking                         |
| `sales`             | Revenue records                         |
| `expenses`          | Cost tracking                           |
| `invoices`          | Customer invoices                       |
| `notifications`     | In-app alerts                           |
| `audit_logs`        | Activity history                        |

### Migrations

Migrations are in `app/lib/db/migrations/`. To create a new migration:

```bash
# Create migration file manually in app/lib/db/migrations/
# Format: YYYY-MM-DD-NNN-description.ts

# Run migrations
bun run db:migrate

# Rollback
bun run db:rollback
```

---

## MCP Server Configuration

This project supports Model Context Protocol (MCP) for AI agents to interact with the database and Cloudflare infrastructure directly. MCP config is in `.kiro/settings/mcp.json`.

### Available MCP Servers

| Server                     | Purpose                                           | Agent Access                                                          |
| -------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `neon`                     | PostgreSQL database queries and schema inspection | backend-engineer, devops-engineer, data-analyst, livestock-specialist |
| `cloudflare-bindings`      | Manage Workers, KV, R2, D1, Hyperdrive            | devops-engineer                                                       |
| `cloudflare-builds`        | Deployment status and build logs                  | devops-engineer                                                       |
| `cloudflare-observability` | Worker logs and debugging                         | devops-engineer                                                       |
| `cloudflare-docs`          | Cloudflare documentation search                   | devops-engineer                                                       |

**Enhanced Agent Capabilities:**

- **9 agents** now have Neon database access via MCP
- **1 agent** has full Cloudflare infrastructure access
- **All agents** have web search, knowledge bases, and todo lists

Cloudflare MCP servers authenticate via OAuth (no API keys needed).

---

## Common Tasks

### Adding a New Feature

1. **Database changes**: Create migration in `app/lib/db/migrations/`
2. **Update schema types**: Edit `app/lib/db/types.ts`
3. **Repository layer**: Create `app/features/{feature}/repository.ts` for DB operations
4. **Service layer**: Create `app/features/{feature}/service.ts` for business logic
5. **Server functions**: Create `app/features/{feature}/server.ts` to orchestrate
6. **UI components**: Add to `app/components/`
7. **Routes**: Add to `app/routes/_auth/{feature}/`

### Adding a New Server Function

```typescript
// app/features/myfeature/server.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const myFunction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      // Define input schema
    }),
  )
  .handler(async ({ data }) => {
    // Get database connection (works on both Node.js and Cloudflare Workers)
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    // Database operations
  })
```

### Adding a New Route

```typescript
// app/routes/_auth.mypage.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/mypage')({
  component: MyPageComponent,
  loader: async () => {
    // Load data
  },
})

function MyPageComponent() {
  return <div>My Page</div>
}
```

---

## TanStack Router Patterns (Updated Jan 2026)

### Route Loader Pattern

All routes should use **loaders** for data fetching instead of `useEffect` in components. This enables SSR, prefetching, and better loading states.

#### ✅ Correct Pattern - Using Loaders

```typescript
// app/routes/_auth/batches/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getBatchesForFarmFn } from '~/features/batches/server'
import { BatchesSkeleton } from '~/components/batches/batches-skeleton'
import { validateBatchSearch } from '~/features/batches/validation'

export const Route = createFileRoute('/_auth/batches/')({
  // 1. Validate search params
  validateSearch: validateBatchSearch,

  // 2. Define loader dependencies (search params)
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.search,
    status: search.status,
    livestockType: search.livestockType,
  }),

  // 3. Loader function - fetches data on server
  loader: async ({ deps }) => {
    return getBatchesForFarmFn({ data: deps })
  },

  // 4. Loading state component
  pendingComponent: BatchesSkeleton,

  // 5. Error state component
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading batches: {error.message}
    </div>
  ),

  // 6. Main component
  component: BatchesPage,
})

function BatchesPage() {
  // Access loader data with full type safety
  const { paginatedBatches, summary } = Route.useLoaderData()

  return (
    <div>
      <h1>Batches</h1>
      {/* Render data */}
    </div>
  )
}
```

#### ❌ Wrong Pattern - Using useEffect

```typescript
// DON'T DO THIS - Old pattern
function BatchesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Client-side data fetching - no SSR, no prefetching
    getBatchesForFarmFn({ data: {} }).then(setData)
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{/* render */}</div>
}
```

### Server Function Validator Pattern

All server functions MUST use **Zod validators**, not identity functions.

#### ✅ Correct Pattern - Zod Validators

```typescript
// app/features/batches/server.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getBatchesForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
      status: z.string().optional(),
      livestockType: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    // ... implementation
  })
```

#### ❌ Wrong Pattern - Identity Validators

```typescript
// DON'T DO THIS - No runtime validation
export const getBatchesForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string }) => data)
  .handler(async ({ data }) => {
    // ... implementation
  })
```

### Common Zod Patterns

```typescript
// UUID validation
farmId: z.string().uuid()

// Optional UUID
farmId: z.string().uuid().optional()

// Enum validation
status: z.enum(['active', 'depleted', 'sold'])

// Number validation
page: z.number().int().positive()
quantity: z.number().int().positive()
amount: z.number().nonnegative()

// Date validation
date: z.coerce.date()

// String validation
email: z.string().email()
name: z.string().min(1).max(100)

// Nullable/optional fields
notes: z.string().max(500).nullish()
supplierId: z.string().uuid().optional()
```

### Skeleton Component Pattern

Create skeleton components for `pendingComponent` to show loading states:

```typescript
// app/components/batches/batches-skeleton.tsx
import { Skeleton } from '~/components/ui/skeleton'

export function BatchesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>

      {/* Table skeleton */}
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### Router Cache Configuration

Configure router cache for prefetching:

```typescript
// app/router.tsx
export const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 30_000, // Cache prefetched data for 30 seconds
})
```

### Custom Hooks Pattern

After refactoring to loaders, custom hooks should only handle:

- **Mutations** (create, update, delete)
- **Local UI state** (dialogs, filters)
- **NOT data fetching** (use loaders instead)

#### ✅ Correct - Mutations Only

```typescript
// app/features/batches/use-batch-page.ts
export function useBatchPage() {
  const queryClient = useQueryClient()

  // Mutation for creating batch
  const createBatch = useMutation({
    mutationFn: (data: CreateBatchData) =>
      createBatchFn({ data: { batch: data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })

  // Local UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return { createBatch, isDialogOpen, setIsDialogOpen }
}
```

#### ❌ Wrong - Data Fetching in Hook

```typescript
// DON'T DO THIS
export function useBatchPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Data fetching should be in loader
    getBatchesForFarmFn({ data: {} }).then(setData)
  }, [])

  return { data }
}
```

---

### Creating Users Programmatically

**IMPORTANT**: This project uses Better Auth for authentication. Passwords are stored in the `account` table, NOT in the `users` table.

#### Better Auth Table Structure

- **`users` table**: Stores user profile data (name, email, role, etc.) - NO password field
- **`account` table**: Stores authentication credentials (password, providerId, accountId)
- For email/password auth: `providerId='credential'` and `accountId=email`

Reference: [Better Auth Users & Accounts](https://www.better-auth.com/docs/concepts/users-accounts)

#### Correct Way to Create Users

Always use the `createUserWithAuth` helper from `app/lib/db/seeds/helpers.ts`:

```typescript
import { createUserWithAuth } from '~/lib/db/seeds/helpers'
import { db } from '~/lib/db'

// Create a user with authentication
const result = await createUserWithAuth(db, {
  email: 'user@example.com',
  password: 'securepassword',
  name: 'John Doe',
  role: 'user', // or 'admin'
})

// Returns: { userId, email, name, role }
console.log(`Created user: ${result.email}`)
```

#### What This Helper Does

1. Hashes the password using PBKDF2 (100,000 iterations, SHA-256)
2. Creates an entry in the `users` table (profile data only)
3. Creates an entry in the `account` table with:
   - `userId`: Links to the users table
   - `providerId`: Set to `'credential'` for email/password auth
   - `accountId`: Set to the user's email
   - `password`: The hashed password

#### ❌ WRONG - Don't Do This

```typescript
// This will NOT work for authentication!
await db
  .insertInto('users')
  .values({
    email: 'user@example.com',
    password: 'hashedpassword', // ❌ users table has no password field!
    name: 'John Doe',
  })
  .execute()
```

---

## Testing

```bash
# Run unit/property tests (fast, no database)
# IMPORTANT: Use "bun run test" not "bun test" - they are different!
# - "bun run test" uses vitest (respects config)
# - "bun test" uses Bun's built-in runner (ignores vitest config)
bun run test

# Run integration tests (requires DATABASE_URL_TEST)
bun run test:integration

# Run all tests (unit + integration)
bun run test:all

# Run specific test file
bun run test tests/features/batches/batches.property.test.ts

# Run with coverage
bun run test:coverage
```

### Test Types

| Type            | Pattern                 | Database | Purpose                          |
| --------------- | ----------------------- | -------- | -------------------------------- |
| **Property**    | `*.property.test.ts`    | No       | Business logic invariants        |
| **Unit**        | `*.test.ts`             | No       | Utility functions, constants     |
| **Integration** | `*.integration.test.ts` | Yes      | Database operations, constraints |

### Integration Test Setup

Integration tests require a separate test database to avoid affecting development data.

#### 1. Create Test Database in Neon

```bash
# Via Neon Console or CLI
# Create a new database named: openlivestock_test
```

#### 2. Set Environment Variable

```bash
# .env.test or .env
DATABASE_URL_TEST=postgres://user:pass@ep-xxx.region.neon.tech/openlivestock_test?sslmode=require
```

#### 3. Run Migrations on Test Database

```bash
DATABASE_URL=$DATABASE_URL_TEST bun run db:migrate
```

#### 4. Run Integration Tests

```bash
bun test:integration
```

### Integration Test Helpers

Located in `tests/helpers/db-integration.ts`:

```typescript
import {
  getTestDb, // Get test database connection
  truncateAllTables, // Clean slate (respects FK order)
  seedTestUser, // Create user + account + settings
  seedTestFarm, // Create farm + modules + user association
  seedTestBatch, // Create batch with defaults
  closeTestDb, // Cleanup connection
} from '../helpers/db-integration'

// Example test
beforeEach(async () => {
  await truncateAllTables()
})

it('should create batch', async () => {
  const { userId } = await seedTestUser({ email: 'test@example.com' })
  const { farmId } = await seedTestFarm(userId)
  const { batchId } = await seedTestBatch(farmId, { species: 'broiler' })

  const db = getTestDb()
  const batch = await db
    .selectFrom('batches')
    .where('id', '=', batchId)
    .executeTakeFirst()
  expect(batch).toBeDefined()
})
```

### Test Patterns

- **Property tests**: Use `fast-check` for mathematical invariants
- **Unit tests**: Use `vitest` for utility functions
- **Integration tests**: Test actual database operations and constraints

---

## Code Style

### Naming Conventions

| Type             | Convention      | Example               |
| ---------------- | --------------- | --------------------- |
| Files            | kebab-case      | `batch-dialog.tsx`    |
| Components       | PascalCase      | `BatchDialog`         |
| Functions        | camelCase       | `getBatches`          |
| Constants        | SCREAMING_SNAKE | `MAX_BATCH_SIZE`      |
| Database columns | camelCase       | `batchName`, `farmId` |

### Import Order

```typescript
// 1. React/framework imports
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

// 2. Third-party imports
import { format } from 'date-fns'

// 3. Local imports (absolute)
import { Button } from '~/components/ui/button'
import { getBatches } from '~/features/batches/server'

// 4. Types
import type { Batch } from '~/lib/db/types'
```

---

## Troubleshooting

### "Cannot find module" errors

Ensure you're using the async `getDb()` pattern for database in server functions:

```typescript
const { getDb } = await import('~/lib/db')
const db = await getDb()
```

### Database connection issues

1. Check `DATABASE_URL` in `.env`
2. Ensure Neon project is active (not suspended)
3. Check SSL mode: `?sslmode=require`

### Build failures on Cloudflare

1. Check for static imports of Node.js modules
2. Ensure all server-only code is in server functions
3. Check `wrangler.jsonc` compatibility flags

---

## Useful Commands

```bash
# Development
bun dev                    # Start dev server
bun run db:migrate         # Run migrations
bun run db:reset           # Drop all tables and re-migrate
bun run db:seed            # Seed production data (admin + reference data)
bun run db:seed:dev        # Seed full demo data (farms, batches, transactions)

# Quality
bun run test               # Run unit tests (vitest)
bun run lint               # Lint code
bun run check              # Format + lint

# Production
bun build                  # Build for production
bun run deploy             # Deploy to Cloudflare
```

---

## File Reference

| Path                          | Purpose                        |
| ----------------------------- | ------------------------------ |
| `app/lib/db/index.ts`         | Database connection            |
| `app/lib/db/types.ts`         | TypeScript types for tables    |
| `app/lib/db/migrations/`      | Database migrations            |
| `app/features/auth/config.ts` | Better Auth configuration      |
| `app/features/settings/`      | Currency, date, unit utilities |
| `app/features/finance/`       | Financial calculations         |
| `wrangler.jsonc`              | Cloudflare Workers config      |
| `vite.config.ts`              | Vite + PWA configuration       |
| `docs/ARCHITECTURE.md`        | System architecture overview   |

---

## Questions?

- Check existing code patterns in similar modules
- Review the specs in `.kiro/specs/` for feature context
- Look at test files for usage examples

---

## Important: Keep DEVLOG Updated!

As you develop with AI assistance, regularly update `DEVLOG.md` with:

- Features implemented and progress made
- Technical decisions and rationale
- Challenges faced and solutions found
- Kiro/AI features used (specs, prompts, agents)
- Time spent on different tasks

This documentation is valuable for:

- Hackathon submissions
- Onboarding new contributors
- Project history and decision tracking
