# Feature: i18n Component Migration

Systematically migrate all components to use existing i18n translations, increasing adoption from 2.2% to 100%.

## Feature Description

OpenLivestock has excellent i18n infrastructure (15 languages, 1,400+ translation keys each) but critically low adoption - only 3 of 134 .tsx files use translations. This plan migrates all 131 files with hardcoded English strings to use the existing translation keys.

## User Story

As a farmer in Nigeria, Senegal, or Kenya
I want to use OpenLivestock in my native language (Hausa, French, Swahili)
So that I can manage my farm without language barriers

## Problem Statement

**Current State:**

- ✅ Infrastructure: 15 languages, 22 namespaces, 1,400+ keys per language
- ✅ Translations: All complete with proper diacritics (Yorùbá, Hausa)
- ❌ Adoption: Only 2.2% (3/134 files) use translations
- ❌ Reality: 131 files have hardcoded English strings

**Impact:**

- Nigerian farmers in Kano (Hausa speakers) see English UI
- West African farmers (French speakers) see English UI
- East African farmers (Swahili speakers) see English UI
- Language switcher exists but changes nothing

## Solution Statement

Systematically migrate components to use `useTranslation()` hook and `t()` function calls, replacing all hardcoded strings with translation keys that already exist in the 15 language files.

## Feature Metadata

**Feature Type**: Enhancement (i18n adoption)
**Estimated Complexity**: Medium (repetitive but straightforward)
**Primary Systems Affected**: All route components, UI components
**Dependencies**: react-i18next (already installed and configured)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

**i18n Infrastructure:**

- `app/features/i18n/config.ts` - 15 languages, 22 namespaces, localStorage priority
- `app/features/i18n/provider.tsx` - I18nProvider wraps app, syncs with settings
- `app/features/i18n/locales/en.ts` (1,385 lines) - All English translations
- `app/features/i18n/locales/ha.ts` (1,406 lines) - Hausa translations
- `app/features/i18n/locales/yo.ts` (1,402 lines) - Yoruba translations with diacritics

**Components Already Using i18n (PATTERNS TO MIRROR):**

- `app/routes/_auth/sales/index.tsx` (lines 1-50) - Pattern: `useTranslation(['sales', 'common'])`
- `app/routes/_auth/dashboard/index.tsx` (lines 1-50) - Pattern: Multiple namespaces
- `app/components/dialogs/batch-dialog.tsx` - Pattern: Dialog with translations
- `app/components/ui/language-switcher.tsx` - Language switching component

**Translation Namespace Structure:**

```typescript
// app/features/i18n/locales/en.ts structure
export const en = {
  common: {
    /* 85 keys - shared across app */
  },
  eggs: {
    /* 23 keys */
  },
  feed: {
    /* 47 keys */
  },
  mortality: {
    /* 28 keys */
  },
  vaccinations: {
    /* 65 keys */
  },
  weight: {
    /* 21 keys */
  },
  waterQuality: {
    /* 23 keys */
  },
  dashboard: {
    /* 16 keys */
  },
  farms: {
    /* 29 keys */
  },
  batches: {
    /* 139 keys */
  },
  inventory: {
    /* 57 keys */
  },
  sales: {
    /* 45 keys */
  },
  expenses: {
    /* 64 keys */
  },
  invoices: {
    /* 52 keys */
  },
  reports: {
    /* 107 keys */
  },
  settings: {
    /* 229 keys */
  },
  auth: {
    /* 38 keys */
  },
  suppliers: {
    /* 74 keys */
  },
  customers: {
    /* 75 keys */
  },
  validation: {
    /* 8 keys */
  },
  errors: {
    /* 33 keys */
  },
  onboarding: {
    /* 125 keys */
  },
}
```

### Patterns to Follow

**1. Import Pattern:**

```typescript
import { useTranslation } from 'react-i18next'

// Inside component:
const { t } = useTranslation(['namespace1', 'namespace2'])
```

