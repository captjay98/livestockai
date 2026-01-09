import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    // Add batchId to expenses
    await db.schema
        .alterTable('expenses')
        .addColumn('batchId', 'uuid', (col) => col.references('batches.id').onDelete('set null'))
        .execute()

    // Create feed_inventory table
    await db.schema
        .createTable('feed_inventory')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
        .addColumn('farmId', 'uuid', (col) => col.notNull().references('farms.id').onDelete('cascade'))
        .addColumn('feedType', 'varchar(20)', (col) => col.notNull())
        .addColumn('quantityKg', sql`decimal(10,2)`, (col) => col.notNull().defaultTo(0))
        .addColumn('minThresholdKg', sql`decimal(10,2)`, (col) => col.notNull().defaultTo(10))
        .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
        .execute()

    // Add constraint for feedType
    await sql`ALTER TABLE feed_inventory ADD CONSTRAINT feed_inventory_feed_type_check CHECK ("feedType" IN ('starter', 'grower', 'finisher', 'layer_mash', 'fish_feed'))`.execute(db)

    // Create index
    await db.schema.createIndex('idx_feed_inventory_farm_id').on('feed_inventory').column('farmId').execute()
    await db.schema.createIndex('idx_feed_inventory_farm_type').on('feed_inventory').columns(['farmId', 'feedType']).execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('feed_inventory').execute()
    await db.schema.alterTable('expenses').dropColumn('batchId').execute()
}
