import { sql } from 'kysely'
import type { Kysely } from 'kysely'

/**
 * Migration: Add userType column to users table
 *
 * Purpose: Support buyer vs farmer user types for marketplace integration
 * - Buyers skip farm onboarding and go straight to marketplace
 * - Farmers go through onboarding flow (create farm, modules, etc.)
 * - 'both' allows users to be both buyers and farmers
 *
 * Default: 'farmer' for backward compatibility with existing users
 *
 * Note: Better Auth's additionalFields adds columns to the users table,
 * not user_settings. This migration aligns with Better Auth's behavior.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Add userType column to users table (Better Auth requirement)
  await db.schema
    .alterTable('users')
    .addColumn('userType', 'varchar(10)', (col) =>
      col.notNull().defaultTo('farmer'),
    )
    .execute()

  // Add CHECK constraint for valid userType values
  await sql`ALTER TABLE users ADD CONSTRAINT users_user_type_check CHECK ("userType" IN ('farmer', 'buyer', 'both'))`.execute(
    db,
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop CHECK constraint
  await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check`.execute(
    db,
  )

  // Drop userType column
  await db.schema.alterTable('users').dropColumn('userType').execute()
}