**2. Translation Call Pattern:**

```typescript
// ❌ Before
<Button>Create Batch</Button>
<Label>Quantity</Label>
<p>No sales yet</p>

// ✅ After
<Button>{t('batches:create')}</Button>
<Label>{t('common:quantity')}</Label>
<p>{t('sales:empty.title')}</p>
```

**3. Namespace Selection:**

- Primary namespace: Feature name (e.g., 'sales', 'batches', 'feed')
- Secondary namespace: Always include 'common' for shared terms
- Example: `useTranslation(['sales', 'common'])`

**4. Key Naming Convention:**

- Dot notation for nested keys: `t('sales:empty.title')`
- Colon for namespace: `t('common:save')`
- Default values for safety: `t('key', { defaultValue: 'Fallback' })`

**5. Pluralization Pattern:**

```typescript
// ICU message format already in translations
t('batches:count', { count: 5 }) // "5 batches"
```

---

## IMPLEMENTATION PLAN

### Phase 1: Route Components (26 files)

Migrate all route components in `app/routes/_auth/` to use translations.

**Priority Order:**

1. High-traffic routes: dashboard, batches, sales, expenses
2. Daily operations: feed, mortality, weight, vaccinations, water-quality
3. Management: farms, customers, suppliers, inventory
4. Admin: settings, reports, invoices

### Phase 2: UI Components (39 files)

Migrate reusable UI components in `app/components/`.

**Categories:**

1. Dialogs (14 files) - Already done ✅
2. UI primitives (button, label, input, etc.)
3. Layout components (navigation, page-header, etc.)
4. Feature components (module-selector, etc.)

### Phase 3: Validation & Testing

Verify all translations work across all 15 languages.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE Migration Tracking Script

- **CREATE**: `scripts/i18n-migration-status.sh`
- **PURPOSE**: Track migration progress across all files
- **VALIDATE**: `bash scripts/i18n-migration-status.sh`

```bash
#!/bin/bash
echo "=== i18n Migration Status ==="
echo ""
echo "Routes with useTranslation:"
grep -l "useTranslation" app/routes/_auth/**/*.tsx 2>/dev/null | wc -l
echo ""
echo "Components with useTranslation:"
grep -l "useTranslation" app/components/**/*.tsx 2>/dev/null | wc -l
echo ""
echo "Total .tsx files:"
find app -name "*.tsx" | wc -l
```

### Task 2: UPDATE High-Priority Routes (Dashboard, Batches, Sales, Expenses)

**Files Already Done:**

- ✅ `app/routes/_auth/sales/index.tsx` - Just fixed empty state
- ✅ `app/routes/_auth/dashboard/index.tsx` - Already using translations
- ✅ `app/routes/_auth/expenses/index.tsx` - Already using translations
- ✅ `app/routes/_auth/batches/index.tsx` - Already using translations

**VALIDATE**: `grep -n "useTranslation" app/routes/_auth/{dashboard,batches,sales,expenses}/index.tsx`

### Task 3: UPDATE Daily Operations Routes (Feed, Mortality, Weight, Vaccinations, Water Quality)

**Files Already Done:**

- ✅ `app/routes/_auth/feed/index.tsx` - Already using translations
- ✅ `app/routes/_auth/mortality/index.tsx` - Already using translations
- ✅ `app/routes/_auth/weight/index.tsx` - Already using translations
- ✅ `app/routes/_auth/vaccinations/index.tsx` - Already using translations
- ✅ `app/routes/_auth/water-quality/index.tsx` - Already using translations

**VALIDATE**: `grep -n "useTranslation" app/routes/_auth/{feed,mortality,weight,vaccinations,water-quality}/index.tsx`

### Task 4: UPDATE Management Routes (Farms, Customers, Suppliers, Inventory)

**Files Already Done:**

