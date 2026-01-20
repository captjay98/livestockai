---
name: Neon Migrate
description: Database migration management for OpenLivestock
---

# Neon Migrate

Manage database migrations with Kysely.

## Commands

```bash
# Generate new migration from schema changes
bun run db:generate

# Apply pending migrations
bun run db:migrate

# Check migration status
bun run db:status
```

## Creating a Migration

1. Modify schema types in `app/lib/db/types.ts`
2. Generate migration:
   ```bash
   bun run db:generate --name add_new_column
   ```
3. Review generated migration in `app/lib/db/migrations/`
4. Apply migration:
   ```bash
   bun run db:migrate
   ```

## Migration File Structure

```typescript
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('batches')
    .addColumn('newColumn', 'varchar(255)')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('batches').dropColumn('newColumn').execute()
}
```

## Production Migrations

Run against production Neon:

```bash
DATABASE_URL="prod-url" bun run db:migrate
```
