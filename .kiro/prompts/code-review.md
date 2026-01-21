---
description: 'Comprehensive code review for OpenLivestock Manager with project-specific patterns'
---

# Code Review: OpenLivestock Manager

Perform comprehensive technical code review with OpenLivestock-specific pattern validation.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Tech Stack**: TanStack Start, Kysely ORM, Neon PostgreSQL, Cloudflare Workers, Better Auth
**Critical**: All server functions MUST use dynamic imports for Cloudflare Workers compatibility

## Step 1: Determine Review Scope

First, check if we're continuing a conversation:

> Are we reviewing the code we've been working on, or would you like to review something else?
>
> Options:
>
> - If we just made changes, I can review those
> - `staged` - Review git staged files
> - `recent` - Review last commit
> - A specific file path
> - Or describe what you'd like reviewed

Wait for their response, then:

**If continuing from conversation:**

- Review the files we just modified or discussed

**If they say `staged`:**

- Review git staged files: `git diff --cached --name-only`

**If they say `recent`:**

- Review last commit: `git diff HEAD~1 --name-only`

**If they say `all` or `codebase`:**

- Review entire codebase: `find app -name "*.ts" -o -name "*.tsx"`

**If they provide a file path:**

- Review specific file(s): Use provided path(s)

**If they want uncommitted changes:**

- Review all uncommitted: `git diff --name-only && git ls-files --others --exclude-standard`

**Filter to relevant files:**

- Include: `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- Exclude: `*.test.ts`, `*.test.tsx`, `node_modules/`, `dist/`, `.vinxi/`

## MCP Integration

**Check database schema for type validation:**

```
neon_get_database_tables
neon_describe_table_schema "batches"
```

**Verify deployment compatibility:**

```
cloudflare-builds__workers_builds_list_builds
```

## Review Process

### Step 1: Gather Changed Files

```bash
# For staged files
git diff --cached --name-only | grep -E '\.(ts|tsx)$' | grep -v test

# For recent commit
git diff HEAD~1 --name-only | grep -E '\.(ts|tsx)$' | grep -v test

# For entire codebase
find app -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*" ! -path "*/node_modules/*"

# For all uncommitted
git diff --name-only | grep -E '\.(ts|tsx)$' | grep -v test
git ls-files --others --exclude-standard | grep -E '\.(ts|tsx)$' | grep -v test
```

### Step 2: Read Full Context

For each changed file, read the ENTIRE file (not just diff) to understand context.

### Step 3: Apply Review Checklist

## 🚨 Critical Checks (MUST Pass)

### 1. Server Function Pattern (Cloudflare Workers)

**CRITICAL**: All database operations MUST use dynamic imports.

```typescript
// ✅ CORRECT - Works on Cloudflare Workers
export const getBatches = createServerFn({ method: 'GET' })
  .validator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db') // Dynamic import!
    return db.selectFrom('batches').where('farmId', '=', data.farmId).execute()
  })

// ❌ WRONG - Breaks on Cloudflare Workers
import { db } from '~/lib/db' // Static import at top level
export const getBatches = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.selectFrom('batches').execute() // Will fail!
  },
)
```

**Detection command:**

```bash
# Find violations - static db imports in server files
grep -rn "^import.*{ db }.*from" app/features/*/server.ts
grep -rn "^import.*db.*from.*\/db" app/features/
```

### 2. Input Validation (Zod)

**All server functions MUST have Zod validation:**

```typescript
// ✅ CORRECT - Validated input
export const createBatch = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      farmId: z.string().uuid(),
      batchName: z.string().min(1).max(100),
      species: z.enum(['broiler', 'catfish', 'layer', 'tilapia']),
      initialQuantity: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    /* ... */
  })

// ❌ WRONG - No validation
export const createBatch = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    // data is unvalidated - security risk!
  },
)
```

### 3. Better Auth Security

**Check authentication patterns:**

```typescript
// ✅ CORRECT - Protected route
export const Route = createFileRoute('/_auth/batches/')({
  // _auth prefix ensures authentication
})