- ✅ `app/routes/_auth/farms/index.tsx` - Already using translations
- ✅ `app/routes/_auth/farms/$farmId/index.tsx` - Already using translations
- ✅ `app/routes/_auth/customers/index.tsx` - Already using translations
- ✅ `app/routes/_auth/suppliers/index.tsx` - Already using translations
- ✅ `app/routes/_auth/inventory/index.tsx` - Already using translations

**VALIDATE**: `grep -n "useTranslation" app/routes/_auth/{farms,customers,suppliers,inventory}/**/*.tsx`

### Task 5: UPDATE Admin Routes (Settings, Reports, Invoices)

**Files Already Done:**

- ✅ `app/routes/_auth/settings/index.tsx` - Already using translations
- ✅ `app/routes/_auth/settings/users.tsx` - Already using translations
- ✅ `app/routes/_auth/reports/index.tsx` - Already using translations
- ✅ `app/routes/_auth/invoices/index.tsx` - Already using translations

**VALIDATE**: `grep -n "useTranslation" app/routes/_auth/{settings,reports,invoices}/**/*.tsx`

### Task 6: UPDATE Onboarding Flow

**Files Already Done:**

- ✅ `app/routes/_auth/onboarding/index.tsx` - Already using translations (10 instances)

**VALIDATE**: `grep -n "useTranslation" app/routes/_auth/onboarding/index.tsx`

### Task 7: VERIFY All Dialogs Use Translations

**Files Already Done (14/14):**

- ✅ All 14 dialog components already use `useTranslation`

**VALIDATE**: `grep -l "useTranslation" app/components/dialogs/*.tsx | wc -l` (should be 14)

### Task 8: UPDATE UI Components (Navigation, PageHeader, etc.)

**Files to Check:**

- `app/components/navigation.tsx`
- `app/components/page-header.tsx`
- `app/components/modules/selector.tsx`
- `app/components/ui/data-table.tsx`

**PATTERN**: Add `useTranslation(['common'])` for shared UI strings

**VALIDATE**: `grep -n "useTranslation" app/components/{navigation,page-header}.tsx`

### Task 9: UPDATE Remaining UI Components

**Target**: All components in `app/components/ui/` that have user-facing strings

**PATTERN**:

```typescript
// For generic UI components, use 'common' namespace
const { t } = useTranslation(['common'])
```

**VALIDATE**: `grep -l "useTranslation" app/components/ui/*.tsx`

### Task 10: VERIFY Language Switcher Works

**Test all 15 languages:**

1. Open app in browser
2. Click language switcher
3. Select each language and verify UI updates
4. Check localStorage persistence

**VALIDATE**: Manual testing in browser

### Task 11: CREATE i18n Coverage Report

- **CREATE**: `.agents/reports/i18n-migration-complete.md`
- **CONTENT**: Final coverage statistics, before/after comparison
- **VALIDATE**: File exists and contains metrics

---

## TESTING STRATEGY

### Unit Tests

**No new tests needed** - Translation infrastructure already tested.

### Integration Tests

**Manual Testing Required:**

1. **Language Switching Test:**
   - Switch to each of 15 languages
   - Verify all UI text updates
   - Check for missing translation keys (shows key name if missing)

2. **Nigerian Languages Test:**
   - Switch to Hausa (ha)
   - Switch to Yoruba (yo)
   - Switch to Igbo (ig)
   - Verify proper diacritics display (Yorùbá)

3. **Persistence Test:**
   - Select language
   - Refresh page
   - Verify language persists (localStorage)

### Edge Cases

1. **Missing Translation Keys:**
   - If key doesn't exist, shows key name
   - Add defaultValue for safety: `t('key', { defaultValue: 'Fallback' })`

2. **Namespace Not Loaded:**
   - Ensure all required namespaces in `useTranslation([...])`

3. **Pluralization:**
   - Test with count=0, count=1, count=2+ for plural forms

---

## VALIDATION COMMANDS

### Level 1: Migration Progress

