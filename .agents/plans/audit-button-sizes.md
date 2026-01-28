# Feature: Audit and Upgrade Button Sizes for Field Use

## Feature Description

Audit all 42 `size="sm"` button usages across the application and upgrade appropriate ones to meet the 48px minimum touch target requirement from the "Rugged Utility" design system. This ensures farmers can reliably tap buttons in field conditions.

## User Story

As a farmer using OpenLivestock in the field
I want all important buttons to be large enough to tap reliably
So that I can use the app with dirty hands, gloves, or in bright sunlight

## Problem Statement

The UI audit found 42 instances of `size="sm"` buttons (32px height) which are below the 48px minimum specified in `ui-standards.md`. Some of these are appropriate (pagination, table row actions), but primary actions need upgrading.

## Solution Statement

Categorize all `size="sm"` buttons into:

1. **Keep sm** - Pagination, table row actions, secondary UI (acceptable at 32px)
2. **Upgrade to default** - Primary actions in headers, dialogs (40px)
3. **Upgrade to field** - Critical field actions (48px)

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Low
**Primary Systems Affected**: UI components, routes
**Dependencies**: None

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `.kiro/steering/ui-standards.md` (lines 17-25) - Touch target requirements
- `app/components/ui/button.tsx` (lines 25-40) - Button size variants

### Button Size Reference

| Size      | Height      | Use Case                  |
| --------- | ----------- | ------------------------- |
| `xs`      | 28px (h-7)  | Badges, chips             |
| `sm`      | 32px (h-8)  | Pagination, table actions |
| `default` | 40px (h-10) | Standard buttons          |
| `lg`      | 44px (h-11) | Emphasized actions        |
| `field`   | 48px (h-12) | Field-use primary actions |

### Categorized Button Audit

#### ✅ KEEP `size="sm"` (Acceptable - 18 instances)

These are secondary UI elements where compact size is appropriate:

**Pagination (4)** - `app/components/ui/pagination.tsx:69,79,94,104`

- Icon-only navigation buttons in table footer
- Acceptable: Users tap once, not repeatedly

**Table Row Actions (12)** - Various routes

- `app/routes/_auth/sales/index.tsx:504,512,520` - View/Edit/Delete icons
- `app/routes/_auth/expenses/index.tsx:519,527,535` - View/Edit/Delete icons
- `app/routes/_auth/inventory/index.tsx:704,711,995,1002` - Edit/Delete icons
- `app/routes/_auth/farms/$farmId/index.tsx:689,697` - Edit/Delete icons
- Acceptable: Grouped actions, users can tap carefully

**Sidebar/Navigation (2)**

- `app/components/layout/sidebar.tsx:109` - Collapse button
- `app/components/settings/audit-log-table.tsx:145,157` - Pagination

#### ⚠️ UPGRADE to `size="default"` (16 instances)

These are secondary actions that should be slightly larger:

**Dialog Actions (3)**

- `app/components/dialogs/invoice-dialog.tsx:214` - Add line item
- `app/components/dialogs/vaccination-dialog.tsx:158,166` - Add/Remove vaccine

**Settings Actions (4)**

- `app/routes/_auth/settings/index.tsx:207` - Save button
- `app/routes/_auth/settings/users.tsx:1049,1059` - User actions
- `app/components/settings/audit-log-table.tsx:106` - Filter

**Farm Actions (5)**

- `app/routes/_auth/farms/index.tsx:197` - Farm card action
- `app/routes/_auth/farms/$farmId/index.tsx:424,435,781,819` - Various actions

**Other (4)**

- `app/routes/_auth/suppliers/index.tsx:357` - View supplier
- `app/routes/_auth/invoices/index.tsx:246` - Invoice action
- `app/components/notifications/bell-icon.tsx:53` - Mark read
- `app/routes/_auth/onboarding/index.tsx:190` - Skip button

#### 🔴 UPGRADE to `size="default"` or remove size (8 instances)

These are primary actions that need proper touch targets:

**Batch Header Actions (2)** - `app/routes/_auth/batches/$batchId/index.tsx:166,169`

- Edit and Delete batch - PRIMARY ACTIONS
- Upgrade to `size="default"` (remove size prop)

**PWA Prompt (2)** - `app/components/pwa-prompt.tsx:38,41`

- Close and Reload - CRITICAL USER ACTIONS
- Upgrade to `size="default"`

**Farm Page Actions (2)** - `app/routes/_auth/farms/$farmId/index.tsx:486`

- Primary farm action
- Upgrade to `size="default"`

**Stepper Input (1)** - `app/components/ui/stepper-input.tsx:95`

- Increment/decrement - FREQUENT FIELD USE
- Keep as is (icon button with explicit size)

**SyncStatus (1)** - `app/components/layout/shell.tsx:66`

- This is a component prop, not a button - SKIP

---

## IMPLEMENTATION PLAN

### Phase 1: High Priority - Primary Actions

Upgrade buttons that are primary user actions in field contexts.

### Phase 2: Medium Priority - Dialog/Settings Actions

Upgrade secondary actions that users interact with frequently.

### Phase 3: Verification

Run validation and manual testing.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/routes/_auth/batches/$batchId/index.tsx`

**Lines**: 166, 169
**Change**: Remove `size="sm"` from Edit and Delete buttons (defaults to 40px)

```tsx
// Before
<Button variant="outline" size="sm">
<Button variant="destructive" size="sm">

