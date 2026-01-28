import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('listing_contact_requests')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('listingId', 'uuid', (col) =>
      col.notNull().references('marketplace_listings.id').onDelete('cascade'),
    )
    .addColumn('buyerId', 'uuid', (col) =>
      col.notNull().references('users.id'),
    )
    // Request details
    .addColumn('message', 'text', (col) => col.notNull())
    .addColumn('contactMethod', 'varchar(10)', (col) => col.notNull())
    .addColumn('phoneNumber', 'varchar(20)')
    .addColumn('email', 'varchar(255)')
    // Response
    .addColumn('status', 'varchar(20)', (col) =>
      col.notNull().defaultTo('pending'),
    )
    .addColumn('responseMessage', 'text')
    .addColumn('respondedAt', 'timestamptz')
    // Timestamps
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    // Prevent duplicate requests from same buyer
    .addUniqueConstraint('uq_contact_request_listing_buyer', [
      'listingId',
      'buyerId',
    ])
    .execute()

  // Indexes
  await db.schema
    .createIndex('idx_contact_requests_listing')
    .on('listing_contact_requests')
    .column('listingId')
    .execute()

  await db.schema
    .createIndex('idx_contact_requests_buyer')
    .on('listing_contact_requests')
    .column('buyerId')
    .execute()

  await db.schema
    .createIndex('idx_contact_requests_status')
    .on('listing_contact_requests')
    .column('status')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('listing_contact_requests').execute()
}