```bash
# Check route coverage
grep -l "useTranslation" app/routes/_auth/**/*.tsx | wc -l

# Check component coverage
grep -l "useTranslation" app/components/**/*.tsx | wc -l

# Find remaining hardcoded strings (sample)
grep -rn '"[A-Z][a-z]' app/routes/_auth/dashboard/index.tsx | head -10
```

### Level 2: Translation Key Validation

```bash
# Verify all translation keys exist in en.ts
# (Manual check - look for console warnings in browser)

# Check for missing defaultValue (risky pattern)
grep -rn "t('" app/routes/_auth/ | grep -v "defaultValue" | head -20
```

### Level 3: Build & Type Check

```bash
# Ensure no TypeScript errors
npx tsc --noEmit

# Ensure no ESLint errors
bun run lint
```

### Level 4: Manual Validation

1. Start dev server: `bun run dev`
2. Open browser: `http://localhost:3000`
3. Test language switcher with all 15 languages
4. Navigate through all routes and verify translations
5. Check browser console for missing translation warnings

---

## ACCEPTANCE CRITERIA

- [x] All 26 route components use `useTranslation()` ✅ (Already done)
- [x] All 14 dialog components use translations ✅ (Already done)
- [ ] All UI components with user-facing strings use translations
- [ ] Language switcher works for all 15 languages
- [ ] No hardcoded English strings in critical paths
- [ ] Nigerian languages (Hausa, Yoruba, Igbo) display correctly
- [ ] localStorage persistence works across page refreshes
- [ ] No console warnings for missing translation keys
- [ ] Build succeeds with zero TypeScript/ESLint errors
- [ ] i18n coverage report shows >95% adoption

---

## COMPLETION CHECKLIST

- [x] Phase 1: Route components migrated (26/26) ✅
- [x] Phase 2: Dialog components migrated (14/14) ✅
- [ ] Phase 3: UI components migrated
- [ ] All validation commands pass
- [ ] Manual testing confirms all 15 languages work
- [ ] Coverage report created
- [ ] No regressions in existing functionality

---

## NOTES

### Current Status (2026-01-20)

**Already Migrated:**

- ✅ All 26 route components in `app/routes/_auth/`
- ✅ All 14 dialog components in `app/components/dialogs/`
- ✅ Language switcher component
- ✅ Onboarding flow (10 translation calls)

**Remaining Work:**

- UI components in `app/components/ui/` (39 files)
- Layout components (navigation, page-header)
- Feature components (module-selector, etc.)

**Key Finding:**
The i18n review summary stated "only 3 of 134 files use translations" but actual grep shows **26 route files + 14 dialog files + others = ~45 files already using translations**. The 2.2% figure may have been from an earlier audit.

**Recommendation:**
Focus on the remaining UI components and create comprehensive coverage report to get accurate current state.

### Design Decisions

1. **Namespace Strategy**: Always include 'common' as secondary namespace for shared terms
2. **Default Values**: Add for critical UI strings to prevent showing key names
3. **Lazy Loading**: Translation bundles already lazy-loaded by react-i18next
4. **Fallback**: English (en) is default fallback language

### Nigerian Market Context

- **Hausa** (Northern Nigeria): 50M+ speakers, farming heartland
- **Yoruba** (Southwest Nigeria): 40M+ speakers, commercial hub
- **Igbo** (Southeast Nigeria): 30M+ speakers, entrepreneurial culture
- All three languages have complete translations with proper diacritics

### Performance Considerations

- Translation bundles are ~50KB each (1,400 keys)
- Lazy loading prevents loading all 15 languages upfront
- localStorage caching reduces server requests
- No performance impact observed in testing

---

## CONFIDENCE SCORE

**8/10** - High confidence for one-pass success

**Reasoning:**

- ✅ Infrastructure already excellent and battle-tested
- ✅ All translations already exist (no translation work needed)
- ✅ Clear patterns established in existing migrated files
- ✅ Straightforward find-and-replace work
- ⚠️ Manual testing required for all 15 languages
- ⚠️ Need accurate coverage report to identify remaining files
