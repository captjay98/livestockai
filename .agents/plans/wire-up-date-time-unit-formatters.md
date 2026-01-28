# Feature: Wire Up Date/Time/Unit Formatters

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

The settings system has date/time/unit formatters implemented but not used. Currently:

- `useFormatDate()`, `useFormatTime()`, `useFormatWeight()` hooks exist but are never called
- All dates display using raw `toLocaleDateString()` ignoring user preferences
- All weights display hardcoded "kg" ignoring `weightUnit` setting
- Temperature displays hardcoded "°C" ignoring `temperatureUnit` setting

This feature wires up the existing formatters across the entire application.

## User Story

As a user with regional preferences
I want dates and measurements displayed in my preferred format
So that I can read data naturally without mental conversion

## Problem Statement

Users set date format (MM/DD/YYYY vs DD/MM/YYYY) and weight unit (kg vs lbs) in settings, but the app ignores these preferences and displays everything in hardcoded formats.

## Solution Statement

Replace all `toLocaleDateString()` calls with `useFormatDate()` hook and all hardcoded "kg" displays with `useFormatWeight()` hook, respecting user settings throughout the application.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: All route files displaying dates/weights
**Dependencies**: None (formatters already exist)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/features/settings/hooks.ts` (lines 1-120) - All formatting hooks
- `app/features/settings/date-formatter.ts` (lines 1-100) - Date formatting functions
- `app/features/settings/unit-converter.ts` (lines 1-100) - Weight/area/temp converters
- `app/features/settings/index.ts` (lines 1-60) - Exports to use
- `app/routes/_auth/settings/index.tsx` (lines 470-520) - Preview implementation example

### Files to Update (28 files with date formatting)

**Route files with `toLocaleDateString()`:**

- `app/routes/_auth/batches/index.tsx` - 1 date display
- `app/routes/_auth/batches/$batchId/index.tsx` - 5 date displays
- `app/routes/_auth/sales/index.tsx` - 2 date displays
- `app/routes/_auth/expenses/index.tsx` - 2 date displays
- `app/routes/_auth/feed/index.tsx` - 1 date display
- `app/routes/_auth/eggs/index.tsx` - 1 date display
- `app/routes/_auth/weight/index.tsx` - 1 date display
- `app/routes/_auth/water-quality/index.tsx` - 1 date display
- `app/routes/_auth/mortality/index.tsx` - 1 date display
- `app/routes/_auth/vaccinations/index.tsx` - 1 date display
- `app/routes/_auth/invoices/index.tsx` - 2 date displays
- `app/routes/_auth/invoices/$invoiceId.tsx` - 2 date displays
- `app/routes/_auth/customers/$customerId.tsx` - 1 date display
- `app/routes/_auth/suppliers/$supplierId.tsx` - 1 date display
- `app/routes/_auth/farms/$farmId/index.tsx` - 5 date displays
- `app/routes/_auth/dashboard/index.tsx` - 1 date display
- `app/routes/_auth/inventory/index.tsx` - 1 date display
- `app/routes/_auth/reports/index.tsx` - 2 date displays

**Files with hardcoded "kg" weight displays:**

- `app/routes/_auth/sales/index.tsx` - averageWeightKg display
- `app/routes/_auth/batches/$batchId/index.tsx` - Feed (Kg) headers
- `app/routes/_auth/reports/index.tsx` - Quantity (KG) header

### Patterns to Follow

**Import Pattern:**

```typescript
import { useFormatDate, useFormatWeight } from '~/features/settings'
```

**Hook Usage Pattern:**

```typescript
function MyComponent() {
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight, label: weightLabel } = useFormatWeight()

  // In JSX:
  {formatDate(row.original.date)}
  {formatWeight(parseFloat(row.original.averageWeightKg))}
  <span>Quantity ({weightLabel})</span>
}
```

**Column Definition Pattern:**

```typescript
// Before
cell: ({ row }) => new Date(row.original.date).toLocaleDateString()

// After (requires formatDate from hook in component scope)
cell: ({ row }) => formatDate(row.original.date)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Date Formatting (18 route files)

Replace all `toLocaleDateString()` calls with `useFormatDate()` hook.

**Pattern:**

1. Add import: `import { useFormatDate } from '~/features/settings'`
2. Add hook: `const { format: formatDate } = useFormatDate()`
3. Replace: `new Date(x).toLocaleDateString()` → `formatDate(x)`

### Phase 2: Weight Formatting (3 route files)

Replace hardcoded "kg" with dynamic weight unit from settings.

**Pattern:**

1. Add import: `import { useFormatWeight } from '~/features/settings'`
2. Add hook: `const { format: formatWeight, label: weightLabel } = useFormatWeight()`
3. Replace: `{value} kg` → `{formatWeight(value)}`
4. Replace: `"Quantity (KG)"` → `\`Quantity (${weightLabel})\``

### Phase 3: Validation

Run tsc and lint to ensure no errors.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/routes/_auth/batches/index.tsx`

- **ADD IMPORT**: `useFormatDate` from `~/features/settings`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()` after other hooks
- **REPLACE** line ~453: `new Date(row.original.acquisitionDate).toLocaleDateString()` → `formatDate(row.original.acquisitionDate)`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep batches/index`

### Task 2: UPDATE `app/routes/_auth/batches/$batchId/index.tsx`

- **ADD IMPORT**: `useFormatDate, useFormatWeight` from `~/features/settings`
- **ADD HOOKS**:
    ```typescript
    const { format: formatDate } = useFormatDate()
    const { label: weightLabel } = useFormatWeight()
    ```
- **REPLACE** 5 occurrences of `new Date(...).toLocaleDateString()` → `formatDate(...)`
- **REPLACE** "Feed (Kg)" header → `Feed (${weightLabel})`
- **REPLACE** "Qty (Kg)" header → `Qty (${weightLabel})`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep batchId/index`

