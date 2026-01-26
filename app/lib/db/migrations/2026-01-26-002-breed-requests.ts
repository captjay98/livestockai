import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('breed_requests')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('userId', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('moduleKey', 'text', (col) => col.notNull())
    .addColumn('speciesKey', 'text', (col) => col.notNull())
    .addColumn('breedName', 'text', (col) => col.notNull())
    .addColumn('typicalMarketWeightG', 'integer')
    .addColumn('typicalDaysToMarket', 'integer')
    .addColumn('typicalFcr', sql`decimal(4,2)`)
    .addColumn('source', 'text')
    .addColumn('userEmail', 'text')
    .addColumn('notes', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute()

  await db.schema
    .createIndex('breed_requests_user_id_idx')
    .on('breed_requests')
    .column('userId')
    .execute()

  await db.schema
    .createIndex('breed_requests_status_idx')
    .on('breed_requests')
    .column('status')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('breed_requests').execute()
}
