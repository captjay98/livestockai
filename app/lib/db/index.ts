import { Kysely, PostgresDialect } from 'kysely'
import { Pool, neonConfig } from '@neondatabase/serverless'
import type { Database } from './types'

// Enable WebSocket for serverless environments (Cloudflare Workers)
neonConfig.webSocketConstructor = globalThis.WebSocket

// Database configuration - uses Neon serverless driver
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  }),
})

// Create the Kysely instance
export const db = new Kysely<Database>({
  dialect,
})

// Export types for use in other files
export type { Database } from './types'
export * from './types'
