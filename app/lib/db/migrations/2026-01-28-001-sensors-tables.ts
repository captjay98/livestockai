import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Sensors table
  await db.schema
    .createTable('sensors')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.references('farms.id').onDelete('cascade').notNull(),
    )
    .addColumn('structureId', 'uuid', (col) =>
      col.references('structures.id').onDelete('set null'),
    )
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('sensorType', 'varchar(50)', (col) => col.notNull())
    .addColumn('apiKeyHash', 'varchar(255)', (col) => col.notNull())
    .addColumn('pollingIntervalMinutes', 'integer', (col) =>
      col.notNull().defaultTo(15),
    )
    .addColumn('isActive', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('lastReadingAt', 'timestamptz')
    .addColumn('thresholds', 'jsonb')
    .addColumn('trendConfig', 'jsonb')
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deletedAt', 'timestamptz')
    .execute()

  // Indexes for sensors
  await db.schema
    .createIndex('idx_sensors_farm_id')
    .on('sensors')
    .column('farmId')
    .execute()

  await db.schema
    .createIndex('idx_sensors_structure_id')
    .on('sensors')
    .column('structureId')
    .execute()

  await db.schema
    .createIndex('idx_sensors_api_key_hash')
    .on('sensors')
    .column('apiKeyHash')
    .execute()

  // Sensor readings table (time-series optimized)
  await db.schema
    .createTable('sensor_readings')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('sensorId', 'uuid', (col) =>
      col.references('sensors.id').onDelete('cascade').notNull(),
    )
    .addColumn('value', sql`decimal(12,4)`, (col) => col.notNull())
    .addColumn('recordedAt', 'timestamptz', (col) => col.notNull())
    .addColumn('isAnomaly', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('metadata', 'jsonb')
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // Time-series indexes for readings
  await db.schema
    .createIndex('idx_sensor_readings_sensor_time')
    .on('sensor_readings')
    .columns(['sensorId', 'recordedAt'])
    .execute()

  await db.schema
    .createIndex('idx_sensor_readings_recorded_at')
    .on('sensor_readings')
    .column('recordedAt')
    .execute()

  // Unique constraint for deduplication
  await db.schema
    .createIndex('idx_sensor_readings_unique')
    .on('sensor_readings')
    .columns(['sensorId', 'recordedAt'])
    .unique()
    .execute()

  // Sensor aggregates table (for hourly/daily rollups)
  await db.schema
    .createTable('sensor_aggregates')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('sensorId', 'uuid', (col) =>
      col.references('sensors.id').onDelete('cascade').notNull(),
    )
    .addColumn('periodType', 'varchar(10)', (col) => col.notNull())
    .addColumn('periodStart', 'timestamptz', (col) => col.notNull())
    .addColumn('avgValue', sql`decimal(12,4)`, (col) => col.notNull())
    .addColumn('minValue', sql`decimal(12,4)`, (col) => col.notNull())
    .addColumn('maxValue', sql`decimal(12,4)`, (col) => col.notNull())
    .addColumn('readingCount', 'integer', (col) => col.notNull())
    .execute()

  // Indexes for aggregates
  await db.schema
    .createIndex('idx_sensor_aggregates_sensor_period')
    .on('sensor_aggregates')
    .columns(['sensorId', 'periodType', 'periodStart'])
    .execute()

  await db.schema
    .createIndex('idx_sensor_aggregates_unique')
    .on('sensor_aggregates')
    .columns(['sensorId', 'periodType', 'periodStart'])
    .unique()
    .execute()

  // Sensor alerts table
  await db.schema
    .createTable('sensor_alerts')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('sensorId', 'uuid', (col) =>
      col.references('sensors.id').onDelete('cascade').notNull(),
    )
    .addColumn('alertType', 'varchar(50)', (col) => col.notNull())
    .addColumn('severity', 'varchar(20)', (col) => col.notNull())
    .addColumn('triggerValue', sql`decimal(12,4)`, (col) => col.notNull())
    .addColumn('thresholdValue', sql`decimal(12,4)`, (col) => col.notNull())
    .addColumn('message', 'text', (col) => col.notNull())
    .addColumn('acknowledged', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn('acknowledgedAt', 'timestamptz')
    .addColumn('acknowledgedBy', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // Indexes for alerts
  await db.schema
    .createIndex('idx_sensor_alerts_sensor_id')
    .on('sensor_alerts')
    .column('sensorId')
    .execute()

  await db.schema
    .createIndex('idx_sensor_alerts_created_at')
    .on('sensor_alerts')
    .column('createdAt')
    .execute()

  // Sensor alert config table
  await db.schema
    .createTable('sensor_alert_config')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('sensorId', 'uuid', (col) =>
      col.references('sensors.id').onDelete('cascade').notNull().unique(),
    )
    .addColumn('minThreshold', sql`decimal(12,4)`)
    .addColumn('maxThreshold', sql`decimal(12,4)`)
    .addColumn('warningMinThreshold', sql`decimal(12,4)`)
    .addColumn('warningMaxThreshold', sql`decimal(12,4)`)
    .addColumn('rateThreshold', sql`decimal(12,4)`)
    .addColumn('rateWindowMinutes', 'integer', (col) => col.defaultTo(60))
    .addColumn('cooldownMinutes', 'integer', (col) => col.defaultTo(30))
    .addColumn('smsEnabled', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('emailEnabled', 'boolean', (col) =>
      col.notNull().defaultTo(true),
    )
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updatedAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sensor_alert_config').ifExists().execute()
  await db.schema.dropTable('sensor_alerts').ifExists().execute()
  await db.schema.dropTable('sensor_aggregates').ifExists().execute()
  await db.schema.dropTable('sensor_readings').ifExists().execute()
  await db.schema.dropTable('sensors').ifExists().execute()
}
