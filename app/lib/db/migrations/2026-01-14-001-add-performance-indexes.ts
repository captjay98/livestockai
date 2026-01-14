import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Add indexes for common query patterns
  
  // Batches - frequently filtered by farmId and status
  await db.schema
    .createIndex('idx_batches_farm_status')
    .on('batches')
    .columns(['farmId', 'status'])
    .execute()

  // Sales - frequently filtered by farmId and date
  await db.schema
    .createIndex('idx_sales_farm_date')
    .on('sales')
    .columns(['farmId', 'date'])
    .execute()

  // Expenses - frequently filtered by farmId and date
  await db.schema
    .createIndex('idx_expenses_farm_date')
    .on('expenses')
    .columns(['farmId', 'date'])
    .execute()

  // Feed records - frequently filtered by batchId and date
  await db.schema
    .createIndex('idx_feed_records_batch_date')
    .on('feed_records')
    .columns(['batchId', 'date'])
    .execute()

  // Mortality records - frequently filtered by batchId and date
  await db.schema
    .createIndex('idx_mortality_records_batch_date')
    .on('mortality_records')
    .columns(['batchId', 'date'])
    .execute()

  // Notifications - frequently filtered by userId and read status
  await db.schema
    .createIndex('idx_notifications_user_read')
    .on('notifications')
    .columns(['userId', 'read'])
    .execute()

  // Weight samples - frequently filtered by batchId and date
  await db.schema
    .createIndex('idx_weight_samples_batch_date')
    .on('weight_samples')
    .columns(['batchId', 'date'])
    .execute()

  // Egg records - frequently filtered by batchId and date
  await db.schema
    .createIndex('idx_egg_records_batch_date')
    .on('egg_records')
    .columns(['batchId', 'date'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_batches_farm_status').execute()
  await db.schema.dropIndex('idx_sales_farm_date').execute()
  await db.schema.dropIndex('idx_expenses_farm_date').execute()
  await db.schema.dropIndex('idx_feed_records_batch_date').execute()
  await db.schema.dropIndex('idx_mortality_records_batch_date').execute()
  await db.schema.dropIndex('idx_notifications_user_read').execute()
  await db.schema.dropIndex('idx_weight_samples_batch_date').execute()
  await db.schema.dropIndex('idx_egg_records_batch_date').execute()
}
