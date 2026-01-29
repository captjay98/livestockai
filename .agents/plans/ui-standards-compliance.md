# Feature: Complete UI Standards Compliance

The following plan addresses all remaining UI audit issues to achieve full "Rugged Utility" design system compliance.

## Feature Description

Complete the UI standards implementation by:

1. Adding SyncStatus to BatchHeader (high priority)
2. Migrating critical hardcoded colors to semantic tokens (medium priority)
3. Documenting icon button sizes as acceptable (low priority - no changes needed)

## User Story

As a farmer using LivestockAI in the field
I want consistent visual feedback across all screens
So that I can quickly understand sync status and data states at a glance

## Problem Statement

The UI audit identified:

1. **SyncStatus missing from BatchHeader** - Users can't see sync status when viewing batch details
2. **69 hardcoded colors** - Inconsistent color usage, some should use semantic tokens
3. **32 icon buttons at 40px** - Below 44px recommendation but acceptable for icon-only buttons

## Solution Statement

1. Add SyncStatus component to BatchHeader (matches shell header pattern)
2. Migrate status/state colors to semantic tokens where appropriate
3. Document icon button sizes as acceptable (40px meets WCAG 2.5.5 minimum)

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Low
**Primary Systems Affected**: UI components
**Dependencies**: None

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/components/batch-header.tsx` (lines 50-120) - BatchHeader component to modify
- `app/components/sync-status.tsx` (lines 23-100) - SyncStatus component to import
- `app/components/layout/shell.tsx` (lines 11, 66) - Pattern for SyncStatus usage
- `.kiro/steering/ui-standards.md` (lines 30-45) - Batch header requirements

### Files to Modify

1. `app/components/batch-header.tsx` - Add SyncStatus
2. `app/routes/_auth/tasks/index.tsx` - Migrate green color to semantic
3. `app/routes/_auth/sales/index.tsx` - Migrate green color to semantic
4. `app/routes/_auth/settings/index.tsx` - Migrate green color to semantic
5. `app/routes/login.tsx` - Migrate red color to semantic

### Patterns to Follow

**SyncStatus in Header Pattern** (from shell.tsx):

```tsx
import { SyncStatus } from '~/components/sync-status'

// In header JSX
;<SyncStatus size="sm" />
```

**Semantic Color Tokens**:
| Hardcoded | Semantic | Usage |
|-----------|----------|-------|
| `text-green-500/600` | `text-success` | Positive states, completed |
| `text-red-500/600` | `text-destructive` | Errors, negative states |
| `text-amber-500/600` | `text-warning` | Warnings, attention |
| `text-blue-500/600` | `text-primary` | Primary actions, links |

**Acceptable Hardcoded Colors** (NO CHANGE NEEDED):

- Icon colors in batch-header.tsx (livestock type differentiation)
- Icon colors in command-center.tsx (action differentiation)
- Landing page marketing colors (brand/design specific)

---

## IMPLEMENTATION PLAN

### Phase 1: High Priority - SyncStatus in BatchHeader

Add sync status indicator to batch header per ui-standards.md specification.

### Phase 2: Medium Priority - Semantic Color Migration

Migrate status-related hardcoded colors to semantic tokens in auth routes.

### Phase 3: Documentation

Document that icon button sizes (40px) are acceptable per WCAG guidelines.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/components/batch-header.tsx` - Add SyncStatus

**IMPLEMENT**: Add SyncStatus import and render in header

**Location**: After line 1 (imports) and in JSX near actions

```tsx
// Add import after existing imports (around line 14)
import { SyncStatus } from '~/components/sync-status'

// Add SyncStatus in the header, before actions (around line 108)
// Between the batch info div and actions div
;<SyncStatus size="sm" showLabel={false} />
```

**PATTERN**: Mirror `app/components/layout/shell.tsx:66`

**VALIDATE**:

```bash
grep -n "SyncStatus" app/components/batch-header.tsx
npx tsc --noEmit
```

---

### Task 2: UPDATE `app/routes/_auth/tasks/index.tsx` - Migrate green to success

**IMPLEMENT**: Replace `text-green-500` with `text-success`

