---
description: 'Execute implementation plan with OpenLivestock-specific patterns and validation'
---

# Execute: Implement from Plan

Transform an implementation plan into working code for OpenLivestock Manager.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Tech Stack**: TanStack Start, Kysely ORM, Neon PostgreSQL, Cloudflare Workers
**Critical Pattern**: All database imports MUST be dynamic for Cloudflare Workers compatibility

## Step 1: Locate Plan File

First, check if we're continuing a conversation:

> Are we implementing the plan we've been discussing, or would you like to execute a different plan?
>
> Options:
>
> - If we just created a plan, I can use that
> - Provide a plan file path or feature name
> - Or I can list available plans for you

Wait for their response, then:

**If continuing from conversation:**

- Use the plan we just discussed or created

**If they provide a path** (contains `/` or `.md`):

- Read file directly
- If file doesn't exist, check: `.agents/plans/[filename]`

**If they provide a feature name**:

- Search for: `ls .agents/plans/*[name]*.md`
- If multiple matches, ask user to clarify
- If no matches, list available: `ls .agents/plans/*.md`

**If they ask to list plans**:

- List available plans: `ls .agents/plans/*.md`
- Ask them to choose one

## Prerequisites

- [ ] Plan file exists and is readable
- [ ] Dependencies installed (`bun install`)
- [ ] Database accessible (check with MCP)
- [ ] Development server can start (`bun dev`)

## MCP Integration

**Verify database before starting:**

```
neon_get_database_tables
neon_run_sql "SELECT COUNT(*) FROM batches"
```

**Check deployment status if needed:**

```
cloudflare-builds__workers_builds_list_builds
```

## Execution Process

### Step 1: Plan Analysis

**Read and understand the plan:**

Read the plan file you located in Step 1.

**Extract key information:**

- [ ] List all files to create
- [ ] List all files to modify
- [ ] Identify dependencies between tasks
- [ ] Note validation commands
- [ ] Understand testing requirements

**Ask user if unclear:** "The plan mentions [X]. Should I proceed with [interpretation] or do you want to clarify?"

### Step 2: Environment Verification

**Run pre-flight checks:**

```bash
# Verify project state (fail fast)
bun run lint || exit 1
bun run check || exit 1

# Verify database connection
bun run db:migrate --dry-run || echo "Migration check failed"
```

**If issues exist:** Fix them before proceeding or ask user for guidance.

### Step 3: Execute Tasks (In Order)

For EACH task in the plan:

#### 3a. Server Functions (Backend)

**Pattern - ALWAYS use dynamic imports:**

```typescript
// ✅ CORRECT - Works on Cloudflare Workers
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

export const getFeatureData = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      farmId: z.string().uuid(),
      // Add other params
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { db } = await import('../db') // CRITICAL: Dynamic import!

      return db
        .selectFrom('batches')
        .where('farmId', '=', data.farmId)
        .select(['id', 'batchName', 'status', 'currentQuantity'])
        .execute()
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch feature data',
        cause: error,
      })
    }
  })

// ❌ WRONG - Breaks on Cloudflare Workers
import { db } from '../db' // Static import will fail!
```

**File location:** `app/features/{feature}/server.ts`

#### 3b. Database Queries (Kysely)

**Pattern - Type-safe queries:**

```typescript
// Simple select
const batches = await db
  .selectFrom('batches')
  .where('status', '=', 'active')
  .select(['id', 'batchName', 'currentQuantity'])
  .execute()

// Join with related data
const batchesWithFarm = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.batchName', 'farms.name as farmName'])
  .execute()

// Aggregation
const stats = await db
  .selectFrom('mortality_records')
  .where('batchId', '=', batchId)
  .select([
    db.fn.sum('quantity').as('totalDeaths'),
    db.fn.count('id').as('incidents'),
  ])
  .executeTakeFirst()
```

#### 3c. React Components

**Pattern - TanStack Router integration:**

```typescript
// app/routes/_auth/feature/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getFeatureData } from '~/features/feature/server'

export const Route = createFileRoute('/_auth/feature/')({
  component: FeatureComponent,
  loader: async ({ context }) => {
    // Prefetch data
    await context.queryClient.ensureQueryData({
      queryKey: ['feature'],
      queryFn: () => getFeatureData({ farmId: context.farmId }),
    })
  },
})

function FeatureComponent() {
  const { t } = useTranslation(['feature', 'common'])
  const { data } = useSuspenseQuery({
    queryKey: ['feature'],
    queryFn: () => getFeatureData({ farmId: 'xxx' }),
  })

  return (
    <div className="p-4">
      <h1>{t('feature:title')}</h1>
      {/* Component content */}
    </div>
  )
}
```

