/**
 * Database Reset Script
 * 
 * WARNING: This will DROP ALL TABLES and re-run migrations
 * Only use in development!
 * 
 * Run: bun run app/lib/db/reset.ts
 */

import { sql } from 'kysely'
import { db } from './index'

async function resetDatabase() {
  console.log('⚠️  WARNING: This will DROP ALL TABLES!')
  console.log('🗑️  Dropping all tables...')

  try {
    // Get all table names from the database
    const result = await sql<{ tablename: string }>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `.execute(db)

    const tables = result.rows.map(r => r.tablename)
    console.log(`  Found ${tables.length} tables to drop`)

    // Drop all tables with CASCADE
    for (const table of tables) {
      try {
        await sql`DROP TABLE IF EXISTS ${sql.ref(table)} CASCADE`.execute(db)
        console.log(`  ✓ Dropped ${table}`)
      } catch (e) {
        console.log(`  ⚠ Could not drop ${table}`)
      }
    }

    console.log('✅ All tables dropped')
    console.log('')
    console.log('Now run: npm run db:migrate && npm run db:seed')
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

resetDatabase()
