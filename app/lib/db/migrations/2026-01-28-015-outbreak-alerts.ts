import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    // Outbreak alerts table
    await db.schema
        .createTable('outbreak_alerts')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(db.fn('gen_random_uuid')),
        )
        .addColumn('districtId', 'varchar(100)', (col) => col.notNull())
        .addColumn('species', 'varchar(100)', (col) => col.notNull())
        .addColumn('livestockType', 'varchar(50)', (col) => col.notNull())
        .addColumn('severity', 'varchar(20)', (col) =>
            col.notNull().check("severity IN ('watch', 'alert', 'critical')"),
        )
        .addColumn('status', 'varchar(20)', (col) =>
            col
                .notNull()
                .defaultTo('active')
                .check(
                    "status IN ('active', 'monitoring', 'resolved', 'false_positive')",
                ),
        )
        .addColumn('detectedAt', 'timestamptz', (col) =>
            col.notNull().defaultTo(db.fn.now()),
        )
        .addColumn('resolvedAt', 'timestamptz')
        .addColumn('notes', 'text')
        .addColumn('createdBy', 'uuid', (col) => col.notNull())
        .addColumn('updatedAt', 'timestamptz', (col) =>
            col.notNull().defaultTo(db.fn.now()),
        )
        .addColumn('updatedBy', 'uuid', (col) => col.notNull())
        .execute()

    // Junction table for farms affected by alerts
    await db.schema
        .createTable('outbreak_alert_farms')
        .addColumn('alertId', 'uuid', (col) =>
            col.notNull().references('outbreak_alerts.id').onDelete('cascade'),
        )
        .addColumn('farmId', 'uuid', (col) =>
            col.notNull().references('farms.id').onDelete('cascade'),
        )
        .addColumn('mortalityRate', 'decimal(5,2)', (col) => col.notNull())
        .addColumn('reportedAt', 'timestamptz', (col) =>
            col.notNull().defaultTo(db.fn.now()),
        )
        .addPrimaryKey(['alertId', 'farmId'])
        .execute()

    // Indexes for performance
    await db.schema
        .createIndex('idx_outbreak_alerts_district_status')
        .on('outbreak_alerts')
        .columns(['districtId', 'status'])
        .execute()
    await db.schema
        .createIndex('idx_outbreak_alerts_species_type')
        .on('outbreak_alerts')
        .columns(['species', 'livestockType'])
        .execute()
    await db.schema
        .createIndex('idx_outbreak_alerts_detected_at')
        .on('outbreak_alerts')
        .column('detectedAt')
        .execute()
    await db.schema
        .createIndex('idx_outbreak_alert_farms_alert')
        .on('outbreak_alert_farms')
        .column('alertId')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('outbreak_alert_farms').execute()
    await db.schema.dropTable('outbreak_alerts').execute()
}
