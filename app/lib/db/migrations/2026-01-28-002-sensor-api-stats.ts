import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('sensors')
    .addColumn('lastUsedAt', 'timestamp')
    .addColumn('requestCount', 'integer', (col) => col.defaultTo(0).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('sensors')
    .dropColumn('lastUsedAt')
    .dropColumn('requestCount')
    .execute()
}