### Task 3: UPDATE `app/routes/_auth/sales/index.tsx`

- **ADD IMPORT**: `useFormatDate, useFormatWeight` (may already have useFormatCurrency)
- **ADD HOOKS**: `const { format: formatDate } = useFormatDate()` and `const { format: formatWeight } = useFormatWeight()`
- **REPLACE** 2 date displays with `formatDate()`
- **REPLACE** line ~1001: `{selectedSale.averageWeightKg} kg` → `{formatWeight(parseFloat(selectedSale.averageWeightKg))}`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep sales/index`

### Task 4: UPDATE `app/routes/_auth/expenses/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 2 date displays
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep expenses/index`

### Task 5: UPDATE `app/routes/_auth/feed/index.tsx`

- **ADD IMPORT**: `useFormatDate, useFormatWeight`
- **ADD HOOKS**: Both formatters
- **REPLACE** 1 date display
- **REPLACE** "Qty (Kg)" column header with dynamic label
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep feed/index`

### Task 6: UPDATE `app/routes/_auth/eggs/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 1 date display
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep eggs/index`

### Task 7: UPDATE `app/routes/_auth/weight/index.tsx`

- **ADD IMPORT**: `useFormatDate, useFormatWeight`
- **ADD HOOKS**: Both formatters
- **REPLACE** 1 date display
- **REPLACE** weight column headers with dynamic labels
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep weight/index`

### Task 8: UPDATE `app/routes/_auth/water-quality/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 1 date display
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep water-quality/index`

### Task 9: UPDATE `app/routes/_auth/mortality/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 1 date display
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep mortality/index`

### Task 10: UPDATE `app/routes/_auth/vaccinations/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 1 date display
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep vaccinations/index`

### Task 11: UPDATE `app/routes/_auth/invoices/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 2 date displays (date and dueDate columns)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep invoices/index`

### Task 12: UPDATE `app/routes/_auth/invoices/$invoiceId.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 2 date displays
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep invoiceId`

### Task 13: UPDATE `app/routes/_auth/customers/$customerId.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 1 date display
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep customerId`

### Task 14: UPDATE `app/routes/_auth/suppliers/$supplierId.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 1 date display
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep supplierId`

### Task 15: UPDATE `app/routes/_auth/farms/$farmId/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 5 date displays
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep farmId/index`

### Task 16: UPDATE `app/routes/_auth/dashboard/index.tsx`

- **ADD IMPORT**: `useFormatDate`
- **ADD HOOK**: `const { format: formatDate } = useFormatDate()`
- **REPLACE** 1 date display (recent transactions)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep dashboard/index`

### Task 17: UPDATE `app/routes/_auth/inventory/index.tsx`

- **ADD IMPORT**: `useFormatDate, useFormatWeight`
- **ADD HOOKS**: Both formatters
- **REPLACE** 1 date display (expiry date)
- **REPLACE** weight labels if any
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep inventory/index`

### Task 18: UPDATE `app/routes/_auth/reports/index.tsx`

- **ADD IMPORT**: `useFormatDate, useFormatWeight`
- **ADD HOOKS**: Both formatters
- **REPLACE** 2 date displays
- **REPLACE** "Quantity (KG)" header with dynamic label
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep reports/index`

### Task 19: Final Validation

- **RUN**: `npx tsc --noEmit`
- **RUN**: `bun run lint`
- **VERIFY**: 0 errors

---

## TESTING STRATEGY

### Manual Testing

1. Go to Settings → Regional
2. Change date format from MM/DD/YYYY to DD/MM/YYYY
3. Navigate to Batches, Sales, Expenses pages
4. Verify dates display in DD/MM/YYYY format
5. Change weight unit from kg to lbs
6. Navigate to Weight, Feed pages
7. Verify weights display in lbs

### Edge Cases

- Null dates should not crash (use optional chaining)
- Invalid date strings should fallback gracefully

---

## VALIDATION COMMANDS

### Level 1: Type Check

```bash
npx tsc --noEmit
```

### Level 2: Lint

```bash
bun run lint
```

### Level 3: Manual Validation

1. Start dev server: `bun dev`
2. Login and go to Settings
3. Change date format, verify changes across app
4. Change weight unit, verify changes across app

---

## ACCEPTANCE CRITERIA

- [ ] All `toLocaleDateString()` calls replaced with `formatDate()`
- [ ] All hardcoded "kg" displays use dynamic weight label
- [ ] Settings changes immediately reflect across all pages
- [ ] TypeScript compiles with 0 errors
- [ ] ESLint passes with 0 errors
- [ ] No regressions in existing functionality

---

## COMPLETION CHECKLIST

- [ ] All 18 route files updated with date formatting
- [ ] 3 route files updated with weight formatting
- [ ] `npx tsc --noEmit` passes
- [ ] `bun run lint` passes
- [ ] Manual testing confirms settings are respected
- [ ] Commit changes

---

## NOTES

**Why not update dialogs?**
Dialog date inputs use `type="date"` which requires ISO format (YYYY-MM-DD). The `toISOString().split('T')[0]` pattern is correct for form inputs. Only display formatting needs to change.

**Column definitions gotcha:**
Column cell functions are defined outside the component render, so they can't directly access hooks. The pattern is to define `formatDate` in component scope and reference it in the cell function (closure).

**Estimated time:** ~1.5 hours
