import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('species_thresholds')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`),
        )
        .addColumn('species', 'varchar(50)', (col) => col.notNull())
        .addColumn('regionId', 'uuid', (col) =>
            col.references('regions.id').onDelete('cascade'),
        )
        .addColumn('amberThreshold', 'decimal(5,2)', (col) => col.notNull())
        .addColumn('redThreshold', 'decimal(5,2)', (col) => col.notNull())
        .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
        .addUniqueConstraint('unique_species_region', ['species', 'regionId'])
        .execute()

    // Seed global defaults (regionId = NULL)
    await db
        .insertInto('species_thresholds' as any)
        .values([
            {
                species: 'broiler',
                regionId: null,
                amberThreshold: '5.0',
                redThreshold: '10.0',
            },
            {
                species: 'layer',
                regionId: null,
                amberThreshold: '3.0',
                redThreshold: '7.0',
            },
            {
                species: 'catfish',
                regionId: null,
                amberThreshold: '12.0',
                redThreshold: '18.0',
            },
            {
                species: 'tilapia',
                regionId: null,
                amberThreshold: '10.0',
                redThreshold: '15.0',
            },
            {
                species: 'cattle',
                regionId: null,
                amberThreshold: '2.0',
                redThreshold: '5.0',
            },
            {
                species: 'goats',
                regionId: null,
                amberThreshold: '3.0',
                redThreshold: '6.0',
            },
            {
                species: 'sheep',
                regionId: null,
                amberThreshold: '3.0',
                redThreshold: '6.0',
            },
        ])
        .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('species_thresholds').execute()
}
