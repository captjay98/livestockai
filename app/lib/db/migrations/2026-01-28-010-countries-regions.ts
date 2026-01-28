import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
    // Countries table
    await db.schema
        .createTable('countries')
        .addColumn('code', 'varchar(2)', (col) => col.primaryKey())
        .addColumn('name', 'varchar(100)', (col) => col.notNull())
        .addColumn('localizedNames', 'jsonb', (col) => col.defaultTo('{}'))
        .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
        .execute()

    // Regions table (2-level hierarchy: State/Province -> District)
    await db.schema
        .createTable('regions')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`),
        )
        .addColumn('countryCode', 'varchar(2)', (col) =>
            col.notNull().references('countries.code'),
        )
        .addColumn('parentId', 'uuid', (col) => col.references('regions.id'))
        .addColumn('level', 'integer', (col) => col.notNull())
        .addColumn('name', 'varchar(200)', (col) => col.notNull())
        .addColumn('slug', 'varchar(100)', (col) => col.notNull().unique())
        .addColumn('localizedNames', 'jsonb', (col) => col.defaultTo('{}'))
        .addColumn('isActive', 'boolean', (col) => col.defaultTo(true))
        .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
        .addColumn('updatedAt', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
        .addUniqueConstraint('unique_region_name', [
            'countryCode',
            'parentId',
            'name',
        ])
        .addCheckConstraint('check_region_level', sql`level IN (1, 2)`)
        .execute()

    // Indexes
    await db.schema
        .createIndex('idx_regions_country_level')
        .on('regions')
        .columns(['countryCode', 'level'])
        .execute()

    await db.schema
        .createIndex('idx_regions_parent')
        .on('regions')
        .column('parentId')
        .execute()

    await sql`CREATE INDEX idx_regions_active ON regions(is_active) WHERE is_active = true`.execute(
        db,
    )

    // Seed countries
    await db
        .insertInto('countries' as any)
        .values([
            { code: 'NG', name: 'Nigeria' },
            { code: 'KE', name: 'Kenya' },
            { code: 'IN', name: 'India' },
            { code: 'BR', name: 'Brazil' },
            { code: 'GH', name: 'Ghana' },
            { code: 'TZ', name: 'Tanzania' },
            { code: 'UG', name: 'Uganda' },
            { code: 'ET', name: 'Ethiopia' },
            { code: 'ZA', name: 'South Africa' },
            { code: 'EG', name: 'Egypt' },
        ])
        .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('regions').execute()
    await db.schema.dropTable('countries').execute()
}
