import type { Kysely } from 'kysely'
import type { Database } from '../types'

export async function up(db: Kysely<Database>): Promise<void> {
    await db.schema
        .createTable('visit_records')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(db.fn('gen_random_uuid')),
        )
        .addColumn('agentId', 'uuid', (col) =>
            col.notNull().references('users.id'),
        )
        .addColumn('farmId', 'uuid', (col) =>
            col.notNull().references('farms.id'),
        )
        .addColumn('visitDate', 'date', (col) => col.notNull())
        .addColumn('visitType', 'text', (col) =>
            col
                .notNull()
                .check("visit_type IN ('routine', 'emergency', 'follow_up')"),
        )
        .addColumn('findings', 'text', (col) => col.notNull())
        .addColumn('recommendations', 'text', (col) => col.notNull())
        .addColumn('attachments', 'jsonb', (col) => col.defaultTo('[]'))
        .addColumn('followUpDate', 'date')
        .addColumn('farmerAcknowledged', 'boolean', (col) =>
            col.defaultTo(false),
        )
        .addColumn('farmerAcknowledgedAt', 'timestamp')
        .addColumn('createdAt', 'timestamp', (col) =>
            col.defaultTo(db.fn.now()).notNull(),
        )
        .addColumn('updatedAt', 'timestamp', (col) =>
            col.defaultTo(db.fn.now()).notNull(),
        )
        .execute()

    await db.schema
        .createIndex('visit_records_farm_id_idx')
        .on('visit_records')
        .column('farmId')
        .execute()

    await db.schema
        .createIndex('visit_records_agent_id_idx')
        .on('visit_records')
        .column('agentId')
        .execute()

    await db.schema
        .createIndex('visit_records_follow_up_date_idx')
        .on('visit_records')
        .column('followUpDate')
        .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
    await db.schema.dropTable('visit_records').execute()
}
