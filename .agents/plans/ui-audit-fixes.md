# UI Audit Fixes Plan

## Overview

Fix all Rugged Utility design violations identified in the UI audit for LivestockAI.

## Audit Summary (Updated 2026-01-30)

| Category                                 | Violations                       | Priority |
| ---------------------------------------- | -------------------------------- | -------- |
| Touch targets (`size="sm"`, `size="xs"`) | 125 (103 components + 22 routes) | High     |
| Hardcoded colors                         | 308 (187 text + 121 bg)          | Medium   |
| SyncStatus missing                       | Nav + batch-details header       | High     |
| Mobile responsiveness                    | 39 breakpoints (limited)         | Medium   |

---

## Phase 1: Touch Targets (High Priority)

### 1.1 Update Button Component Defaults

**File:** `app/components/ui/button.tsx`

Update size variants to meet 48px minimum:

- `default`: h-10 → h-12 (48px)
- `xs`: h-7 → h-10 (40px minimum for compact)
- `sm`: h-8 → h-11 (44px)
- `lg`: h-11 → h-14 (56px)
- `icon`: size-10 → size-12 (48px)
- `icon-xs`: size-7 → size-10 (40px)
- `icon-sm`: size-8 → size-11 (44px)

### 1.2 Audit `size="sm/xs"` Usages (125 instances)

**Top violating component files:**

1. `app/components/extension/admin/region-tree.tsx` - 5
2. `app/components/ui/pagination.tsx` - 4
3. `app/components/feed-formulation/price-manager.tsx` - 4
4. `app/components/extension/access-requests-card.tsx` - 4
5. `app/components/settings/users/UserDialog.tsx` - 3
6. `app/components/settings/audit-log-table.tsx` - 3
7. `app/components/extension/visit-history-card.tsx` - 3
8. `app/components/extension/admin/threshold-table.tsx` - 3
9. `app/components/expenses/expense-columns.tsx` - 3

**Action:** After updating button.tsx defaults, most usages will auto-fix. Remove explicit `size="sm"` where default is appropriate.

---

## Phase 2: Sync Status Integration (High Priority)

### 2.1 Add SyncStatus to Header

**File:** `app/components/navigation.tsx`

Add `<SyncStatus />` to the Header component's right side controls (near ThemeToggle/LanguageSwitcher).

### 2.2 Add SyncStatus to Batch Detail Header

**File:** `app/components/batches/batch-details/batch-header.tsx`

- Import and add `<SyncStatus />` component
- Add sticky positioning (`sticky top-0 z-30 bg-background/80 backdrop-blur-md`)
- Match pattern from `app/components/batch-header.tsx` which already has SyncStatus

---

## Phase 3: Color Compliance (Medium Priority)

### 3.1 Create Color Migration Map

Replace hardcoded colors with semantic tokens:

| Hardcoded                       | Semantic Token     |
| ------------------------------- | ------------------ |
| `text-red-*`                    | `text-destructive` |
| `bg-red-*`                      | `bg-destructive`   |
| `text-green-*`                  | `text-success`     |
| `bg-green-*`                    | `bg-success`       |
| `text-yellow-*`, `text-amber-*` | `text-warning`     |
| `bg-yellow-*`, `bg-amber-*`     | `bg-warning`       |

### 3.2 Priority Files (highest violation counts)

1. `app/routes/verify.$reportId.tsx` - 15 violations (12 text + 3 bg)
2. `app/routes/_auth/credit-passport/requests.tsx` - 11 violations (7 text + 4 bg)
3. `app/routes/_auth/extension/district.$districtId.tsx` - 6 violations
4. `app/routes/_auth/extension/supervisor.tsx` - 6 violations (3 text + 3 bg)
5. `app/routes/_auth/credit-passport/history.tsx` - 6 violations (3 text + 3 bg)
6. `app/routes/_auth/extension/alerts.tsx` - 2 bg violations
7. `app/routes/marketplace/$listingId.tsx` - 3 violations

### 3.3 Pattern Search & Replace

Use grep to find and replace patterns:

```bash
# Find text color violations
grep -rE "text-(red|green|amber|yellow)-[0-9]+" app/routes app/components --include="*.tsx"

# Find bg color violations
grep -rE "bg-(red|green|amber|yellow)-[0-9]+" app/routes app/components --include="*.tsx"
```

---

## Phase 4: Mobile Responsiveness (Medium Priority)

### 4.1 Table → Card Transforms

Add responsive card views for data tables on mobile:

- Sales table
- Expenses table
- Batch list table

Pattern:

```tsx
<div className="hidden md:block"><Table /></div>
<div className="md:hidden"><CardList /></div>
```

### 4.2 Form Stacking

Ensure multi-column forms stack on mobile:

- Use `grid-cols-1 md:grid-cols-2` pattern
- Check all form components in `app/components/`

---

## Execution Order

1. **Phase 1.1** - Button defaults (1 file, fixes ~80% of touch issues)
2. **Phase 2.1** - SyncStatus in Header (1 file)
3. **Phase 2.2** - SyncStatus in Batch Detail Header (1 file)
4. **Phase 3.2** - Fix top 5 color violation files
5. **Phase 1.2** - Clean up remaining `size="sm"` usages
6. **Phase 3.3** - Remaining color fixes
7. **Phase 4** - Mobile responsiveness improvements

---

## Validation

After each phase:

```bash
bun run check && bun run lint
```

Visual verification:

- Test on mobile viewport (375px width)
- Verify touch targets with browser dev tools
- Check SyncStatus visibility across routes

---

## Success Criteria

- [ ] All buttons meet 48px minimum (or 44px for sm)
- [ ] Semantic color tokens used throughout
- [ ] Batch detail header has SyncStatus + sticky
- [ ] Navigation header has SyncStatus
- [ ] Mobile responsive verified
