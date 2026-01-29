# Feature: Structured Logger Migration

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Migrate all `console.log`, `console.error`, and `console.warn` statements across the codebase to use the structured logger utility (`app/lib/logger.ts`). This ensures consistent logging behavior across development and production environments, with automatic filtering of sensitive data in production.

## User Story

As a developer
I want all logging to use a structured logger
So that logs are consistent, filterable, and don't leak sensitive data in production

## Problem Statement

The codebase currently has ~200 direct `console.*` calls scattered across components, server functions, and utilities. This creates several issues:

1. **Production noise**: Console statements execute in production, potentially logging sensitive data
2. **Inconsistent format**: No standard structure for log messages
3. **No environment awareness**: Logs appear in production even when not needed
4. **Debugging difficulty**: Hard to filter or search logs effectively
5. **Incomplete migration**: Phase 4 Task 4.15 only migrated 8 files (4% adoption)

## Solution Statement

Systematically replace all `console.*` calls with the structured logger from `app/lib/logger.ts`. The logger provides:

- **Environment-aware logging**: Only logs in development by default
- **Structured format**: Consistent `[DEBUG]`, `[INFO]`, `[ERROR]` prefixes
- **Production safety**: Filters sensitive error details in production
- **Type-safe API**: `logger.info()`, `logger.error()`, `logger.debug()`

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: All components, server functions, utilities
**Dependencies**: Existing `app/lib/logger.ts` (already implemented)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/lib/logger.ts` (all lines) - Why: The logger utility we're migrating to
- `app/components/dialogs/batch-dialog.tsx` (lines with console.error) - Why: Example of error logging pattern to migrate
- `app/components/layout/fab.tsx` (lines with console.log) - Why: Example of debug logging to migrate
- `app/features/integrations/sms/providers/console.ts` (all lines) - Why: EXCEPTION - Intentional console provider, DO NOT MIGRATE

### Files to Modify (~50 files)

**Components** (~30 files):

- `app/components/dialogs/*.tsx` - Error logging in data loading
- `app/components/batches/*.tsx` - Debug logging and error handling
- `app/components/layout/fab.tsx` - Debug logging for actions
- `app/components/feed-formulation/*.tsx` - Error logging
- `app/components/modules/*.tsx` - Error logging
- `app/components/onboarding/*.tsx` - Error logging

**Routes** (~5 files):

- `app/routes/login.tsx` - Auth logging
- Other routes with console usage

**Features** (~15 files):

- Various server functions with debug logging (comments only)

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Structured Logging Best Practices](https://betterstack.com/community/guides/logging/how-to-start-logging-with-node-js/)
  - Specific section: Log Levels and When to Use Them
  - Why: Understand when to use info vs debug vs error

### Patterns to Follow

**Migration Pattern:**

```typescript
// BEFORE:
console.log('Creating batch:', data)
console.error('Failed to load:', err)
console.warn('Deprecated feature')

// AFTER:
import { logger } from '~/lib/logger'

logger.debug('Creating batch:', data)
logger.error('Failed to load:', err)
logger.info('Deprecated feature warning')
```

**Error Handling Pattern:**

```typescript
// BEFORE:
try {
  await someOperation()
} catch (err) {
  console.error('Operation failed:', err)
  throw err
}

// AFTER:
import { logger } from '~/lib/logger'

try {
  await someOperation()
} catch (err) {
  logger.error('Operation failed:', err)
  throw err
}
```

**Debug Logging Pattern:**

```typescript
// BEFORE:
console.log('Debug info:', value)

// AFTER:
import { logger } from '~/lib/logger'

logger.debug('Debug info:', value)
```

**EXCEPTIONS - DO NOT MIGRATE:**

1. **`app/features/integrations/sms/providers/console.ts`** - Intentional console SMS provider
2. **Comments** - Lines like `// console.log(...)` are documentation, leave them
3. **Test files** - `*.test.ts` files can keep console for test output

---

## IMPLEMENTATION PLAN

### Phase 1: Preparation (5 minutes)

Verify logger utility is working and understand the API.

**Tasks:**

- Read `app/lib/logger.ts` to understand available methods
- Verify logger works in development mode
- Identify files to exclude (console.ts provider, tests, comments)

### Phase 2: Component Migration (30 minutes)

Migrate all React components to use structured logger.

**Tasks:**

- Migrate dialog components (highest priority - user-facing errors)
- Migrate layout components (FAB, navigation)
- Migrate feature-specific components (batches, feed, etc.)
- Migrate utility components

### Phase 3: Route Migration (10 minutes)

Migrate route files to use structured logger.

**Tasks:**

- Migrate login route
- Migrate any other routes with console usage

### Phase 4: Validation (10 minutes)

Ensure migration is complete and nothing broke.

**Tasks:**

- Run full test suite
- Verify no console.\* calls remain (except exceptions)
- Test in development mode
- Verify production build works

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: Verify Logger Utility

- **READ**: `app/lib/logger.ts` - Understand the API
- **VERIFY**: Logger exports `logger.info()`, `logger.error()`, `logger.debug()`
- **VERIFY**: Logger is environment-aware (only logs in development)
- **VALIDATE**: `grep -r "export.*logger" app/lib/logger.ts`

### Task 2: Identify Files to Migrate

- **EXECUTE**: `grep -r "console\." app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test.ts" | grep -v "// " | grep -v "/\*" | grep -v "console.ts" > /tmp/console-usage.txt`
- **REVIEW**: `/tmp/console-usage.txt` - List of all files to migrate
- **VALIDATE**: `wc -l /tmp/console-usage.txt` (should show ~200 lines)

### Task 3: Migrate Dialog Components (Priority 1)

- **UPDATE**: `app/components/dialogs/batch-dialog.tsx`
  - **REPLACE**: `console.error('Failed to fetch species:', err)` → `logger.error('Failed to fetch species:', err)`
  - **REPLACE**: `console.error('Failed to fetch breeds:', err)` → `logger.error('Failed to fetch breeds:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`
- **UPDATE**: `app/components/dialogs/invoice-dialog.tsx`
  - **REPLACE**: `console.error('Failed to load customers:', err)` → `logger.error('Failed to load customers:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **UPDATE**: `app/components/dialogs/egg-dialog.tsx`
  - **REPLACE**: `console.error('Failed to load batches:', err)` → `logger.error('Failed to load batches:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **UPDATE**: `app/components/dialogs/sale-dialog.tsx`
  - **REPLACE**: `console.error('Failed to load data:', err)` → `logger.error('Failed to load data:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **UPDATE**: `app/components/dialogs/expense-dialog.tsx`
  - **REPLACE**: `console.error('Failed to load suppliers:', err)` → `logger.error('Failed to load suppliers:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **UPDATE**: `app/components/dialogs/mortality-dialog.tsx`
  - **REPLACE**: `console.error('Failed to load batches:', err)` → `logger.error('Failed to load batches:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **UPDATE**: `app/components/dialogs/edit-farm-dialog.tsx`
  - **REPLACE**: `console.error('Failed to load farm:', err)` → `logger.error('Failed to load farm:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **VALIDATE**: `grep -r "console\." app/components/dialogs/ | grep -v "node_modules" | wc -l` (should be 0)

### Task 4: Migrate Batch Components

- **UPDATE**: `app/components/batches/batch-edit-dialog.tsx`
  - **REPLACE**: `console.error('Failed to fetch breeds:', err)` → `logger.error('Failed to fetch breeds:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **UPDATE**: `app/components/batches/batch-filters.tsx`
  - **REPLACE**: `console.error('Failed to fetch breeds for filter:', err)` → `logger.error('Failed to fetch breeds for filter:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **UPDATE**: `app/components/batches/command-center.tsx`
  - **REPLACE**: `console.log('Log Mortality')` → `logger.debug('Log Mortality')`
  - **REPLACE**: `console.log('Log Symptoms')` → `logger.debug('Log Symptoms')`
  - **REPLACE**: `console.log('New Sale')` → `logger.debug('New Sale')`
  - **REPLACE**: `console.log('New Expense')` → `logger.debug('New Expense')`
  - **REPLACE**: `console.log('Submitted Feed:', feedAmount)` → `logger.debug('Submitted Feed:', feedAmount)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **VALIDATE**: `grep -r "console\." app/components/batches/ | grep -v "node_modules" | wc -l` (should be 0)

### Task 5: Migrate Layout Components

- **UPDATE**: `app/components/layout/fab.tsx`
  - **REPLACE**: `console.log('Log Feed for', batchId)` → `logger.debug('Log Feed for', batchId)`
  - **REPLACE**: `console.log('Log Mortality for', batchId)` → `logger.debug('Log Mortality for', batchId)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **VALIDATE**: `grep -r "console\." app/components/layout/ | grep -v "node_modules" | wc -l` (should be 0)

### Task 6: Migrate Feed Formulation Components

- **UPDATE**: `app/components/feed-formulation/saved-formulations.tsx`
  - **REPLACE**: `console.error('Failed to generate PDF:', error)` → `logger.error('Failed to generate PDF:', error)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **VALIDATE**: `grep -r "console\." app/components/feed-formulation/ | grep -v "node_modules" | wc -l` (should be 0)

### Task 7: Migrate Module Components

- **UPDATE**: `app/components/modules/selector.tsx`
  - **REPLACE**: `console.error('Failed to fetch species:', err)` → `logger.error('Failed to fetch species:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **VALIDATE**: `grep -r "console\." app/components/modules/ | grep -v "node_modules" | wc -l` (should be 0)

### Task 8: Migrate Onboarding Components

- **UPDATE**: `app/components/onboarding/complete-step.tsx`
  - **REPLACE**: `console.error('Failed to mark onboarding complete:', err)` → `logger.error('Failed to mark onboarding complete:', err)`
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **VALIDATE**: `grep -r "console\." app/components/onboarding/ | grep -v "node_modules" | wc -l` (should be 0)

### Task 9: Migrate Remaining Components

- **EXECUTE**: `grep -r "console\." app/components/ --include="*.tsx" | grep -v "node_modules" | grep -v ".test.ts" | grep -v "// "`
- **FOR EACH FILE**:
  - Add `import { logger } from '~/lib/logger'`
  - Replace `console.log(...)` → `logger.debug(...)`
  - Replace `console.error(...)` → `logger.error(...)`
  - Replace `console.warn(...)` → `logger.info(...)`
- **VALIDATE**: `grep -r "console\." app/components/ | grep -v "node_modules" | grep -v ".test.ts" | grep -v "// " | wc -l` (should be 0)

### Task 10: Migrate Routes

- **UPDATE**: `app/routes/login.tsx`
  - Find all `console.*` calls
  - Replace with appropriate logger method
  - **ADD IMPORT**: `import { logger } from '~/lib/logger'`

- **VALIDATE**: `grep -r "console\." app/routes/ | grep -v "node_modules" | wc -l` (should be 0)

### Task 11: Final Verification

- **EXECUTE**: `grep -r "console\." app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test.ts" | grep -v "// " | grep -v "/\*" | grep -v "console.ts"`
- **VERIFY**: Only comments and the console.ts provider remain
- **VALIDATE**: `bun run check` (should pass with 0 errors)

### Task 12: Test Suite Validation

- **EXECUTE**: `bun run test --run`
- **VERIFY**: All tests pass (1719/1721 or better)
- **VALIDATE**: No test failures related to logging changes

### Task 13: Production Build Verification

- **EXECUTE**: `bun run build`
- **VERIFY**: Build completes successfully
- **VALIDATE**: No build errors related to logger imports

---

## TESTING STRATEGY

### Manual Testing

**Development Mode:**

1. Start dev server: `bun dev`
2. Open browser console
3. Trigger actions that log (open dialogs, submit forms)
4. Verify logs appear with `[DEBUG]`, `[INFO]`, `[ERROR]` prefixes
5. Verify logs are readable and helpful

**Production Mode:**

1. Build: `bun run build`
2. Set `NODE_ENV=production`
3. Start production server
4. Verify sensitive logs are filtered
5. Verify only error messages appear (no stack traces)

### Automated Testing

**Unit Tests:**

- Existing tests should continue to pass
- No new tests needed (logger is already tested)

**Integration Tests:**

- Verify logger doesn't break server functions
- Verify logger doesn't break component rendering

### Edge Cases

- **Empty messages**: `logger.info('')` should not crash
- **Undefined errors**: `logger.error('msg', undefined)` should handle gracefully
- **Multiple arguments**: `logger.debug('msg', arg1, arg2)` should work
- **Production filtering**: Sensitive data should not appear in production logs

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
# Type checking (fail fast)
npx tsc --noEmit || exit 1

# Linting (fail fast)
bun run lint || exit 1
```

### Level 2: Migration Completeness

```bash
# Count remaining console statements (should be ~6 - only comments and console.ts)
grep -r "console\." app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test.ts" | grep -v "// " | grep -v "/\*" | grep -v "console.ts" | wc -l

# Should output: 0 or very close to 0
```

### Level 3: Test Suite

```bash
# Run all tests (fail fast)
bun run test --run || exit 1
```

### Level 4: Build Verification

```bash
# Verify production build works
bun run build || exit 1
```

### Complete Validation

```bash
# Run all checks
bun run check && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All `console.log` calls replaced with `logger.debug()`
- [ ] All `console.error` calls replaced with `logger.error()`
- [ ] All `console.warn` calls replaced with `logger.info()`
- [ ] Exception: `console.ts` SMS provider unchanged
- [ ] Exception: Comments with console examples unchanged
- [ ] All validation commands pass: `bun run check && bun run test --run && bun run build`
- [ ] Test coverage maintained (1719/1721 or better)
- [ ] No regressions in existing functionality
- [ ] Logger imports added to all modified files
- [ ] Logs appear correctly in development mode
- [ ] Logs are filtered correctly in production mode
- [ ] No TypeScript errors introduced
- [ ] No ESLint errors introduced
- [ ] Production build succeeds

---

## COMPLETION CHECKLIST

- [ ] All dialog components migrated
- [ ] All batch components migrated
- [ ] All layout components migrated
- [ ] All feature components migrated
- [ ] All routes migrated
- [ ] Console usage verification passed (<10 remaining)
- [ ] Type checking passed
- [ ] Linting passed
- [ ] Test suite passed
- [ ] Production build passed
- [ ] Manual testing in dev mode passed
- [ ] Manual testing in production mode passed

---

## NOTES

### Design Decisions

**Why logger.debug() for console.log()?**

- Debug logs are development-only
- Prevents noise in production
- Consistent with logging best practices

**Why logger.info() for console.warn()?**

- Warnings are informational
- Should appear in production if needed
- Logger.info() provides appropriate level

**Why keep console.ts provider?**

- It's an intentional console-based SMS provider for development
- Migrating it would break its purpose
- It's isolated and doesn't affect production

### Trade-offs

**Pros:**

- Consistent logging across codebase
- Production-safe (no sensitive data leaks)
- Environment-aware (dev vs prod)
- Easier to search and filter logs
- Structured format

**Cons:**

- Requires import in every file
- Slightly more verbose than console.\*
- One-time migration effort

### Future Improvements

- Add log levels (trace, warn)
- Add log aggregation (Sentry, LogRocket)
- Add request ID tracking
- Add performance timing logs
