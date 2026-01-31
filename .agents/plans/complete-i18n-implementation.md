# Feature: Complete i18n Implementation

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Complete the internationalization (i18n) implementation for LivestockAI by:

1. Converting remaining hardcoded strings to translation keys
2. Adding missing namespaces to i18n configuration
3. Implementing lazy loading for locale files to reduce initial bundle size

This ensures the application is fully internationalized for all 15 supported languages and optimizes performance by loading only the active language.

## User Story

As a **farmer using LivestockAI in a non-English language**
I want to **see all UI text in my preferred language without hardcoded English strings**
So that **I can fully understand and use the application in my native language**

As a **user on a slow internet connection**
I want to **load only my selected language translations**
So that **the application loads faster and uses less bandwidth**

## Problem Statement

Current i18n implementation has 3 critical issues:

1. **~50 hardcoded strings** in sensors, extension, and credit-passport routes that don't translate
2. **Missing namespaces** in i18n config causing fallback to default namespace
3. **All 15 languages loaded upfront** (~750KB) causing slow initial page load

These issues break the user experience for non-English users and impact performance for all users.

## Solution Statement

1. **Convert hardcoded strings** to use `t()` function with proper namespaces and defaultValue
2. **Add missing namespaces** (sensors, extension, workers, credit-passport) to i18n config
3. **Implement lazy loading** using dynamic imports to load only the active language on demand

This will achieve 100% i18n coverage and reduce initial bundle size by ~700KB.

## Feature Metadata