// ✅ CORRECT - Server-side auth check with AppError
import { AppError } from '~/lib/errors'

export const getData = createServerFn({ method: 'GET' }).handler(
  async ({ data, context }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    // session.user.id is now available
  },
)

// ❌ WRONG - Unprotected sensitive route
export const Route = createFileRoute('/admin/users/')({
  // Missing _auth prefix!
})
```

## ⚠️ High Priority Checks

### 4. Kysely Query Patterns

```typescript
// ✅ CORRECT - Explicit column selection
const batches = await db
  .selectFrom('batches')
  .select(['id', 'batchName', 'status', 'currentQuantity'])
  .where('farmId', '=', farmId)
  .execute()

// ❌ AVOID - Select all (performance, security)
const batches = await db
  .selectFrom('batches')
  .selectAll() // Avoid in production
  .execute()

// ✅ CORRECT - Type-safe joins
const batchesWithFarm = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.batchName', 'farms.name as farmName'])
  .execute()

// ❌ WRONG - N+1 query pattern
for (const batch of batches) {
  const farm = await db
    .selectFrom('farms')
    .where('id', '=', batch.farmId)
    .execute()
  // This creates N+1 queries!
}
```

### 5. Currency Formatting (Multi-Currency)

```typescript
// ✅ CORRECT - Use currency hook (respects user settings)
import { useFormatCurrency } from '~/features/settings'

function SalesCard() {
  const { format: formatCurrency, symbol } = useFormatCurrency()
  return <div>{formatCurrency(amount)}</div> // $1,234.56 or ₦1,234.56 or €1,234.56
}

// ❌ WRONG - Hardcoded currency
const display = `₦${amount.toFixed(2)}` // Ignores user settings!
const display = `$${amount}` // Wrong for Nigerian users!

// ✅ CORRECT - Server-side currency operations
import { multiply, divide, toDbString, toNumber } from '~/features/settings/currency'

const totalCost = multiply(quantity, pricePerUnit) // Safe multiplication
const dbValue = toDbString(totalCost) // Convert to DB string
const displayValue = toNumber(dbString) // Convert from DB string
```

### 6. Error Handling (AppError System)

```typescript
// ✅ CORRECT - Centralized error handling
import { AppError } from '~/lib/errors'

export const getBatches = createServerFn({ method: 'GET' })
  .handler(async ({ data }) => {
    try {
      const { db } = await import('~/lib/db')
      const { checkFarmAccess } = await import('~/features/auth/utils')

      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess) {
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
      }

      return await db.selectFrom('batches').execute()
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch batches',
        cause: error,
      })
    }
  })

  // ❌ WRONG - Generic error handling
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    return db.selectFrom('batches').execute() // Unhandled errors!
  })

// ❌ WRONG - Non-specific error
throw new Error('Something went wrong') // Use AppError codes!
```

**Detection command:**

```bash
# Find generic Error throws in server files
grep -rn "throw new Error" app/features/*/server.ts
```

## 📋 Standard Checks

### 7. TypeScript Types

- [ ] No `any` types (use proper types from `~/lib/db/types`)
- [ ] Proper return types on functions
- [ ] Type imports use `import type`
- [ ] Database column types match schema

**Detection command:**

```bash
# Find any types in source files (excluding tests)
grep -rn ": any" app --include="*.ts" --include="*.tsx" --exclude="*.test.*"
```

### 8. React Patterns

```typescript
// ✅ CORRECT - Proper hooks usage
function BatchList() {
  const { data } = useSuspenseQuery({
    queryKey: ['batches', farmId],
    queryFn: () => getBatches({ farmId }),
  })
  return <div>{/* ... */}</div>
}

// ❌ WRONG - Missing dependency in queryKey
const { data } = useSuspenseQuery({
  queryKey: ['batches'],  // Missing farmId - stale data risk!
  queryFn: () => getBatches({ farmId }),
})
```

### 9. Internationalization (i18n)

```typescript
// ✅ CORRECT - Using translation keys
import { useTranslation } from 'react-i18next'

