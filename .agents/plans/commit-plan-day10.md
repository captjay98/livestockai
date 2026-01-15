# Commit Plan - Day 10 (January 15, 2026)

## Summary

- **6 commits** planned
- **33 files** changed (29 modified, 1 deleted, 3 new)
- **+2,156 insertions, -795 deletions**

---

## Commits

### Commit 1: feat(daily-ops): add update/delete server functions for all daily operations

**Files**:
- `app/features/mortality/server.ts`
- `app/features/weight/server.ts`
- `app/features/vaccinations/server.ts`
- `app/features/water-quality/server.ts`

**Message**:
```
feat(daily-ops): add update/delete server functions for all daily operations

- mortality: updateMortalityRecordFn, deleteMortalityRecordFn (with batch qty adjustment)
- weight: updateWeightSampleFn, deleteWeightSampleFn
- vaccinations: update/delete for both vaccinations and treatments
- water-quality: updateWaterQualityRecordFn, deleteWaterQualityRecordFn

All functions include auth checks via checkFarmAccess
```

---

### Commit 2: feat(daily-ops): add Edit/Delete UI to daily operations pages

**Files**:
- `app/routes/_auth/mortality/index.tsx`
- `app/routes/_auth/weight/index.tsx`
- `app/routes/_auth/vaccinations/index.tsx`
- `app/routes/_auth/water-quality/index.tsx`

**Message**:
```
feat(daily-ops): add Edit/Delete UI to daily operations pages

- Add actions column with Edit/Trash2 buttons to all 4 pages
- Add edit dialogs with relevant fields per record type
- Add delete confirmation dialogs
- Add toast notifications on success

Completes CRUD functionality for Mortality, Weight, Vaccinations, Water Quality
```

---

### Commit 3: fix(onboarding): fix Create Farm button and expand livestock types

**Files**:
- `app/features/onboarding/context.tsx`
- `app/routes/_auth/onboarding/index.tsx`

**Message**:
```
fix(onboarding): fix Create Farm button and expand livestock types

- Pass userId to createFarm() so user is linked as owner
- Fix skipOnboarding to persist to database BEFORE updating local state
- Add type="submit" to form buttons
- Expand Create Batch to show all 6 livestock types (was only poultry/fish)
```

---

### Commit 4: fix(settings): fix restart tour and consolidate modules UI

**Files**:
- `app/routes/_auth/settings/index.tsx`
- `app/routes/_auth/settings/modules.tsx` (deleted)
- `app/components/modules/selector.tsx`

**Message**:
```
fix(settings): fix restart tour and consolidate modules UI

- Fix restart tour: clear localStorage and use window.location.href for full reload
- Remove separate /settings/modules route, keep Modules as tab in main settings
- Rewrite ModuleSelector with clickable cards instead of confusing Switch toggle
```

---

### Commit 5: fix(sidebar): show all navigation when no farm selected

**Files**:
- `app/components/layout/sidebar.tsx`
- `app/components/navigation.tsx`
- `app/features/modules/constants.ts`
- `app/components/layout/nav-section.tsx` (new)

**Message**:
```
fix(sidebar): show all navigation when no farm selected

- Show all navigation items when enabledModules is empty
- Users need to see nav to select a farm first
- Add NavSection component for grouped navigation
```

---

### Commit 6: refactor(routes): add PageHeader component to route pages

**Files**:
- `app/components/page-header.tsx` (new)
- `app/routes/_auth/batches/index.tsx`
- `app/routes/_auth/customers/index.tsx`
- `app/routes/_auth/expenses/index.tsx`
- `app/routes/_auth/farms/index.tsx`
- `app/routes/_auth/feed/index.tsx`
- `app/routes/_auth/inventory/index.tsx`
- `app/routes/_auth/invoices/index.tsx`
- `app/routes/_auth/reports/index.tsx`
- `app/routes/_auth/sales/index.tsx`
- `app/routes/_auth/suppliers/index.tsx`
- `app/components/dialogs/mortality-dialog.tsx`
- `app/routeTree.gen.ts`

**Message**:
```
refactor(routes): add PageHeader component to route pages

- Create reusable PageHeader component with icon, title, description, actions
- Replace inline headers across 10+ route pages
- Consistent header styling across the application
```

---

### Commit 7: docs: add implementation plans and update DEVLOG

**Files**:
- `.agents/plans/daily-operations-crud-completion.md` (new)
- `.agents/plans/ux-sidebar-navigation-redesign.md` (new)
- `DEVLOG.md`

**Message**:
```
docs: add implementation plans and update DEVLOG

- Add daily operations CRUD completion plan
- Add sidebar navigation redesign plan
- Update DEVLOG with Day 10 progress
```

---

## Execution

```bash
# Commit 1: Server functions
git add app/features/mortality/server.ts app/features/weight/server.ts app/features/vaccinations/server.ts app/features/water-quality/server.ts
git commit -m "feat(daily-ops): add update/delete server functions for all daily operations"

# Commit 2: Daily ops UI
git add app/routes/_auth/mortality/index.tsx app/routes/_auth/weight/index.tsx app/routes/_auth/vaccinations/index.tsx app/routes/_auth/water-quality/index.tsx
git commit -m "feat(daily-ops): add Edit/Delete UI to daily operations pages"

# Commit 3: Onboarding fixes
git add app/features/onboarding/context.tsx app/routes/_auth/onboarding/index.tsx
git commit -m "fix(onboarding): fix Create Farm button and expand livestock types"

# Commit 4: Settings fixes
git add app/routes/_auth/settings/index.tsx app/components/modules/selector.tsx
git rm app/routes/_auth/settings/modules.tsx
git commit -m "fix(settings): fix restart tour and consolidate modules UI"

# Commit 5: Sidebar fixes
git add app/components/layout/sidebar.tsx app/components/navigation.tsx app/features/modules/constants.ts app/components/layout/nav-section.tsx
git commit -m "fix(sidebar): show all navigation when no farm selected"

# Commit 6: PageHeader refactor
git add app/components/page-header.tsx app/components/dialogs/mortality-dialog.tsx app/routeTree.gen.ts app/routes/_auth/batches/index.tsx app/routes/_auth/customers/index.tsx app/routes/_auth/expenses/index.tsx app/routes/_auth/farms/index.tsx app/routes/_auth/feed/index.tsx app/routes/_auth/inventory/index.tsx app/routes/_auth/invoices/index.tsx app/routes/_auth/reports/index.tsx app/routes/_auth/sales/index.tsx app/routes/_auth/suppliers/index.tsx
git commit -m "refactor(routes): add PageHeader component to route pages"

# Commit 7: Documentation
git add .agents/plans/daily-operations-crud-completion.md .agents/plans/ux-sidebar-navigation-redesign.md DEVLOG.md
git commit -m "docs: add implementation plans and update DEVLOG"
```

## Validation

- [x] TypeScript: 0 errors
- [x] ESLint: 0 errors  
- [x] Tests: 302 pass
- [ ] Git status clean (after commits)
