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

1. **Server Functions**: All database operations use TanStack Start's `createServerFn()`:

   ```typescript
   // app/features/batches/server.ts
   export const getBatches = createServerFn({ method: 'GET' })
     .validator(z.object({ farmId: z.string().uuid() }))
     .handler(async ({ data }) => {
       const { db } = await import('~/lib/db')
       return db
         .selectFrom('batches')
         .where('farmId', '=', data.farmId)
         .execute()
     })
   ```

2. **Dynamic Imports**: Database imports MUST be dynamic inside server functions to work with Cloudflare Workers:

   ```typescript
   // ✅ Correct
   const { db } = await import('../db')

   // ❌ Wrong - will break on Cloudflare
   import { db } from '../db'
   ```

3. **Type-Safe Queries**: Use Kysely's type-safe query builder:
   ```typescript
   // Types are inferred from app/lib/db/types.ts
   const batches = await db
     .selectFrom('batches')
     .leftJoin('farms', 'farms.id', 'batches.farmId')
     .select(['batches.id', 'batches.batchName', 'farms.name as farmName'])
     .execute()
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
3. **Server functions**: Create in `app/features/{feature}/server.ts`
4. **UI components**: Add to `app/components/`
5. **Routes**: Add to `app/routes/_auth/{feature}/`

### Adding a New Server Function

```typescript
// app/features/myfeature/server.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const myFunction = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      // Define input schema
    }),
  )
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
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
# Run all tests
bun test

# Run specific test file
bun test tests/features/batches/batches.property.test.ts

# Run with coverage
bun test --coverage
```

### Test Patterns

- **Property tests**: Use `fast-check` for property-based testing
- **Unit tests**: Use `vitest` for unit tests
- **Component tests**: Use `@testing-library/react`

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

Ensure you're using dynamic imports for database in server functions:

```typescript
const { db } = await import('../db')
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
bun test                   # Run tests
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
