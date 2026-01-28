import { sql } from 'kysely'
import type { Kysely } from 'kysely'

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

  // Unique constraint for deduplication: one view per user per listing
  // Using a partial unique index for authenticated users
  await sql`CREATE UNIQUE INDEX idx_listing_views_user_unique 
    ON listing_views ("listingId", "viewerId") 
    WHERE "viewerId" IS NOT NULL`.execute(db)

  // For anonymous users, dedupe by IP (one view per IP per listing)
  await sql`CREATE UNIQUE INDEX idx_listing_views_ip_unique 
    ON listing_views ("listingId", "viewerIp") 
    WHERE "viewerId" IS NULL AND "viewerIp" IS NOT NULL`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('listing_views').execute()
}
