import { sql } from 'kysely'
import type { Kysely } from 'kysely'

/**
 * Migration: Add userType column to user_settings
 *
 * Purpose: Support buyer vs farmer user types for marketplace integration
 * - Buyers skip farm onboarding and go straight to marketplace
 * - Farmers go through onboarding flow (create farm, modules, etc.)
 * - 'both' allows users to be both buyers and farmers
 *
 * Default: 'farmer' for backward compatibility with existing users
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Add userType column to user_settings
  await db.schema
    .alterTable('user_settings')
    .addColumn('userType', 'varchar(10)', (col) =>
      col.notNull().defaultTo('farmer'),
    )
    .execute()

  // Add CHECK constraint for valid userType values
  await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_type_check CHECK ("userType" IN ('farmer', 'buyer', 'both'))`.execute(
    db,
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop CHECK constraint
  await sql`ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_type_check`.execute(
    db,
  )

  // Drop userType column
  await db.schema.alterTable('user_settings').dropColumn('userType').execute()
}
