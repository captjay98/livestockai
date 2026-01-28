import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
    // Access requests table
    await db.schema
        .createTable('access_requests')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`),
        )
        .addColumn('requesterId', 'uuid', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('farmId', 'uuid', (col) =>
            col.notNull().references('farms.id').onDelete('cascade'),
        )
        .addColumn('purpose', 'text', (col) => col.notNull())
        .addColumn('requestedDurationDays', 'integer', (col) =>
            col.defaultTo(90),
        )
        .addColumn('status', 'varchar(20)', (col) => col.defaultTo('pending'))
        .addColumn('responderId', 'uuid', (col) =>
            col.references('users.id').onDelete('set null'),
        )
        .addColumn('rejectionReason', 'text')
        .addColumn('respondedAt', 'timestamp')
        .addColumn('expiresAt', 'timestamp', (col) =>
            col.defaultTo(sql`NOW() + INTERVAL '30 days'`),
        )
        .addColumn('createdAt', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
        .addCheckConstraint(
            'check_request_status',
            sql`status IN ('pending', 'approved', 'denied', 'expired')`,
        )
        .addCheckConstraint(
            'check_duration_range',
            sql`requested_duration_days BETWEEN 30 AND 365`,
        )
        .execute()

    await db.schema
        .createIndex('idx_access_requests_farm_status')
        .on('access_requests')
        .columns(['farmId', 'status'])
        .execute()

    await db.schema
        .createIndex('idx_access_requests_requester')
        .on('access_requests')
        .columns(['requesterId', 'status'])
        .execute()

    await sql`CREATE INDEX idx_access_requests_pending ON access_requests(status, expires_at) WHERE status = 'pending'`.execute(
        db,
    )

    // Access grants table
    await db.schema
        .createTable('access_grants')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`),
        )
        .addColumn('userId', 'uuid', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('farmId', 'uuid', (col) =>
            col.notNull().references('farms.id').onDelete('cascade'),
        )
        .addColumn('accessRequestId', 'uuid', (col) =>
            col.references('access_requests.id').onDelete('set null'),
        )
        .addColumn('grantedBy', 'uuid', (col) =>
            col.references('users.id').onDelete('set null'),
        )
        .addColumn('grantedAt', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
        .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
        .addColumn('financialVisibility', 'boolean', (col) =>
            col.defaultTo(false),
        )
        .addColumn('revokedAt', 'timestamp')
        .addColumn('revokedBy', 'uuid', (col) =>
            col.references('users.id').onDelete('set null'),
        )
        .addColumn('revokedReason', 'text')
        .execute()

    // Partial unique index for active grants
    await sql`CREATE UNIQUE INDEX idx_active_access_grant ON access_grants(user_id, farm_id) WHERE revoked_at IS NULL`.execute(
        db,
    )

    // Composite index for access check queries
    await db.schema
        .createIndex('idx_access_grants_check')
        .on('access_grants')
        .columns(['userId', 'farmId', 'expiresAt', 'revokedAt'])
        .execute()

    // Index for expiration cron job
    await sql`CREATE INDEX idx_access_grants_expiring ON access_grants(expires_at) WHERE revoked_at IS NULL`.execute(
        db,
    )

    await db.schema
        .createIndex('idx_access_grants_farm')
        .on('access_grants')
        .column('farmId')
        .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('access_grants').execute()
    await db.schema.dropTable('access_requests').execute()
}
