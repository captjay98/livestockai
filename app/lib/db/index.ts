import { Kysely } from 'kysely'
import { NeonDialect } from 'kysely-neon'
import { neon } from '@neondatabase/serverless'
import type { Database } from './types'

// Create the Kysely instance using NeonDialect (HTTP-based, works in serverless)
export const db = new Kysely<Database>({
  dialect: new NeonDialect({
    neon: neon(process.env.DATABASE_URL!),
  }),
})

// Export types for use in other files
export type { Database } from './types'
export * from './types'
