---
name: Plan Feature
description: Create comprehensive feature plans with deep codebase analysis
---

# Plan Feature

Transform a feature request into a comprehensive implementation plan for OpenLivestock Manager.

## When to Use

- Starting new feature development
- Complex changes requiring planning
- When you need a detailed implementation roadmap

## Process

### 1. Feature Understanding

- Extract what needs to be built/fixed/changed
- Identify user value and business impact
- Determine feature type: New/Enhancement/Refactor/Bug Fix

### 2. Codebase Analysis

**OpenLivestock Structure:**

- Server functions: `app/features/{feature}/server.ts`
- Types: `app/lib/db/types.ts` or `app/features/{feature}/types.ts`
- Routes: `app/routes/_auth/{feature}/`
- Components: `app/components/ui/` or `app/components/dialogs/`
- Database: `app/lib/db/migrations/`

### 3. Plan Structure

Create a plan with:

- Feature description and user story
- Files to create/modify
- Patterns to follow (dynamic imports, error handling)
- Step-by-step tasks
- Validation commands

### 4. Output

Save plan to `.agents/plans/{feature-name}.md`

## Key Patterns

Always include:

- Dynamic imports: `const { db } = await import('~/lib/db')`
- Error handling: Use `AppError` with typed codes
- Currency: Use `useFormatCurrency()` hook
- i18n: Use `useTranslation()` hook
- Auth: Use `requireAuth()` and `checkFarmAccess()`

## Validation Commands

```bash
bun run check && bun test --run && bun run build
```
