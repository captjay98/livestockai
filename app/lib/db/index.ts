import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

// Database configuration
const dialect = new PostgresDialect({
  pool: new Pool({
    database: process.env.DATABASE_NAME || 'jayfarms',
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
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