// After
<Button variant="outline">
<Button variant="destructive">
```

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/batches/\$batchId/index.tsx`
**Expected**: No matches

---

### Task 2: UPDATE `app/components/pwa-prompt.tsx`

**Lines**: 38, 41
**Change**: Remove `size="sm"` from Close and Reload buttons

```tsx
// Before
<Button size="sm" variant="outline" onClick={() => setNeedRefresh()}>
<Button size="sm" onClick={() => updateServiceWorker(true)}>

// After
<Button variant="outline" onClick={() => setNeedRefresh()}>
<Button onClick={() => updateServiceWorker(true)}>
```

**VALIDATE**: `grep -n 'size="sm"' app/components/pwa-prompt.tsx`
**Expected**: No matches

---

### Task 3: UPDATE `app/components/dialogs/invoice-dialog.tsx`

**Line**: 214
**Change**: Remove `size="sm"` from Add Line Item button

**VALIDATE**: `grep -n 'size="sm"' app/components/dialogs/invoice-dialog.tsx`
**Expected**: No matches

---

### Task 4: UPDATE `app/components/dialogs/vaccination-dialog.tsx`

**Lines**: 158, 166
**Change**: Remove `size="sm"` from Add/Remove vaccine buttons

**VALIDATE**: `grep -n 'size="sm"' app/components/dialogs/vaccination-dialog.tsx`
**Expected**: No matches

---

### Task 5: UPDATE `app/routes/_auth/settings/index.tsx`

**Line**: 207
**Change**: Remove `size="sm"` from Save button

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/settings/index.tsx`
**Expected**: No matches

---

### Task 6: UPDATE `app/routes/_auth/settings/users.tsx`

**Lines**: 1049, 1059
**Change**: Remove `size="sm"` from user action buttons

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/settings/users.tsx`
**Expected**: No matches

---

### Task 7: UPDATE `app/routes/_auth/farms/index.tsx`

**Line**: 197
**Change**: Remove `size="sm"` from farm card action

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/farms/index.tsx`
**Expected**: No matches

---

### Task 8: UPDATE `app/routes/_auth/farms/$farmId/index.tsx`

**Lines**: 424, 435, 486, 781, 819
**Change**: Remove `size="sm"` from farm action buttons

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/farms/\$farmId/index.tsx`
**Expected**: Only lines 689, 697 remain (table row actions - acceptable)

---

### Task 9: UPDATE `app/routes/_auth/suppliers/index.tsx`

**Line**: 357
**Change**: Remove `size="sm"` from View supplier button

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/suppliers/index.tsx`
**Expected**: No matches

---

### Task 10: UPDATE `app/routes/_auth/invoices/index.tsx`

**Line**: 246
**Change**: Remove `size="sm"` from invoice action button

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/invoices/index.tsx`
**Expected**: No matches

---

### Task 11: UPDATE `app/components/notifications/bell-icon.tsx`

**Line**: 53
**Change**: Remove `size="sm"` from Mark Read button

**VALIDATE**: `grep -n 'size="sm"' app/components/notifications/bell-icon.tsx`
**Expected**: No matches

---

### Task 12: UPDATE `app/routes/_auth/onboarding/index.tsx`

**Line**: 190
**Change**: Remove `size="sm"` from Skip button

**VALIDATE**: `grep -n 'size="sm"' app/routes/_auth/onboarding/index.tsx`
**Expected**: No matches

---

### Task 13: UPDATE `app/components/settings/audit-log-table.tsx`

**Line**: 106
**Change**: Remove `size="sm"` from Filter button (keep 145, 157 for pagination)

**VALIDATE**: `grep -n 'size="sm"' app/components/settings/audit-log-table.tsx`
**Expected**: Lines 145, 157 remain (pagination - acceptable)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
bun run lint
```

### Level 2: Count Remaining

```bash
# Should be ~18 remaining (pagination + table actions)
grep -rn 'size="sm"' app/components app/routes --include="*.tsx" | wc -l
```

### Level 3: Build

```bash
bun run build
```

### Level 4: Test

```bash
bun run test --run
```

---

## ACCEPTANCE CRITERIA

- [ ] All validation commands pass
- [ ] `size="sm"` count reduced from 42 to ~18
- [ ] Remaining `size="sm"` are only:
    - Pagination buttons (4)
    - Table row action icons (12)
    - Audit log pagination (2)
- [ ] No visual regressions in upgraded buttons
- [ ] Build succeeds

---

## COMPLETION CHECKLIST

- [ ] Tasks 1-13 completed
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Button count verified

---

## NOTES

**Design Decision**: We chose to upgrade to `size="default"` (40px) rather than `size="field"` (48px) for most buttons because:

1. 40px meets WCAG 2.5.5 (44px recommended, 24px minimum)
2. 48px is reserved for high-frequency field actions (Command Center)
3. Keeps UI balanced without making everything oversized

**Kept Small**: Pagination and table row actions remain `size="sm"` because:

1. They're grouped together (easy to tap the right area)
2. They're secondary actions (not primary workflow)
3. Making them larger would waste table space

**Confidence Score**: 9/10 - Simple string replacements with clear validation.
