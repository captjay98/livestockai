import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('report_configs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(db.fn('gen_random_uuid()')),
    )
    .addColumn('createdBy', 'uuid', (col) => col.notNull())
    .addColumn('farmId', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('reportType', 'varchar(50)', (col) =>
      col
        .notNull()
        .check(
          sql`"reportType" in ('profit_loss', 'inventory', 'sales', 'feed', 'egg')`,
        ),
    )
    .addColumn('dateRangeType', 'varchar(20)', (col) =>
      col
        .notNull()
        .check(
          sql`"dateRangeType" in ('today', 'week', 'month', 'quarter', 'year', 'custom')`,
        ),
    )
    .addColumn('customStartDate', 'timestamp', (col) => col)
    .addColumn('customEndDate', 'timestamp', (col) => col)
    .addColumn('includeCharts', 'boolean', (col) =>
      col.notNull().defaultTo(true),
    )
    .addColumn('includeDetails', 'boolean', (col) =>
      col.notNull().defaultTo(true),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.notNull().defaultTo(db.fn('now()')),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.notNull().defaultTo(db.fn('now()')),
    )
    .addForeignKeyConstraint('report_configs_farmId_fk', ['farmId'], 'farms', [
      'id',
    ])
    .addForeignKeyConstraint(
      'report_configs_createdBy_fk',
      ['createdBy'],
      'users',
      ['id'],
    )
    .execute()

  // Create index for farm lookups
  await db.schema
    .createIndex('report_configs_farmId_idx')
    .on('report_configs')
    .column('farmId')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('report_configs_farmId_idx').execute()
  await db.schema.dropTable('report_configs').execute()
}
