/**
 * Kysely Migration Runner
 *
 * Run migrations: bun run db:migrate
 * Rollback last: bun run db:rollback
 */

import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { FileMigrationProvider, Migrator } from 'kysely'
import { db } from './index'

export async function migrate() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(process.cwd(), 'app/lib/db/migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(
        `✅ Migration "${it.migrationName}" was executed successfully`,
      )
    } else if (it.status === 'Error') {
      console.error(`❌ Failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('❌ Migration failed')
    console.error(error)
    process.exit(1)
  }

  if (!results?.length) {
    console.log('📋 No migrations to run - database is up to date')
  }

  await db.destroy()
}

async function rollbackLast() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(process.cwd(), 'app/lib/db/migrations'),
    }),
  })

  const { error, results } = await migrator.migrateDown()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Rolled back migration "${it.migrationName}"`)
    } else if (it.status === 'Error') {
      console.error(`❌ Failed to rollback migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('❌ Rollback failed')
    console.error(error)
    process.exit(1)
  }

  if (!results?.length) {
    console.log('📋 No migrations to rollback')
  }

  await db.destroy()
}

// Parse command line args
const command = process.argv[2]

if (command === 'down' || command === 'rollback') {
  console.log('🔄 Rolling back last migration...')
  rollbackLast()
} else {
  console.log('🚀 Running migrations...')
  migrate()
}
