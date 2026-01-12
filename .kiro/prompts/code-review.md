---
description: 'Comprehensive code review for OpenLivestock Manager with project-specific patterns'
argument-hint: "[file-path or 'staged' or 'recent']"
---

# Code Review: OpenLivestock Manager

Perform comprehensive technical code review with OpenLivestock-specific pattern validation.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Tech Stack**: TanStack Start, Kysely ORM, Neon PostgreSQL, Cloudflare Workers, Better Auth
**Critical**: All server functions MUST use dynamic imports for Cloudflare Workers compatibility

## Review Scope

**Target**: `$ARGUMENTS`
- `staged` - Review git staged files
- `recent` - Review last commit
- `[file-path]` - Review specific file(s)
- No argument - Review all uncommitted changes

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
git diff --cached --name-only

# For recent commit
git diff HEAD~1 --name-only

# For all uncommitted
git diff --name-only && git ls-files --others --exclude-standard
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
    const { db } = await import('../db')  // Dynamic import!
    return db.selectFrom('batches').where('farmId', '=', data.farmId).execute()
  })

// ❌ WRONG - Breaks on Cloudflare Workers
import { db } from '../db'  // Static import at top level
export const getBatches = createServerFn({ method: 'GET' })
  .handler(async () => {
    return db.selectFrom('batches').execute()  // Will fail!
  })
```

**Detection command:**
```bash
# Find violations - static db imports in server files
grep -rn "^import.*{ db }.*from" app/lib/*/server.ts
grep -rn "^import.*db.*from.*\/db" app/lib/
```

### 2. Input Validation (Zod)

**All server functions MUST have Zod validation:**

```typescript
// ✅ CORRECT - Validated input
export const createBatch = createServerFn({ method: 'POST' })
  .validator(z.object({
    farmId: z.string().uuid(),
    batchName: z.string().min(1).max(100),
    species: z.enum(['broiler', 'catfish', 'layer', 'tilapia']),
    initialQuantity: z.number().int().positive(),
  }))
  .handler(async ({ data }) => { /* ... */ })

// ❌ WRONG - No validation
export const createBatch = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    // data is unvalidated - security risk!
  })
```

### 3. Better Auth Security

**Check authentication patterns:**

```typescript
// ✅ CORRECT - Protected route
export const Route = createFileRoute('/_auth/batches')({
  // _auth prefix ensures authentication
})

// ✅ CORRECT - Server-side auth check
.handler(async ({ data, context }) => {
  const session = await getSession(context.request)
  if (!session) throw new Error('Unauthorized')
})

// ❌ WRONG - Unprotected sensitive route
export const Route = createFileRoute('/admin/users')({
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
  .selectAll()  // Avoid in production
  .execute()

// ✅ CORRECT - Type-safe joins
const batchesWithFarm = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.batchName', 'farms.name as farmName'])
  .execute()

// ❌ WRONG - N+1 query pattern
for (const batch of batches) {
  const farm = await db.selectFrom('farms').where('id', '=', batch.farmId).execute()
  // This creates N+1 queries!
}
```

### 5. Currency Formatting (Nigerian Naira)

```typescript
// ✅ CORRECT - Use formatCurrency utility
import { formatCurrency } from '~/lib/currency'
const display = formatCurrency(amount)  // ₦1,234,567.89

// ❌ WRONG - Manual formatting
const display = `₦${amount.toFixed(2)}`  // Missing thousands separator
const display = `$${amount}`  // Wrong currency!
```

### 6. Error Handling

```typescript
// ✅ CORRECT - Proper error handling
.handler(async ({ data }) => {
  try {
    const { db } = await import('../db')
    return await db.selectFrom('batches').execute()
  } catch (error) {
    console.error('Failed to fetch batches:', error)
    throw new Error('Failed to load batches. Please try again.')
  }
})

// ❌ WRONG - No error handling
.handler(async ({ data }) => {
  const { db } = await import('../db')
  return db.selectFrom('batches').execute()  // Unhandled errors!
})
```

## 📋 Standard Checks

### 7. TypeScript Types

- [ ] No `any` types (use proper types from `~/lib/db/schema`)
- [ ] Proper return types on functions
- [ ] Type imports use `import type`

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

### 9. Performance

- [ ] No N+1 queries (use joins or batch queries)
- [ ] Large lists use virtualization or pagination
- [ ] Images use lazy loading
- [ ] Heavy imports are code-split

### 10. Accessibility

- [ ] Form inputs have labels
- [ ] Buttons have accessible names
- [ ] Color contrast is sufficient
- [ ] Keyboard navigation works

## Validation Commands

```bash
# Run after review to verify fixes
bun run lint
bun run check
bun test
bun run build
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

```
🚨 CRITICAL | ⚠️ HIGH | 📋 MEDIUM | 💡 LOW

**File**: `app/lib/batches/server.ts`
**Line**: 42
**Issue**: Static database import breaks Cloudflare Workers
**Code**:
```typescript
import { db } from '../db'  // ❌ Static import
```
**Fix**:
```typescript
const { db } = await import('../db')  // ✅ Dynamic import
```
```

### OpenLivestock-Specific Issues

Highlight any violations of:
- Dynamic import pattern
- Currency formatting
- Auth protection
- Offline compatibility

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

### When to Escalate
- Security vulnerabilities found
- Data loss risks identified
- Architectural concerns
- Breaking changes to public APIs