function BatchCard() {
  const { t } = useTranslation(['batches', 'common'])
  return (
    <div>
      <h2>{t('batches:title')}</h2>
      <p>{t('common:status')}</p>
    </div>
  )
}

// ❌ WRONG - Hardcoded strings
function BatchCard() {
  return (
    <div>
      <h2>Batches</h2>  {/* Should use t('batches:title') */}
      <p>Status</p>     {/* Should use t('common:status') */}
    </div>
  )
}
```

**Detection command:**

```bash
# Find hardcoded user-facing strings in components
grep -rn "return.*<.*>.*[A-Z][a-z]" app/routes app/components --include="*.tsx" | grep -v "t('" | head -20
```

### 9. Performance

- [ ] No N+1 queries (use joins or batch queries)
- [ ] Large lists use virtualization or pagination
- [ ] Images use lazy loading
- [ ] Heavy imports are code-split

**Detection command:**

```bash
# Find potential N+1 patterns (loops with await)
grep -rn "for.*of.*{" app/features --include="*.ts" -A 3 | grep "await db"
```

### 10. Accessibility

- [ ] Form inputs have labels
- [ ] Buttons have accessible names
- [ ] Color contrast is sufficient
- [ ] Keyboard navigation works

## Validation Commands

```bash
# Type checking
npx tsc --noEmit || exit 1

# Linting
bun run lint || exit 1

# Tests (if applicable)
bun test --run || exit 1

# Build verification
bun run build || exit 1
```

**Run all validation:**

```bash
bun run check && bun test --run && bun run build
```

## Output Format

### Review Summary

```
📊 Code Review Results
━━━━━━━━━━━━━━━━━━━━━━
Files Reviewed: X
Issues Found: X (🚨 Critical: X, ⚠️ High: X, 📋 Medium: X, 💡 Low: X)
```

### Issues Found

For each issue:

````
🚨 CRITICAL | ⚠️ HIGH | 📋 MEDIUM | 💡 LOW

**File**: `app/features/batches/server.ts`
**Line**: 42
**Issue**: Static database import breaks Cloudflare Workers
**Code**:
```typescript
import { db } from '~/lib/db'  // ❌ Static import
````

**Fix**:

```typescript
const { db } = await import('../db') // ✅ Dynamic import
```

```

### OpenLivestock-Specific Issues

Highlight any violations of:
- **Dynamic import pattern** - Static db imports in server functions
- **Currency formatting** - Hardcoded currency symbols or missing useFormatCurrency
- **Auth protection** - Unprotected routes or missing requireAuth
- **Error handling** - Generic Error instead of AppError
- **i18n** - Hardcoded user-facing strings instead of translation keys
- **Offline compatibility** - Features that break without internet

### Recommendations

1. **Priority fixes** (must fix before merge)
2. **Suggested improvements** (nice to have)
3. **Future considerations** (tech debt to track)

## Success Criteria

- [ ] No 🚨 CRITICAL issues remaining
- [ ] No ⚠️ HIGH issues remaining (or documented exceptions)
- [ ] `bun run lint` passes
- [ ] `bun run check` passes
- [ ] `bun run build` succeeds

---

## Instructions for Assistant

### Workflow
1. **Identify files** to review based on argument
2. **Read full context** of each file (not just diffs)
3. **Apply checklist** systematically
4. **Prioritize issues** by severity
5. **Provide actionable fixes** with code examples
6. **Run validation** to confirm fixes work

### Key Principles
- **Be specific** - Include file paths and line numbers
- **Provide fixes** - Don't just identify problems
- **Prioritize correctly** - Security > Logic > Performance > Style
- **Consider context** - Understand why code was written that way
- **Be constructive** - Focus on improvement, not criticism

## Agent Delegation

Use specialized subagents for deep reviews:

- `@backend-engineer` - Server functions, database queries, API design
- `@frontend-engineer` - React components, hooks, state management
- `@security-engineer` - Security vulnerabilities, auth issues
- `@qa-engineer` - Test coverage and quality

### When to Escalate
- Security vulnerabilities found
- Data loss risks identified
- Architectural concerns
- Breaking changes to public APIs
```
