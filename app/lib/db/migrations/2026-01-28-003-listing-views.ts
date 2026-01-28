import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('listing_views')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('listingId', 'uuid', (col) =>
      col.notNull().references('marketplace_listings.id').onDelete('cascade'),
    )
    .addColumn('viewerId', 'uuid', (col) => col.references('users.id'))
    .addColumn('viewerIp', 'varchar(45)')
    .addColumn('viewedAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // Indexes
  await db.schema
    .createIndex('idx_listing_views_listing')
    .on('listing_views')
    .column('listingId')
    .execute()

  await db.schema
    .createIndex('idx_listing_views_date')
    .on('listing_views')
    .column('viewedAt')
    .execute()

  // Unique constraint for deduplication: one view per user per listing per day
  // Using a partial unique index for authenticated users
  await sql`CREATE UNIQUE INDEX idx_listing_views_user_daily 
    ON listing_views (listing_id, viewer_id, (viewed_at::date)) 
    WHERE viewer_id IS NOT NULL`.execute(db)

  // For anonymous users, dedupe by IP per day
  await sql`CREATE UNIQUE INDEX idx_listing_views_ip_daily 
    ON listing_views (listing_id, viewer_ip, (viewed_at::date)) 
    WHERE viewer_id IS NULL AND viewer_ip IS NOT NULL`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('listing_views').execute()
}
