# Design Document

## Overview

This design document describes the implementation of Cloudflare Hyperdrive integration for the OpenLivestock codebase. The goal is to enable full transaction support by switching from the `NeonDialect` (HTTP driver) to `PostgresDialect` with the standard `pg` driver, using Hyperdrive for connection pooling in production.

The key insight is that Hyperdrive provides a connection string that can be used with standard PostgreSQL drivers, enabling interactive transactions while maintaining the performance benefits of edge connection pooling.

## Architecture

### Current Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Cloudflare      │────▶│ NeonDialect      │────▶│ Neon PostgreSQL │
│ Worker          │     │ (HTTP, stateless)│     │ Database        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              ❌ No transactions
```

### Target Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Cloudflare      │────▶│ Hyperdrive       │────▶│ PostgresDialect │────▶│ Neon PostgreSQL │
│ Worker          │     │ (Connection Pool)│     │ (pg driver)     │     │ Database        │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └─────────────────┘
                              ✅ Full transaction support
```

### Environment-Specific Behavior

```mermaid
flowchart TD
    A[getDb called] --> B{Runtime Environment?}
    B -->|Cloudflare Workers| C{Hyperdrive binding available?}
    B -->|Node.js/Bun| D[Use DATABASE_URL from process.env]
    C -->|Yes| E[Use Hyperdrive connectionString]
    C -->|No - wrangler dev| F[Use localConnectionString]
    D --> G[Create PostgresDialect with pg Pool]
    E --> G
    F --> G
    G --> H[Return Kysely instance]
```

## Components and Interfaces

### 1. Wrangler Configuration (`wrangler.jsonc`)

The Wrangler configuration needs to be updated to include the Hyperdrive binding:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<hyperdrive-configuration-id>",
      "localConnectionString": "postgresql://user:pass@localhost:5432/dbname",
    },
  ],
}
```

**Key Points:**

- `nodejs_compat` flag is required for the `pg` driver to work
- `binding` name `HYPERDRIVE` will be accessible via `env.HYPERDRIVE`
- `id` is the Hyperdrive configuration ID from Cloudflare dashboard
- `localConnectionString` is used during `wrangler dev` for local development

### 2. Database Module (`app/lib/db/index.ts`)

The database module needs to be refactored to use `PostgresDialect` instead of `NeonDialect`:

```typescript
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

// Type for Cloudflare Workers environment with Hyperdrive
interface CloudflareEnv {
  HYPERDRIVE?: {
    connectionString: string
  }
  DATABASE_URL?: string
}

async function getConnectionString(): Promise<string> {
  // 1. Try process.env first (Node.js/Bun - CLI scripts, migrations, tests)
  if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // 2. Try Cloudflare Workers env binding (production + wrangler dev)
  try {
    const { env } = (await import('cloudflare:workers')) as {
      env: CloudflareEnv
    }

    // Prefer Hyperdrive if available (production)
    if (env.HYPERDRIVE?.connectionString) {
      return env.HYPERDRIVE.connectionString
    }

    // Fall back to DATABASE_URL (wrangler dev with localConnectionString)
    if (env.DATABASE_URL) {
      return env.DATABASE_URL
    }
  } catch {
    // Not in Cloudflare Workers environment
  }

  throw new Error('DATABASE_URL not configured')
}

export async function getDb(): Promise<Kysely<Database>> {
  const connectionString = await getConnectionString()

  // Create a new Pool for each request in Cloudflare Workers
  // This is required because Workers can't maintain persistent connections
  const pool = new Pool({ connectionString })

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  })
}
```

### 3. Environment Variables

| Variable                      | Environment        | Purpose                               |
| ----------------------------- | ------------------ | ------------------------------------- |
| `DATABASE_URL`                | `.dev.vars`        | Direct connection for local dev       |
| `DATABASE_URL`                | Cloudflare Secrets | Fallback for non-Hyperdrive scenarios |
| `HYPERDRIVE.connectionString` | Cloudflare binding | Production connection via Hyperdrive  |

### 4. Cloudflare Hyperdrive Binding Interface

```typescript
// Type definition for Hyperdrive binding
interface HyperdriveBinding {
  connectionString: string
}

