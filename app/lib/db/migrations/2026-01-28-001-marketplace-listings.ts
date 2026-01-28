import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('marketplace_listings')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`),
        )
        .addColumn('sellerId', 'uuid', (col) =>
            col.notNull().references('users.id'),
        )
        // Livestock info
        .addColumn('livestockType', 'varchar(20)', (col) => col.notNull())
        .addColumn('species', 'varchar(100)', (col) => col.notNull())
        .addColumn('quantity', 'integer', (col) => col.notNull())
        .addColumn('minPrice', 'decimal(19,2)', (col) => col.notNull())
        .addColumn('maxPrice', 'decimal(19,2)', (col) => col.notNull())
        .addColumn('currency', 'varchar(3)', (col) =>
            col.notNull().defaultTo('NGN'),
        )
        // Location (exact, fuzzing applied at display time)
        .addColumn('latitude', 'decimal(10,8)', (col) => col.notNull())
        .addColumn('longitude', 'decimal(11,8)', (col) => col.notNull())
        .addColumn('country', 'varchar(100)', (col) => col.notNull())
        .addColumn('region', 'varchar(100)', (col) => col.notNull())
        .addColumn('locality', 'varchar(100)', (col) => col.notNull())
        .addColumn('formattedAddress', 'text', (col) => col.notNull())
        // Content
        .addColumn('description', 'text')
        .addColumn('photoUrls', sql`text[]`)
        // Settings
        .addColumn('fuzzingLevel', 'varchar(10)', (col) =>
            col.notNull().defaultTo('medium'),
        )
        .addColumn('contactPreference', 'varchar(10)', (col) =>
            col.notNull().defaultTo('app'),
        )
        // Batch link (optional) - SET NULL if batch deleted
        .addColumn('batchId', 'uuid', (col) =>
            col.references('batches.id').onDelete('set null'),
        )
        // Status and expiration
        .addColumn('status', 'varchar(20)', (col) =>
            col.notNull().defaultTo('active'),
        )
        .addColumn('expiresAt', 'timestamptz', (col) => col.notNull())
        // Analytics
        .addColumn('viewCount', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('contactCount', 'integer', (col) =>
            col.notNull().defaultTo(0),
        )
        // Timestamps
        .addColumn('createdAt', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updatedAt', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`),
        )
        .addColumn('deletedAt', 'timestamptz')
        .execute()

    // Indexes
    await db.schema
        .createIndex('idx_marketplace_listings_seller')
        .on('marketplace_listings')
        .column('sellerId')
        .execute()

    await db.schema
        .createIndex('idx_marketplace_listings_status')
        .on('marketplace_listings')
        .column('status')
        .execute()

    await db.schema
        .createIndex('idx_marketplace_listings_expires')
        .on('marketplace_listings')
        .column('expiresAt')
        .execute()

    await db.schema
        .createIndex('idx_marketplace_listings_type')
        .on('marketplace_listings')
        .column('livestockType')
        .execute()

    // Separate lat/lon indexes for bounding box queries
    await db.schema
        .createIndex('idx_marketplace_listings_lat')
        .on('marketplace_listings')
        .column('latitude')
        .execute()

    await db.schema
        .createIndex('idx_marketplace_listings_lon')
        .on('marketplace_listings')
        .column('longitude')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('marketplace_listings').execute()
}
