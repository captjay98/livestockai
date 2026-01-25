# Revised Commit Plan - 2026-01-25

## Current State
- 2 commits done (router invalidation, preload+skeletons)
- 144 files staged with major improvements

## Proposed Commits (5 more)

### Commit 3: refactor(database): implement lazy database connection for Cloudflare Workers
**Time**: 21:45
**Files**: ~35
- `app/lib/db/index.ts` - New getDb() function with runtime detection
- `app/lib/db/connection.server.ts` - Server-side connection helper
- All 29 server functions - Updated to use getDb() pattern
- `app/features/auth/utils.ts`, `app/features/*/forecasting.ts`, etc.

**Impact**: Cloudflare Workers compatibility, prevents browser execution errors

### Commit 4: feat(auth): improve Better Auth integration and type safety
**Time**: 22:00
**Files**: ~10
- `app/features/auth/config.ts` - Enhanced configuration
- `app/features/auth/server.ts` - Improved auth functions
- `app/features/auth/server-middleware.ts` - Better middleware
- `app/features/users/server.ts` - Fixed createUser/setPassword
- `app/types/better-auth.d.ts` - Type definitions for custom fields
- `app/lib/logger.ts` - New logging utility

**Impact**: Better type safety, proper user management

### Commit 5: feat(landing): enhance landing pages with improved UX
**Time**: 22:15
**Files**: 29 landing components + pricing route
- Updated all 22 existing landing components
- Added 7 new pricing components (already committed earlier, but enhanced)
- Improved animations, responsive design, content

**Impact**: Professional marketing pages

### Commit 6: test: refactor integration tests for better readability
**Time**: 22:30
**Files**: 5 integration test files
- `tests/integration/auth.integration.test.ts`
- `tests/integration/batches.integration.test.ts`
- `tests/integration/expenses.integration.test.ts`
- `tests/integration/invoices.integration.test.ts`
- `tests/integration/sales.integration.test.ts`

**Impact**: Better formatted, more maintainable tests

### Commit 7: chore: update dependencies, docs, and remaining improvements
**Time**: 23:00
**Files**: Remaining ~70 files
- `package.json`, `bun.lock` - Dependencies
- `DEVLOG.md`, `AGENTS.md` - Documentation
- Dialogs, hooks, contexts - Various improvements
- Test files - Minor updates
- Agent plans - Planning documents

**Impact**: Complete codebase update

---

## Total: 7 commits for 2026-01-25
1. Router invalidation (BREAKING) - 20:00 ✅
2. Preload + Skeletons - 21:30 ✅
3. Database refactoring - 21:45
4. Better Auth improvements - 22:00
5. Landing pages - 22:15
6. Integration tests - 22:30
7. Dependencies & docs - 23:00