// Available in Cloudflare Workers via env
interface Env {
  HYPERDRIVE: HyperdriveBinding
  DATABASE_URL?: string
}
```

## Data Models

No changes to data models are required. The migration is transparent to the application layer.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis, the following properties were identified as testable:

### Property 1: Connection String Resolution

_For any_ environment configuration (Hyperdrive binding present, process.env.DATABASE_URL set, or both), the `getConnectionString()` function returns the correct connection string based on priority: Hyperdrive > process.env.DATABASE_URL.

**Validates: Requirements 2.1, 2.2, 4.1**

### Property 2: Transaction Atomicity

_For any_ sequence of database operations within a transaction where one operation fails, all preceding operations within that transaction are rolled back, leaving the database in its original state.

**Validates: Requirements 3.1, 3.3**

### Property 3: Missing Configuration Error

_For any_ environment where neither Hyperdrive binding nor DATABASE_URL is configured, the `getDb()` function throws an error with a descriptive message containing setup instructions.

**Validates: Requirements 4.4**

### Property 4: Query Compatibility

_For any_ valid Kysely query that worked with `NeonDialect`, the same query produces identical results when executed with `PostgresDialect`.

**Validates: Requirements 5.3**

## Error Handling

### Connection Errors

```typescript
async function getConnectionString(): Promise<string> {
  // ... resolution logic ...

  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
      'For Cloudflare Workers: ensure Hyperdrive is configured in wrangler.jsonc. ' +
      'For local development: set DATABASE_URL in .dev.vars or environment.',
  )
}
```

### Transaction Errors

Transaction errors are handled by Kysely's built-in transaction management. When an error occurs within a transaction callback, Kysely automatically rolls back the transaction.

```typescript
// Existing pattern - no changes needed
await db.transaction().execute(async (trx) => {
  // If any operation throws, the entire transaction is rolled back
  await trx.insertInto('mortality_records').values(data).execute()
  await trx.updateTable('batches').set({ quantity: newQty }).execute()
})
```

### Pool Cleanup

In Cloudflare Workers, each request creates a new pool. The pool should be properly closed after use to avoid connection leaks:

```typescript
export async function getDb(): Promise<Kysely<Database>> {
  const connectionString = await getConnectionString()
  const pool = new Pool({ connectionString })

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  })
}

// Note: In Cloudflare Workers, the pool is automatically cleaned up
// when the request ends. For long-running processes (CLI scripts),
// explicit cleanup may be needed.
```

## Testing Strategy

### Unit Tests

Unit tests will verify:

- Connection string resolution logic
- Error message formatting
- Environment detection

### Property Tests

Property tests will verify:

- Transaction atomicity (operations within a transaction are atomic)
- Connection string resolution returns valid strings for all environments

### Integration Tests

Integration tests will verify:

- Actual database connections work in test environment
- Transactions commit and rollback correctly
- Existing server functions continue to work

### Manual Testing Checklist

1. **Local Development (Bun)**
   - [ ] `bun dev` starts successfully
   - [ ] Database queries work
   - [ ] Transactions work

2. **Local Preview (wrangler dev)**
   - [ ] `wrangler dev` starts successfully
   - [ ] Database queries work via localConnectionString
   - [ ] Transactions work

3. **Production (Cloudflare Workers)**
   - [ ] Deployment succeeds
   - [ ] Database queries work via Hyperdrive
   - [ ] Transactions work

## Migration Steps

### Step 1: Create Hyperdrive Configuration

1. Go to Cloudflare Dashboard → Hyperdrive
2. Create new configuration with Neon connection string
3. Note the configuration ID

### Step 2: Update Dependencies

The `pg` package is already installed in the project. No additional dependencies needed.

### Step 3: Update Wrangler Configuration

Add Hyperdrive binding to `wrangler.jsonc`.

### Step 4: Update Database Module

Replace `NeonDialect` with `PostgresDialect` in `app/lib/db/index.ts`.

### Step 5: Update Environment Variables

Ensure `.dev.vars` has the correct `DATABASE_URL` for local development.

### Step 6: Test

1. Run unit tests: `bun run test`
2. Run integration tests: `bun run test:integration`
3. Test locally: `bun dev`
4. Test with wrangler: `wrangler dev`
5. Deploy and test in production

## Rollback Plan

If issues are encountered:

1. Revert `app/lib/db/index.ts` to use `NeonDialect`
2. Remove Hyperdrive binding from `wrangler.jsonc`
3. Redeploy

The rollback is safe because:

- No database schema changes are required
- No changes to server functions are required
- The `pg` package can remain installed (unused)
