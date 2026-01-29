import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

/**
 * Database Connection Module
 *
 * This module provides database access that works in both:
 * - Cloudflare Workers (uses Hyperdrive for connection pooling + transactions)
 * - Node.js/Bun (uses process.env for seeders, migrations, CLI scripts)
 *
 * ARCHITECTURE:
 * - Production (Cloudflare Workers): Uses Hyperdrive binding for connection pooling
 * - Local dev (wrangler dev): Uses localConnectionString from wrangler.jsonc
 * - CLI scripts (Node.js/Bun): Uses DATABASE_URL from process.env
 *
 * WHY HYPERDRIVE?
 * The previous NeonDialect (HTTP driver) didn't support interactive transactions.
 * Hyperdrive provides a connection string that works with the standard `pg` driver,
 * enabling full transaction support while maintaining edge performance.
 *
 * USAGE IN SERVER FUNCTIONS:
 * ```typescript
 * const { getDb } = await import('~/lib/db')
 * const db = await getDb()
 * // Transactions now work!
 * await db.transaction().execute(async (trx) => {
 *   await trx.insertInto('records').values(data).execute()
 *   await trx.updateTable('batches').set({ quantity }).execute()
 * })
 * ```
 *
 * USAGE IN CLI SCRIPTS (seeders, migrations):
 * ```typescript
 * import { db } from '~/lib/db'
 * // db is available synchronously via process.env
 * ```
 */

/**
 * Type definition for Cloudflare Workers environment with Hyperdrive binding.
 * Hyperdrive provides a `connectionString` property that can be used with
 * standard PostgreSQL drivers like `pg`.
 */
interface HyperdriveBinding {
  connectionString: string
}

interface CloudflareEnv {
  HYPERDRIVE?: HyperdriveBinding
  DATABASE_URL?: string
}

let dbInstance: Kysely<Database> | undefined

/**
 * Get the database connection string from the appropriate source based on runtime.
 *
 * Priority order:
 * 1. process.env.DATABASE_URL (Node.js/Bun - CLI scripts, migrations, tests)
 * 2. Hyperdrive binding (Cloudflare Workers - production)
 * 3. DATABASE_URL from Cloudflare env (wrangler dev fallback)
 *
 * @returns The PostgreSQL connection string
 * @throws Error if no connection string is available
 */
export async function getConnectionString(): Promise<string> {
  // 1. Try process.env first (works in Node.js, Bun, and when Vite injects it)
  // This is the primary path for CLI scripts, migrations, and tests
  if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // 2. Try Cloudflare Workers env binding (production + wrangler dev)
  try {
    const { env } = (await import('cloudflare:workers')) as {
      env: CloudflareEnv
    }

    // Prefer Hyperdrive if available (production Cloudflare Workers)
    // Hyperdrive provides connection pooling and enables full transaction support
    if (env.HYPERDRIVE?.connectionString) {
      return env.HYPERDRIVE.connectionString
    }

    // Fall back to DATABASE_URL (wrangler dev with localConnectionString)
    if (env.DATABASE_URL) {
      return env.DATABASE_URL
    }
  } catch {
    // Not in Cloudflare Workers environment - this is expected for Node.js/Bun
  }

  // No connection string found - throw descriptive error
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
      'For Cloudflare Workers: ensure Hyperdrive is configured in wrangler.jsonc. ' +
      'For local development: set DATABASE_URL in .dev.vars or environment.',
  )
}

/**
 * Get the database instance, creating it lazily if needed.
 *
 * This is the REQUIRED way to access the database in server functions
 * for Cloudflare Workers compatibility.
 *
 * The function uses PostgresDialect with the `pg` driver, which supports
 * full interactive transactions (unlike the previous NeonDialect HTTP driver).
 *
 * @example
 * ```typescript
 * export const myServerFn = createServerFn({ method: 'GET' })
 *   .handler(async () => {
 *     const { getDb } = await import('~/lib/db')
 *     const db = await getDb()
 *     return db.selectFrom('users').execute()
 *   })
 * ```
 *
 * @example Transaction support
 * ```typescript
 * const db = await getDb()
 * await db.transaction().execute(async (trx) => {
 *   await trx.insertInto('mortality_records').values(data).execute()
 *   await trx.updateTable('batches').set({ quantity: newQty }).execute()
 * })
 * ```
 */
export async function getDb(): Promise<Kysely<Database>> {
  if (!dbInstance) {
    const connectionString = await getConnectionString()

    // Create a Pool with the connection string
    // In Cloudflare Workers with Hyperdrive, the pool is managed by Hyperdrive
    // In Node.js/Bun, this creates a standard pg Pool
    const pool = new Pool({
      connectionString,
      // Hyperdrive handles connection pooling, so we use minimal pool settings
      // For Node.js/Bun, these are reasonable defaults
      max: 10,
    })

    dbInstance = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    })
  }
  return dbInstance
}

/**
 * Direct database export for CLI scripts and migrations (Node.js/Bun only).
 *
 * ⚠️ DO NOT use this in server functions - use getDb() instead!
 *
 * This export only works when process.env.DATABASE_URL is available,
 * which is the case for:
 * - Database seeders (bun run db:seed)
 * - Migrations (bun run db:migrate)
 * - CLI scripts
 *
 * @example
 * ```typescript
 * // In a seeder file
 * import { db } from '~/lib/db'
 * await db.insertInto('users').values({...}).execute()
 * ```
 */
export const db: Kysely<Database> = (() => {
  if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    })
    return new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    })
  }
  // Return a proxy that throws a helpful error when accessed without DATABASE_URL
  return new Proxy({} as Kysely<Database>, {
    get() {
      throw new Error(
        'DATABASE_URL not available. In server functions, use: const { getDb } = await import("~/lib/db"); const db = await getDb();',
      )
    },
  })
})()

// Export types for use in other files
export type { Database } from './types'
export * from './types'
