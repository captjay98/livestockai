import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('user_districts')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`),
        )
        .addColumn('userId', 'uuid', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('districtId', 'uuid', (col) =>
            col.notNull().references('regions.id').onDelete('cascade'),
        )
        .addColumn('isSupervisor', 'boolean', (col) => col.defaultTo(false))
        .addColumn('assignedAt', 'timestamp', (col) =>
            col.defaultTo(sql`NOW()`),
        )
        .addColumn('assignedBy', 'uuid', (col) =>
            col.references('users.id').onDelete('set null'),
        )
        .addUniqueConstraint('unique_user_district', ['userId', 'districtId'])
        .execute()

    await db.schema
        .createIndex('idx_user_districts_user')
        .on('user_districts')
        .column('userId')
        .execute()

    await db.schema
        .createIndex('idx_user_districts_district')
        .on('user_districts')
        .column('districtId')
        .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('user_districts').execute()
}
