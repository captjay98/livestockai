---
description: 'Run database migrations for OpenLivestock Manager'
---

# Database Migrations

Manage Kysely database migrations for OpenLivestock Manager.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Database**: PostgreSQL via Neon (serverless)
**ORM**: Kysely (type-safe SQL)

## Pre-Migration: Verify Database Connection

Use MCP to verify database is accessible:

```
neon_get_database_tables
```

This lists all current tables and confirms connection works.

## Run Migrations

### Apply All Pending Migrations

```bash
bun run db:migrate
```

### Verify Migration Success with MCP

```
neon_get_database_tables
neon_describe_table_schema batches
```

## Create New Migration

### 1. Create Migration File

Create file in `app/lib/db/migrations/` with format:
`YYYY-MM-DD-NNN-description.ts`

Example: `2024-01-15-001-add-inventory-table.ts`

### 2. Migration Template

```typescript
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('inventory')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.references('farms.id').onDelete('cascade').notNull(),
    )
    .addColumn('itemName', 'varchar(255)', (col) => col.notNull())
    .addColumn('quantity', 'decimal(10,2)', (col) => col.notNull())
    .addColumn('unit', 'varchar(50)', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('inventory').execute()
}
```

## Rollback

### Rollback Last Migration

```bash
bun run db:rollback
```

### Rollback Multiple

```bash
bun run db:rollback --steps 3
```

## Best Practices

### Naming Conventions

- Use camelCase for column names
- Use descriptive migration names
- Include date prefix for ordering

### Safe Migrations

- Always include `down` function
- Test rollback before deploying
- Backup data before destructive changes

### Column Types

- `uuid` for IDs
- `varchar(n)` for strings
- `decimal(10,2)` for money/quantities
- `timestamp` for dates
- `boolean` for flags
- `jsonb` for flexible data

## Common Operations

### Add Column

```typescript
await db.schema.alterTable('batches').addColumn('notes', 'text').execute()
```

### Add Index

```typescript
await db.schema
  .createIndex('idx_batches_farm_id')
  .on('batches')
  .column('farmId')
  .execute()
```

### Add Foreign Key

```typescript
await db.schema
  .alterTable('feed_records')
  .addForeignKeyConstraint('fk_feed_batch', ['batchId'], 'batches', ['id'])
  .onDelete('cascade')
  .execute()
```

## Troubleshooting

### Migration fails

- Check SQL syntax
- Verify referenced tables exist
- Check for duplicate column names

### Rollback fails

- Ensure `down` function is correct
- Check for dependent data

### Verify with MCP

```
neon_run_sql "SELECT * FROM kysely_migration ORDER BY timestamp DESC LIMIT 5"
```

## Agent Delegation

- `@backend-engineer` - Complex migration logic and schema design
- `@devops-engineer` - Production migration deployment

## Related Prompts

- `@neon-optimize` - Index and query optimization after migration
- `@neon-setup` - Initial database configuration
- `@cloudflare-deploy` - Deploy with new schema
- May need manual intervention