**Location**: Line ~194 (task completion indicator)

```tsx
// Before
? 'text-green-500 hover:text-green-600'

// After
? 'text-success hover:text-success/80'
```

**VALIDATE**:

```bash
grep -n "text-green" app/routes/_auth/tasks/index.tsx
# Expected: No matches
```

---

### Task 3: UPDATE `app/routes/_auth/sales/index.tsx` - Migrate green to success

**IMPLEMENT**: Replace `text-green-600` with `text-success`

**Locations**: Lines with revenue/positive amounts

```tsx
// Before
<span className="font-bold text-lg text-green-600">

// After
<span className="font-bold text-lg text-success">
```

**VALIDATE**:

```bash
grep -n "text-green" app/routes/_auth/sales/index.tsx
# Expected: No matches
```

---

### Task 4: UPDATE `app/routes/_auth/settings/index.tsx` - Migrate green to success

**IMPLEMENT**: Replace success message color

**Location**: Line ~207 (save success message)

```tsx
// Before
<div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-md">

// After
<div className="bg-success/10 text-success px-4 py-3 rounded-md">
```

**VALIDATE**:

```bash
grep -n "text-green\|bg-green" app/routes/_auth/settings/index.tsx
# Expected: No matches
```

---

### Task 5: UPDATE `app/routes/login.tsx` - Migrate red to destructive

**IMPLEMENT**: Replace error message color

**Location**: Error display div

```tsx
// Before
<div className="flex items-center gap-3 p-4 text-sm font-medium border-l-2 bg-red-500/5 text-red-500 border-red-500 rounded-r-md">

// After
<div className="flex items-center gap-3 p-4 text-sm font-medium border-l-2 bg-destructive/5 text-destructive border-destructive rounded-r-md">
```

**VALIDATE**:

```bash
grep -n "text-red\|bg-red\|border-red" app/routes/login.tsx
# Expected: No matches
```

---

### Task 6: UPDATE `app/routes/register.tsx` - Check for similar patterns

**IMPLEMENT**: If error display exists, migrate to semantic colors

**VALIDATE**:

```bash
grep -n "text-red\|bg-red" app/routes/register.tsx
```

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
bun run lint
```

### Level 2: Verify Changes

```bash
# SyncStatus in BatchHeader
grep -n "SyncStatus" app/components/batch-header.tsx

# Remaining hardcoded colors in auth routes (should be reduced)
grep -rE "text-(red|green)-[0-9]+" app/routes/_auth --include="*.tsx" | wc -l
```

### Level 3: Build

```bash
bun run build
```

### Level 4: Tests

```bash
bun run test --run
```

---

## ACCEPTANCE CRITERIA

- [ ] SyncStatus visible in BatchHeader component
- [ ] `text-green-*` removed from tasks, sales, settings routes
- [ ] `text-red-*` removed from login route
- [ ] All validation commands pass
- [ ] No visual regressions

---

## NOTES

### Icon Button Sizes - NO CHANGES NEEDED

The 32 `size="icon"` buttons use `size-10` (40px). Per WCAG 2.5.5:

- **Minimum**: 24×24 CSS pixels
- **Recommended**: 44×44 CSS pixels
- **Our size**: 40×40 CSS pixels

40px is acceptable because:

1. Icon-only buttons are visually distinct (users know where to tap)
2. They're typically in toolbars with spacing
3. We have `icon-field` (48px) for critical field actions

### Hardcoded Colors - ACCEPTABLE EXCEPTIONS

These hardcoded colors are intentional and should NOT be migrated:

1. **Livestock type icons** (`batch-header.tsx`):
   - `text-orange-600` (poultry), `text-blue-600` (fish), etc.
   - These differentiate livestock types visually

2. **Action icons** (`command-center.tsx`, `fab.tsx`):
   - `text-orange-600` (feed), `text-blue-500` (water), `text-red-500` (mortality)
   - These are semantic to the action, not state

3. **Landing pages** (`app/features/landing/`):
   - Marketing/brand colors, not part of app UI system

### Confidence Score: 9/10

Simple string replacements with clear patterns. Only risk is missing some instances.