#### 3d. Database Migrations

**Pattern - Kysely migrations:**

```typescript
// app/lib/db/migrations/YYYY-MM-DD-NNN-description.ts
import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('new_table')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('new_table').execute()
}
```

**Run migration:**

```bash
bun run db:migrate
```

### Step 4: Validation (After Each Major Change)

**Run after each file change:**

```bash
# Quick validation (fail fast)
bun run lint --fix || exit 1
bun run check || exit 1

# If tests exist for the feature
bun test app/features/{feature}/ || exit 1
```

**Run before completing:**

```bash
# Full validation suite (fail fast)
bun run lint || exit 1
bun run check || exit 1
bun test || exit 1
bun run build || exit 1
```

### Step 5: Testing (If Required by Plan)

**Pattern - Property-based tests:**

```typescript
// tests/features/feature/feature.property.test.ts
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

describe('calculateFeatureMetric', () => {
  it('should handle all valid inputs', () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat(), (a, b) => {
        const result = calculateFeatureMetric(a, b)
        expect(result).toBeGreaterThanOrEqual(0)
      }),
    )
  })
})
```

**Run tests:**

```bash
bun test
bun test --coverage
```

## OpenLivestock Key Tables Reference

| Table               | Purpose           | Key Columns                                             |
| ------------------- | ----------------- | ------------------------------------------------------- |
| `batches`           | Livestock batches | id, farmId, batchName, species, status, currentQuantity |
| `mortality_records` | Death tracking    | batchId, quantity, cause, date                          |
| `feed_records`      | Feed consumption  | batchId, feedType, quantityKg, cost                     |
| `weight_samples`    | Growth tracking   | batchId, averageWeightKg, sampleSize, date              |
| `sales`             | Revenue records   | batchId, quantity, totalAmount, customerId              |
| `expenses`          | Cost tracking     | farmId, category, amount, description                   |
| `farms`             | Farm entities     | id, name, type, location                                |
| `users`             | User accounts     | id, email, name, role                                   |

## Error Handling

### Common Issues

**Issue**: "Cannot find module '../db'"
**Solution**: Ensure dynamic import: `const { db } = await import('../db')`

**Issue**: Type errors with Kysely queries
**Solution**: Check `app/lib/db/schema.ts` for correct column names

**Issue**: Migration fails
**Solution**: Check DATABASE_URL, run `bun run db:migrate --dry-run` first

**Issue**: Build fails on Cloudflare
**Solution**: Check for static imports of Node.js modules or database

## Success Criteria

- [ ] All tasks from plan completed
- [ ] All files created/modified as specified
- [ ] `bun run lint` passes
- [ ] `bun run check` passes (no type errors)
- [ ] `bun test` passes (if tests exist)
- [ ] `bun run build` succeeds
- [ ] Feature works in browser (`bun dev`)

## Output Report

### Completed Tasks

- [ ] Task 1: [description] - ✅ Done
- [ ] Task 2: [description] - ✅ Done

### Files Created

```
app/features/feature/server.ts
app/routes/_auth/feature/index.tsx
```

### Files Modified

```
app/lib/db/schema.ts (added types)
```

### Validation Results

```bash
✅ bun run lint - passed
✅ bun run check - passed
✅ bun test - X tests passed
✅ bun run build - success
```

### Ready for Commit

All changes complete and validated. Ready for `/commit` command.

---

## Instructions for Assistant

### Workflow

1. **Read plan completely** before starting any implementation
2. **Verify environment** is ready (database, dependencies)
3. **Execute tasks in order** - don't skip ahead
4. **Validate after each change** - catch issues early
5. **Run full validation** before declaring complete
6. **Report results** with specific files and outcomes

### Key Principles

- **ALWAYS use dynamic imports** for database in server functions
- **Follow existing patterns** - check similar files first
- **Type safety first** - ensure Kysely queries are type-safe
- **Validate continuously** - don't wait until the end
- **Ask when unclear** - better to clarify than assume

## Agent Delegation

Use specialized subagents for complex tasks:

- `@backend-engineer` - Database migrations, server functions, Kysely queries
- `@frontend-engineer` - React components, UI implementation, routing
- `@qa-engineer` - Test implementation and validation
- `@devops-engineer` - Deployment issues, Cloudflare Workers debugging

### When to Stop and Ask

- Plan is ambiguous or contradictory
- Validation fails and fix is unclear
- Feature requires changes not in plan
- Database schema changes needed but not specified
