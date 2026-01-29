# Neon Database Guidelines

## Current Implementation (January 2026)

**This codebase uses Cloudflare Hyperdrive with PostgresDialect for full transaction support.**

The migration from `NeonDialect` (HTTP driver) to `PostgresDialect` with `pg` driver was completed to enable interactive transactions in Cloudflare Workers.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Cloudflare      │────▶│ Hyperdrive       │────▶│ PostgresDialect │────▶│ Neon PostgreSQL │
│ Worker          │     │ (Connection Pool)│     │ (pg driver)     │     │ Database        │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └─────────────────┘
                              ✅ Full transaction support
```

### Environment-Specific Behavior

| Environment                          | Connection Source                           | Transaction Support |
| ------------------------------------ | ------------------------------------------- | ------------------- |
| Cloudflare Workers (production)      | `env.HYPERDRIVE.connectionString`           | ✅ Full             |
| wrangler dev (local preview)         | `localConnectionString` from wrangler.jsonc | ✅ Full             |
| Node.js/Bun (CLI, tests, migrations) | `process.env.DATABASE_URL`                  | ✅ Full             |

## Transaction Support Summary

| Driver Type                      | Interactive Transactions | Non-Interactive Transactions | Use Case                           |
| -------------------------------- | ------------------------ | ---------------------------- | ---------------------------------- |
| HTTP (`NeonDialect` + `neon()`)  | ❌ Not supported         | ✅ Via `sql.transaction([])` | Single queries, batch operations   |
| WebSocket (`Pool`/`Client`)      | ✅ Fully supported       | ✅ Supported                 | Sessions, interactive transactions |
| **Cloudflare Hyperdrive + `pg`** | ✅ Fully supported       | ✅ Supported                 | **Cloudflare Workers (current)**   |

## Database Access Patterns

### In Server Functions (Required Pattern)

```typescript
export const myServerFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Transactions now work!
    await db.transaction().execute(async (trx) => {
      await trx.insertInto('mortality_records').values(data).execute()
      await trx.updateTable('batches').set({ quantity: newQty }).execute()
    })
  },
)
```

### In CLI Scripts (Seeders, Migrations)

```typescript
import { db } from '~/lib/db'

// Synchronous export works when DATABASE_URL is in process.env
await db.insertInto('users').values({...}).execute()
```

## Hyperdrive Setup

### 1. Cloudflare Dashboard Configuration

1. Go to Cloudflare Dashboard → Hyperdrive → Create configuration
2. Enter your Neon PostgreSQL connection string
3. Copy the configuration ID

### 2. Wrangler Configuration

```jsonc
// wrangler.jsonc
{
  "compatibility_flags": ["nodejs_compat"],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<your-hyperdrive-configuration-id>",
      "localConnectionString": "env:DATABASE_URL",
    },
  ],
}
```

### 3. Environment Variables

```bash
# .dev.vars (local development)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require

# Production: Set via wrangler secret
wrangler secret put DATABASE_URL
```

## Connection String Resolution

The `getConnectionString()` function in `app/lib/db/index.ts` resolves the connection string with this priority:

1. **process.env.DATABASE_URL** - Node.js/Bun (CLI scripts, migrations, tests)
2. **env.HYPERDRIVE.connectionString** - Cloudflare Workers (production)
3. **env.DATABASE_URL** - wrangler dev fallback

```typescript
// Simplified logic
async function getConnectionString(): Promise<string> {
  // 1. Try process.env first (Node.js/Bun)
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  // 2. Try Cloudflare Workers env
  const { env } = await import('cloudflare:workers')
  if (env.HYPERDRIVE?.connectionString) return env.HYPERDRIVE.connectionString
  if (env.DATABASE_URL) return env.DATABASE_URL

  throw new Error('DATABASE_URL not configured')
}
```

## Why Hyperdrive?

### The Problem with NeonDialect (HTTP)

Kysely's `db.transaction().execute()` requires interactive transactions, which the HTTP driver doesn't support:

```
Error: NeonDialect doesn't support interactive transactions
```

### Hyperdrive Benefits

- **Connection pooling** at the edge (globally distributed)
- **Full transaction support** via standard `pg` driver
- **~9x faster queries** in global scenarios
- **Automatic query caching**

### Official Neon Guidance

From [Neon's Hyperdrive FAQ](https://neon.tech/blog/hyperdrive-neon-faq):

> Hyperdrive relies on TCP connections between the client and the database. **You should use Hyperdrive directly with standard Postgres drivers, like node-postgres.**

## Operations Using Transactions

These operations now work correctly with full atomicity:

| File                                 | Function                | Operations                             |
| ------------------------------------ | ----------------------- | -------------------------------------- |
| `app/features/batches/repository.ts` | `updateBatch`           | Update batch + related records         |
| `app/features/mortality/server.ts`   | `recordMortality`       | Insert record + update batch quantity  |
| `app/features/mortality/server.ts`   | `updateMortalityRecord` | Update record + adjust batch quantity  |
| `app/features/mortality/server.ts`   | `deleteMortalityRecord` | Delete record + restore batch quantity |
| `app/features/feed/server.ts`        | `recordFeed`            | Insert record + update inventory       |
| `app/features/feed/server.ts`        | `updateFeedRecord`      | Update record + adjust inventory       |
| `app/features/feed/server.ts`        | `deleteFeedRecord`      | Delete record + restore inventory      |
| `app/features/expenses/server.ts`    | `recordExpense`         | Insert expense + update related        |
| `app/features/sales/server.ts`       | `recordSale`            | Insert sale + update batch quantity    |
| `app/features/sales/server.ts`       | `updateSale`            | Update sale + adjust batch quantity    |

## Troubleshooting

### "DATABASE_URL not configured" Error

1. Check `.dev.vars` has `DATABASE_URL` set
2. For production, verify Hyperdrive configuration ID in `wrangler.jsonc`
3. Ensure `nodejs_compat` flag is in `compatibility_flags`

### Transaction Failures

If transactions fail in production:

1. Verify Hyperdrive is properly configured in Cloudflare dashboard
2. Check the Hyperdrive configuration ID matches `wrangler.jsonc`
3. Ensure the Neon connection string in Hyperdrive is correct

### Local Development Issues

For `wrangler dev`:

- Uses `localConnectionString` which references `env:DATABASE_URL`
- Ensure `.dev.vars` has the correct `DATABASE_URL`

For `bun dev`:

- Uses `process.env.DATABASE_URL` directly
- Ensure `.env` or environment has `DATABASE_URL`

## References

- [Neon Serverless Driver Documentation](https://neon.com/docs/serverless/serverless-driver)
- [Neon + Kysely Guide](https://neon.com/docs/guides/kysely)
- [Neon + Cloudflare Workers Guide](https://neon.com/docs/guides/cloudflare-workers)
- [Neon + Hyperdrive FAQ](https://neon.tech/blog/hyperdrive-neon-faq)
- [Cloudflare Hyperdrive + Neon](https://developers.cloudflare.com/workers/databases/third-party-integrations/neon/)
