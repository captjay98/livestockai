/**
 * Database Reset Script - OpenLivestock Manager
 *
 * Drops ALL tables and re-runs migrations from scratch.
 * Use with caution - this destroys all data!
 *
 * Run: bun run db:reset
 */

import { sql } from 'kysely'
import { db } from './index'

async function reset() {
  console.log('🗑️  Resetting database (dropping all tables)...\n')

  try {
    // Drop all tables with CASCADE to handle FK constraints
    const tables = [
      'growth_standards',
      'market_prices',
      'audit_logs',
      'invoice_items',
      'sales',
      'invoices',
      'expenses',
      'water_quality',
      'treatments',
      'vaccinations',
      'weight_samples',
      'egg_records',
      'feed_records',
      'mortality_records',
      'batches',
      'medication_inventory',
      'feed_inventory',
      'structures',
      'farm_modules',
      'user_farms',
      'suppliers',
      'customers',
      'farms',
      'user_settings',
      'verification',
      'account',
      'sessions',
      'users',
      'kysely_migration',
      'kysely_migration_lock',
    ]

    for (const table of tables) {
      await sql`DROP TABLE IF EXISTS ${sql.ref(table)} CASCADE`.execute(db)
    }

    // Drop the trigger function
    await sql`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`.execute(
      db,
    )

    console.log('✅ All tables dropped\n')
    console.log('🔄 Now run: bun run db:migrate')

    await db.destroy()
    process.exit(0)
  } catch (error) {
    console.error('❌ Reset failed:', error)
    await db.destroy()
    process.exit(1)
  }
}

reset()