**Feature Type**: Enhancement  
**Estimated Complexity**: Medium  
**Primary Systems Affected**: i18n configuration, route components, language switcher  
**Dependencies**: react-i18next (already installed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**i18n Core:**

- `app/lib/i18n/config.ts` (lines 1-75) - Why: i18next configuration, namespace list
- `app/lib/i18n/provider.tsx` (lines 1-45) - Why: Language switching logic, localStorage sync
- `app/components/ui/language-switcher.tsx` (lines 1-110) - Why: Language change handler location

**Locale Files:**

- `app/lib/i18n/locales/en.ts` (lines 1-1483) - Why: English baseline with all keys
- `app/lib/i18n/locales/fr.ts` (lines 1-1489) - Why: Example of complete locale structure

**Routes with Hardcoded Strings:**

- `app/routes/_auth/sensors/$sensorId.tsx` (lines 107, 114, 130) - Why: AlertDialog and CardTitle hardcoded
- `app/routes/_auth/settings/sensors.tsx` (line 50) - Why: CardTitle hardcoded
- `app/routes/_auth/extension/alerts.$alertId.tsx` (lines 80-120) - Why: Labels and CardTitle hardcoded
- `app/routes/_auth/extension/farm.$farmId.tsx` (lines 200-250) - Why: Comparison text hardcoded
- `app/routes/_auth/credit-passport/index.tsx` (lines 150-200) - Why: Labels and strong tags hardcoded
- `app/routes/_auth/credit-passport/requests.tsx` (lines 180-220) - Why: Strong tags hardcoded
- `app/routes/_auth/credit-passport/history.tsx` (lines 140-160) - Why: SelectItem text hardcoded

**Pattern Examples:**

- `app/routes/_auth/batches/index.tsx` (lines 160-170) - Why: Proper PageHeader with t() usage
- `app/routes/_auth/customers/index.tsx` (lines 90-100) - Why: Proper Label with t() usage
- `app/routes/_auth/dashboard/index.tsx` (lines 80-90) - Why: Proper useTranslation with multiple namespaces

### New Files to Create

None - all modifications to existing files

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [i18next Dynamic Loading](https://www.i18next.com/how-to/add-or-load-translations#lazy-load-in-memory-translations)
  - Specific section: "Lazy load in-memory translations"
  - Why: Shows how to implement lazy loading with addResourceBundle

- [react-i18next Best Practices](https://react.i18next.com/latest/using-with-hooks#not-using-suspense)
  - Specific section: "Not using suspense"
  - Why: Confirms our useSuspense: false configuration is correct

- [i18next Namespaces](https://www.i18next.com/principles/namespaces)
  - Specific section: "Multiple namespaces"
  - Why: Shows proper namespace configuration and usage

### Patterns to Follow

**Translation Pattern (Mandatory):**

```typescript
// ✅ CORRECT - Always use this pattern
const { t } = useTranslation(['feature', 'common'])

<Component
  title={t('feature:key', { defaultValue: 'Fallback Text' })}
  description={t('feature:description', { defaultValue: 'Longer fallback...' })}
/>
```

**Lazy Loading Pattern:**

```typescript
// ✅ CORRECT - Dynamic import with addResourceBundle
export async function loadLanguage(lang: string) {
  if (i18n.hasResourceBundle(lang, 'common')) return

  const locale = await import(`./locales/${lang}`)
  Object.keys(locale).forEach((ns) => {
    i18n.addResourceBundle(lang, ns, locale[ns])
  })
}
```

**Namespace Declaration:**

```typescript
// ✅ CORRECT - Declare all namespaces used in app
ns: [
  'common', 'auth', 'batches', 'dashboard', 'settings',
  'sensors', 'extension', 'workers', 'credit-passport', // Add these
  // ... rest
],
```

---

## IMPLEMENTATION PLAN

### Phase 1: Configuration Updates (5 minutes)

Update i18n configuration to support new namespaces and prepare for lazy loading.

### Phase 2: Hardcoded String Conversion (2-3 hours)

Convert all hardcoded strings to translation keys in 10 route files.

### Phase 3: Lazy Loading Implementation (1-2 hours)

Implement dynamic locale loading to reduce initial bundle size.

### Phase 4: Validation (30 minutes)

Run comprehensive tests to ensure all translations work correctly.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE app/lib/i18n/config.ts

- **IMPLEMENT**: Add missing namespaces to ns array
- **PATTERN**: Existing namespace list (line 44-66)
- **IMPORTS**: None needed
- **GOTCHA**: Must match namespace names used in useTranslation() calls
- **VALIDATE**: `grep -r "useTranslation(\[" app --include="*.tsx" | grep -E "sensors|extension|workers|credit-passport" | head -5`

```typescript
// Add to ns array after 'marketplace':
ns: [
  'common', 'auth', 'batches', 'dashboard', 'settings',
  'eggs', 'feed', 'mortality', 'vaccinations', 'weight',
  'water-quality', 'expenses', 'invoices', 'reports',
  'inventory', 'customers', 'suppliers', 'farms',
  'validation', 'errors', 'onboarding', 'marketplace',
  'sensors',          // ADD
  'extension',        // ADD
  'workers',          // ADD
  'credit-passport',  // ADD
],
```

### Task 2: UPDATE app/routes/\_auth/sensors/$sensorId.tsx

- **IMPLEMENT**: Convert hardcoded AlertDialog and CardTitle text to translation keys
- **PATTERN**: `app/routes/_auth/batches/$batchId/index.tsx` (lines 50-60) - AlertDialog with t()
- **IMPORTS**: Add `useTranslation` from 'react-i18next'
- **GOTCHA**: AlertDialog components are nested, ensure t() is called in component scope
- **VALIDATE**: `grep -n "Delete Sensor\|Cancel\|Alert History" app/routes/_auth/sensors/\$sensorId.tsx`

```typescript
// Add at top of SensorDetailPage function
const { t } = useTranslation(['sensors', 'common'])

// Line 107: Change
<AlertDialogTitle>Delete Sensor</AlertDialogTitle>
// To:
<AlertDialogTitle>{t('sensors:deleteTitle', { defaultValue: 'Delete Sensor' })}</AlertDialogTitle>

// Line 114: Change
<AlertDialogCancel>Cancel</AlertDialogCancel>
// To:
<AlertDialogCancel>{t('common:cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>

// Line 130: Change
<CardTitle>Alert History</CardTitle>
// To:
<CardTitle>{t('sensors:alertHistory', { defaultValue: 'Alert History' })}</CardTitle>
```

### Task 3: UPDATE app/routes/\_auth/settings/sensors.tsx

- **IMPLEMENT**: Convert hardcoded CardTitle to translation key
- **PATTERN**: Same as Task 2
- **IMPORTS**: Add `useTranslation` if not present
- **GOTCHA**: Check if useTranslation is already imported
- **VALIDATE**: `grep -n "Default Thresholds" app/routes/_auth/settings/sensors.tsx`

```typescript
// Add or update useTranslation
const { t } = useTranslation(['sensors', 'settings', 'common'])

// Convert CardTitle
<CardTitle>{t('sensors:defaultThresholds', { defaultValue: 'Default Thresholds' })}</CardTitle>
```

### Task 4: UPDATE app/routes/\_auth/extension/alerts.$alertId.tsx

- **IMPLEMENT**: Convert hardcoded Labels, CardTitle, and span text to translation keys
- **PATTERN**: `app/routes/_auth/batches/$batchId/index.tsx` - Label with t()
- **IMPORTS**: Ensure useTranslation includes 'extension' namespace
- **GOTCHA**: Multiple hardcoded strings, convert all systematically
- **VALIDATE**: `grep -n "Species:\|Update Alert\|Status\|Notes" app/routes/_auth/extension/alerts.\$alertId.tsx`

```typescript
// Ensure useTranslation has extension namespace
const { t } = useTranslation(['extension', 'common'])

// Convert all hardcoded text:
<span>Species: {alert.livestockType}</span>
// To:
<span>{t('extension:species', { defaultValue: 'Species' })}: {alert.livestockType}</span>

<CardTitle>Update Alert</CardTitle>
// To:
<CardTitle>{t('extension:updateAlert', { defaultValue: 'Update Alert' })}</CardTitle>

<Label htmlFor="status">Status</Label>
// To:
<Label htmlFor="status">{t('common:status', { defaultValue: 'Status' })}</Label>

<Label htmlFor="notes">Notes</Label>
// To:
<Label htmlFor="notes">{t('common:notes', { defaultValue: 'Notes' })}</Label>
```

### Task 5: UPDATE app/routes/\_auth/extension/farm.$farmId.tsx

- **IMPLEMENT**: Convert hardcoded comparison text to translation keys
- **PATTERN**: Similar inline text with t()
- **IMPORTS**: Ensure useTranslation includes 'extension' namespace
- **GOTCHA**: Text is in JSX fragments, wrap t() calls properly
- **VALIDATE**: `grep -n "District avg:\|Farms with higher" app/routes/_auth/extension/farm.\$farmId.tsx`

```typescript
const { t } = useTranslation(['extension', 'common'])

// Convert:
<>District avg: {healthComparison.districtAvgMortality}%</>
// To:
<>{t('extension:districtAvg', { defaultValue: 'District avg' })}: {healthComparison.districtAvgMortality}%</>

<>Farms with higher mortality</>
// To:
<>{t('extension:farmsHigherMortality', { defaultValue: 'Farms with higher mortality' })}</>
```

### Task 6: UPDATE app/routes/\_auth/credit-passport/index.tsx

- **IMPLEMENT**: Convert hardcoded Labels and strong tags to translation keys
- **PATTERN**: `app/routes/_auth/invoices/index.tsx` - Label with t()
- **IMPORTS**: Ensure useTranslation includes 'credit-passport' namespace
- **GOTCHA**: Strong tags used for field labels, convert to t() calls
- **VALIDATE**: `grep -n "Start Date\|Report Type:\|Date Range:\|Batches:\|Notes:" app/routes/_auth/credit-passport/index.tsx`

```typescript
const { t } = useTranslation(['credit-passport', 'common'])

// Convert:
<Label htmlFor="startDate">Start Date</Label>
// To:
<Label htmlFor="startDate">{t('common:startDate', { defaultValue: 'Start Date' })}</Label>

<strong>Report Type:</strong>
// To:
<strong>{t('credit-passport:reportType', { defaultValue: 'Report Type' })}:</strong>

<strong>Date Range:</strong>
// To:
<strong>{t('credit-passport:dateRange', { defaultValue: 'Date Range' })}:</strong>

<strong>Batches:</strong> {formData.selectedBatches.length}
// To:
<strong>{t('credit-passport:batches', { defaultValue: 'Batches' })}:</strong> {formData.selectedBatches.length}

<strong>Notes:</strong> {formData.notes}
// To:
<strong>{t('common:notes', { defaultValue: 'Notes' })}:</strong> {formData.notes}
```

### Task 7: UPDATE app/routes/\_auth/credit-passport/requests.tsx

- **IMPLEMENT**: Convert hardcoded strong tags to translation keys
- **PATTERN**: Same as Task 6
- **IMPORTS**: Ensure useTranslation includes 'credit-passport' namespace
- **GOTCHA**: Multiple strong tags in dialog content
- **VALIDATE**: `grep -n "Requester:\|Email:\|Organization:\|Purpose:" app/routes/_auth/credit-passport/requests.tsx`

```typescript
const { t } = useTranslation(['credit-passport', 'common'])

// Convert all strong tags:
<strong>Requester:</strong>
// To:
<strong>{t('credit-passport:requester', { defaultValue: 'Requester' })}:</strong>

<strong>Email:</strong>
// To:
<strong>{t('common:email', { defaultValue: 'Email' })}:</strong>

<strong>Organization:</strong>
// To:
<strong>{t('credit-passport:organization', { defaultValue: 'Organization' })}:</strong>

<strong>Purpose:</strong>
// To:
<strong>{t('credit-passport:purpose', { defaultValue: 'Purpose' })}:</strong>
```

### Task 8: UPDATE app/routes/\_auth/credit-passport/history.tsx

- **IMPLEMENT**: Convert hardcoded SelectItem text to translation keys
- **PATTERN**: `app/routes/_auth/batches/index.tsx` (lines 180-190) - SelectItem with t()
- **IMPORTS**: Ensure useTranslation includes 'credit-passport' namespace
- **GOTCHA**: SelectItem values should remain English (for filtering), only labels translate
- **VALIDATE**: `grep -n "Credit Assessment\|Production Certificate\|Impact Report" app/routes/_auth/credit-passport/history.tsx`

```typescript
const { t } = useTranslation(['credit-passport', 'common'])

// Convert SelectItem labels:
<SelectItem value="credit_assessment">Credit Assessment</SelectItem>
// To:
<SelectItem value="credit_assessment">{t('credit-passport:types.creditAssessment', { defaultValue: 'Credit Assessment' })}</SelectItem>

<SelectItem value="production_certificate">Production Certificate</SelectItem>
// To:
<SelectItem value="production_certificate">{t('credit-passport:types.productionCertificate', { defaultValue: 'Production Certificate' })}</SelectItem>

<SelectItem value="impact_report">Impact Report</SelectItem>
// To:
<SelectItem value="impact_report">{t('credit-passport:types.impactReport', { defaultValue: 'Impact Report' })}</SelectItem>
```

### Task 9: CREATE app/lib/i18n/lazy-loader.ts

- **IMPLEMENT**: Create lazy loading utility for locale files
- **PATTERN**: Dynamic import pattern from TanStack Router
- **IMPORTS**: Import i18n from './config'
- **GOTCHA**: Must handle both initial load and subsequent switches
- **VALIDATE**: `cat app/lib/i18n/lazy-loader.ts`

```typescript
import i18n from './config'

/**
 * Lazy load a language's translations
 * Only loads if not already loaded
 */
export async function loadLanguage(lang: string): Promise<void> {
  // Skip if already loaded
  if (i18n.hasResourceBundle(lang, 'common')) {
    return
  }

  try {
    // Dynamic import of locale file
    const locale = await import(`./locales/${lang}`)

    // Add all namespaces from the locale
    Object.keys(locale).forEach((namespace) => {
      i18n.addResourceBundle(lang, namespace, locale[namespace], true, true)
    })
  } catch (error) {
    console.error(`Failed to load language: ${lang}`, error)
    throw error
  }
}

/**
 * Preload a language in the background
 * Useful for prefetching likely language switches
 */
export function preloadLanguage(lang: string): void {
  loadLanguage(lang).catch(() => {
    // Silently fail for preloading
  })
}
```

### Task 10: UPDATE app/lib/i18n/config.ts

- **IMPLEMENT**: Remove static locale imports, keep only English
- **PATTERN**: Dynamic import pattern
- **IMPORTS**: Remove all locale imports except 'en'
- **GOTCHA**: Must keep English for fallback, remove others
- **VALIDATE**: `grep "^import.*from './locales" app/lib/i18n/config.ts`

```typescript
// BEFORE:
import {
  am,
  bn,
  en,
  es,
  fr,
  ha,
  hi,
  id,
  ig,
  pt,
  sw,
  th,
  tr,
  vi,
  yo,
} from './locales'

const resources = {
  en,
  fr,
  pt,
  sw,
  es,
  tr,
  hi,
  ha,
  yo,
  ig,
  id,
  bn,
  th,
  vi,
  am,
}

// AFTER:
import { en } from './locales'

// Only load English initially (fallback language)
const resources = {
  en,
}

// Add missing namespaces
i18n.use(initReactI18next).init({
  resources,
  lng: getSavedLanguage() || 'en',
  fallbackLng: 'en',
  ns: [
    'common',
    'auth',
    'batches',
    'dashboard',
    'settings',
    'eggs',
    'feed',
    'mortality',
    'vaccinations',
    'weight',
    'water-quality',
    'expenses',
    'invoices',
    'reports',
    'inventory',
    'customers',
    'suppliers',
    'farms',
    'validation',
    'errors',
    'onboarding',
    'marketplace',
    'sensors', // ADD
    'extension', // ADD
    'workers', // ADD
    'credit-passport', // ADD
  ],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
  },
})
```

### Task 11: UPDATE app/components/ui/language-switcher.tsx

- **IMPLEMENT**: Add lazy loading call before language change
- **PATTERN**: Async/await pattern with error handling
- **IMPORTS**: Import loadLanguage from '~/lib/i18n/lazy-loader'
- **GOTCHA**: Must await loadLanguage before changeLanguage
- **VALIDATE**: `grep -n "loadLanguage" app/components/ui/language-switcher.tsx`

```typescript
// Add import at top
import { loadLanguage } from '~/lib/i18n/lazy-loader'

// Update handleLanguageChange function (around line 50)
const handleLanguageChange = async (newLang: Language) => {
  try {
    // 1. Save to localStorage FIRST (always works, even without auth)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang)

    // 2. Lazy load language if not already loaded
    await loadLanguage(newLang)

    // 3. Update i18n instance immediately for UI feedback
    await i18n.changeLanguage(newLang)

    // 4. Try to sync to server settings (if authenticated)
    try {
      await updateSettings({ language: newLang })
    } catch {
      // Silently fail - localStorage is our source of truth
    }
  } catch (error) {
    console.error('Failed to change language:', error)
    // Fallback to English if loading fails
    await i18n.changeLanguage('en')
  }
}
```

### Task 12: UPDATE app/lib/i18n/provider.tsx

- **IMPLEMENT**: Add lazy loading when syncing from server settings
- **PATTERN**: Same async pattern as language-switcher
- **IMPORTS**: Import loadLanguage from './lazy-loader'
- **GOTCHA**: Must handle case where user has non-English preference on first load
- **VALIDATE**: `grep -n "loadLanguage" app/lib/i18n/provider.tsx`

```typescript
// Add import at top
import { loadLanguage } from './lazy-loader'

// Update second useEffect (around line 25)
useEffect(() => {
  const syncLanguage = async () => {
    // Priority: localStorage > server settings > default ('en')
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    const targetLang = savedLang || settingsLanguage

    // Sync i18n if different from current
    if (i18n.language !== targetLang) {
      // Lazy load language if needed
      await loadLanguage(targetLang)
      await i18n.changeLanguage(targetLang)
    }

    // Only sync back to localStorage if settingsLanguage is DIFFERENT from default
    if (settingsLanguage !== 'en' && settingsLanguage !== savedLang) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, settingsLanguage)
    }
  }

  syncLanguage().catch((error) => {
    console.error('Failed to sync language:', error)
  })
}, [settingsLanguage])
```

### Task 13: VALIDATE Hardcoded String Conversion

- **IMPLEMENT**: Run grep to verify no hardcoded strings remain
- **PATTERN**: N/A - Validation only
- **IMPORTS**: N/A
- **GOTCHA**: Some technical terms (pH, FCR) are acceptable
- **VALIDATE**: `grep -rE ">[A-Z][a-z]{3,}.*</" app/routes/_auth/sensors app/routes/_auth/extension app/routes/_auth/credit-passport --include="*.tsx" | grep -v "t('" | grep -v "className" | wc -l`

Expected output: `0` (no hardcoded strings)

### Task 14: VALIDATE Bundle Size Reduction

- **IMPLEMENT**: Build and check bundle size
- **PATTERN**: N/A - Validation only
- **IMPORTS**: N/A
- **GOTCHA**: Bundle size varies, look for significant reduction
- **VALIDATE**: `bun run build && ls -lh dist/client/assets/*.js | grep -E "[0-9]+K"`

Expected: Main bundle should be ~700KB smaller than before

### Task 15: VALIDATE Translation Audit

- **IMPLEMENT**: Run translation audit script
- **PATTERN**: N/A - Validation only
- **IMPORTS**: N/A
- **GOTCHA**: Punctuation differences are acceptable
- **VALIDATE**: `bun run scripts/audit-translations.ts 2>&1 | grep "Key Parity"`

Expected output: `✅ All languages have matching keys!`

### Task 16: VALIDATE TypeScript & Lint

- **IMPLEMENT**: Run type checking and linting
- **PATTERN**: N/A - Validation only
- **IMPORTS**: N/A
- **GOTCHA**: Must pass with 0 errors
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

Expected: Both commands exit with code 0

---

## TESTING STRATEGY

### Manual Testing

**Test Language Switching:**

1. Open app in browser
2. Click language switcher
3. Select each language (fr, es, pt, sw, ha, yo, ig, tr, hi, id, bn, th, vi, am)
4. Verify:
   - All text translates correctly
   - No English strings remain
   - Layout doesn't break
   - Language persists on page refresh

**Test Lazy Loading:**

1. Open browser DevTools → Network tab
2. Refresh page
3. Verify only English locale loaded initially
4. Switch to French
5. Verify French locale loaded on demand
6. Check bundle size reduction

**Test Routes with Converted Strings:**

1. Navigate to `/sensors/{id}` - verify AlertDialog text
2. Navigate to `/extension/alerts/{id}` - verify Labels and CardTitle
3. Navigate to `/credit-passport` - verify all labels
4. Switch language and verify translations work

### Automated Testing

No new tests needed - existing tests should pass.

```bash
# Run all tests
bun run test --run

# Verify no regressions
bun run check && bun run build
```

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
# Type checking (fail fast)
npx tsc --noEmit || exit 1

# Linting (fail fast)
bun run lint || exit 1
```

### Level 2: Translation Validation

```bash
# Run translation audit
bun run scripts/audit-translations.ts || exit 1

# Check for hardcoded strings
HARDCODED=$(grep -rE ">[A-Z][a-z]{3,}.*</" app/routes/_auth/sensors app/routes/_auth/extension app/routes/_auth/credit-passport --include="*.tsx" | grep -v "t('" | grep -v "className" | wc -l)
if [ "$HARDCODED" -gt 0 ]; then
  echo "❌ Found $HARDCODED hardcoded strings"
  exit 1
fi
echo "✅ No hardcoded strings found"
```

### Level 3: Build Verification

```bash
# Verify production build works
bun run build || exit 1

# Check bundle size
ls -lh dist/client/assets/*.js
```

### Level 4: Manual Validation

1. Start dev server: `bun dev`
2. Test language switching in UI
3. Verify all routes display correctly in multiple languages
4. Check browser DevTools Network tab for lazy loading

### Complete Validation

```bash
# Run all checks
bun run check && bun run scripts/audit-translations.ts && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All hardcoded strings converted to translation keys (~50 instances)
- [ ] Missing namespaces added to i18n config (sensors, extension, workers, credit-passport)
- [ ] Lazy loading implemented for locale files
- [ ] Initial bundle size reduced by ~700KB
- [ ] Translation audit passes: `✅ All languages have matching keys!`
- [ ] No hardcoded strings found in audited routes
- [ ] All validation commands pass: `npx tsc --noEmit && bun run lint && bun run build`
- [ ] Manual testing confirms:
  - [ ] Language switching works for all 15 languages
  - [ ] Lazy loading works (only active language loaded)
  - [ ] All converted strings display correctly
  - [ ] No layout breaks or visual regressions
- [ ] Code follows LivestockAI patterns:
  - [ ] useTranslation() with proper namespaces
  - [ ] t() calls with defaultValue for all user-facing strings
  - [ ] No hardcoded English text in JSX

---

## COMPLETION CHECKLIST

- [ ] All 16 tasks completed in order
- [ ] Each task validation passed immediately
- [ ] Translation audit passes with 0 hardcoded strings
- [ ] Bundle size reduced by ~700KB
- [ ] All 15 languages work correctly
- [ ] No TypeScript or lint errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decisions

**Why lazy loading?**

- Reduces initial bundle from ~750KB to ~50KB (English only)
- Improves Time to Interactive (TTI) for all users
- Only loads selected language on demand

**Why keep English in initial bundle?**

- English is fallback language
- Ensures app always has translations available
- Small size (43KB) acceptable for baseline

**Why use defaultValue in all t() calls?**

- Provides fallback if translation key missing
- Makes code self-documenting
- Enables gradual i18n adoption

### Trade-offs

**Lazy Loading:**

- ✅ Pro: Massive bundle size reduction (~700KB)
- ✅ Pro: Faster initial page load
- ⚠️ Con: Brief delay when switching languages (~100-200ms)
- ⚠️ Con: Slightly more complex implementation

**Decision:** Benefits far outweigh costs. Brief delay is acceptable for 700KB savings.

### Future Enhancements

**Not in this plan (but recommended for future):**

1. **Pluralization** - Add i18next pluralization rules for proper grammar
2. **RTL Support** - Add right-to-left support for Arabic/Hebrew
3. **Loading States** - Show spinner during language switch
4. **Dev Validation** - Warn about missing keys in development mode

---

**Plan Created:** 2026-01-30 19:20 UTC  
**Estimated Effort:** 4-6 hours  
**Confidence Score:** 9/10 for one-pass success
