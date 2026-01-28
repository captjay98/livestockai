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
        // Drop all tables dynamically by querying the database
        const result = await sql<{ tablename: string }>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `.execute(db)

        const tables = result.rows.map((row) => row.tablename)

        console.log(`Found ${tables.length} tables to drop\n`)

        // Drop all tables with CASCADE
        for (const table of tables) {
            console.log(`Dropping ${table}...`)
            await sql`DROP TABLE IF EXISTS ${sql.ref(table)} CASCADE`.execute(
                db,
            )
        }

        // Drop the trigger function
        await sql`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`.execute(
            db,
        )

        console.log('\n✅ All tables dropped\n')
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
