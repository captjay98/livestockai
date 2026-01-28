import { Kysely } from 'kysely'
import { NeonDialect } from 'kysely-neon'
import { neon } from '@neondatabase/serverless'
import type { Database } from './types'

/**
 * Database Connection Module
 *
 * This module provides database access that works in both:
 * - Cloudflare Workers (uses `env` from 'cloudflare:workers')
 * - Node.js/Bun (uses process.env for seeders, migrations, CLI scripts)
 *
 * USAGE IN SERVER FUNCTIONS:
 * ```typescript
 * const { getDb } = await import('~/lib/db')
 * const db = await getDb()
 * ```
 *
 * USAGE IN CLI SCRIPTS (seeders, migrations):
 * ```typescript
 * import { db } from '~/lib/db'
 * // db is available synchronously via process.env
 * ```
 */

let dbInstance: Kysely<Database> | undefined

/**
 * Get DATABASE_URL from the appropriate source based on runtime.
 * Tries process.env first, then falls back to cloudflare:workers env.
 */
async function getDatabaseUrl(): Promise<string | undefined> {
  // Try process.env first (works in Node.js, Bun, and when Vite injects it)
  if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Fall back to Cloudflare Workers env binding
  try {
    const { env } = await import('cloudflare:workers')
    return env.DATABASE_URL
  } catch {
    return undefined
  }
}

/**
 * Get the database instance, creating it lazily if needed.
 *
 * This is the REQUIRED way to access the database in server functions
 * for Cloudflare Workers compatibility.
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
 */
export async function getDb(): Promise<Kysely<Database>> {
  if (!dbInstance) {
    const databaseUrl = await getDatabaseUrl()
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Make sure you are running this code on the server.',
      )
    }
    dbInstance = new Kysely<Database>({
      dialect: new NeonDialect({
        neon: neon(databaseUrl),
      }),
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
    return new Kysely<Database>({
      dialect: new NeonDialect({
        neon: neon(process.env.DATABASE_URL),
      }),
    })
  }
  // Return a proxy that throws a helpful error
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
