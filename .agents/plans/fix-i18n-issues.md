# Feature: Complete i18n Implementation Fixes

## Feature Description

Fix all identified i18n issues from the comprehensive audit to achieve 100% internationalization coverage across 15 languages. This includes translating missing keys, adding useTranslation hooks to routes, converting hardcoded strings, and fixing minor inconsistencies.

## User Story

As a LivestockAI user in any of the 15 supported languages
I want all text in the application to be properly translated
So that I can use the application in my native language without seeing English fallbacks

## Problem Statement

The i18n audit revealed 6 categories of issues affecting user experience for non-English speakers:

1. **Untranslated Credit Passport Module**: 182 missing translations (13 keys × 14 languages)
2. **Routes Missing useTranslation**: 7 routes without i18n integration
3. **Hardcoded Strings**: 196 user-facing strings not using translation keys
4. **Additional Untranslated Keys**: 56 missing translations (4 keys × 14 languages)
5. **Punctuation Inconsistencies**: 20 keys in Portuguese/Swahili
6. **Placeholder Inconsistency**: 1 key with extra placeholder

**Impact**: Users in non-English locales see English text or inconsistent formatting, degrading the user experience.

## Solution Statement

Systematically address each issue category:

1. Translate all missing keys in all 14 non-English locales
2. Add useTranslation hooks to 7 routes
3. Convert hardcoded strings to translation keys (prioritize user-facing text)
4. Fix punctuation inconsistencies
5. Verify and fix placeholder issues

This will achieve 100% i18n coverage and provide a consistent multilingual experience.

## Feature Metadata

**Feature Type**: Enhancement (i18n Completion)
**Estimated Complexity**: Medium
**Primary Systems Affected**:

- Locale files (15 languages)
- Routes (7 files)
- Components (multiple files with hardcoded strings)

**Dependencies**:

- react-i18next (already installed)
- Existing i18n infrastructure (already in place)

---

## CONTEXT REFERENCES

### Audit Report

**Location**: `.agents/reports/i18n-audit-2026-01-31.md`
**Why**: Complete list of all issues with examples and affected files

### Relevant Codebase Files

**IMPORTANT: READ THESE BEFORE IMPLEMENTING!**

**i18n Infrastructure**:

- `app/lib/i18n/config.ts` - i18next configuration
- `app/lib/i18n/provider.tsx` - React provider
- `app/lib/i18n/locales/en/creditPassport.ts` - English credit passport keys (template)
- `app/lib/i18n/locales/index.ts` - Locale exports

**Routes to Update**:

- `app/routes/_auth/tasks/index.tsx` - Missing useTranslation
- `app/routes/_auth/attendance.tsx` - Missing useTranslation
- `app/routes/_auth/payroll.tsx` - Missing useTranslation
- `app/routes/_auth/feed-formulation/prices.tsx` - Missing useTranslation
- `app/routes/_auth/farms/$farmId.tsx` - Missing useTranslation
- `app/routes/_auth/task-assignments.tsx` - Missing useTranslation
- `app/routes/_auth/reports/index.tsx` - Missing useTranslation

**Routes with Hardcoded Strings**:

- `app/routes/__root.tsx` (line 37)
- `app/routes/verify.$reportId.tsx` (lines 44, 223, 265-266)
- `app/routes/_auth/task-assignments.tsx` (line 12)
- `app/routes/_auth/reports/index.tsx` (line 129)
- `app/routes/marketplace/index.tsx` (lines 315-327)

### Patterns to Follow

**useTranslation Hook Pattern**:

```typescript
import { useTranslation } from 'react-i18next'

function Component() {
  const { t } = useTranslation(['namespace', 'common'])

  return (
    <div>
      <h1>{t('namespace:key', { defaultValue: 'Fallback' })}</h1>
      <p>{t('common:description')}</p>
    </div>
  )
}
```

**Translation Key Pattern**:

```typescript
// ❌ Before
<SelectItem value="newest">Newest</SelectItem>

// ✅ After
<SelectItem value="newest">{t('marketplace:sortNewest')}</SelectItem>
```

**Locale File Pattern**:

```typescript
// app/lib/i18n/locales/{lang}/namespace.ts
export const namespace = {
  key: 'Translated text',
  nested: {
    key: 'Nested translated text',
  },
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Translate Credit Passport Module (Priority 1)

**Goal**: Add 182 missing translations (13 keys × 14 languages)

**Affected Languages**: fr, pt, sw, es, tr, hi, ha, yo, ig, id, bn, th, vi, am

**Tasks**:

1. For each language, add translations to `app/lib/i18n/locales/{lang}/creditPassport.ts`
2. Use English version as template
3. Verify with audit script

### Phase 2: Add useTranslation to Routes (Priority 2)

**Goal**: Add i18n integration to 7 routes

**Tasks**:

1. Add useTranslation import and hook to each route
2. Convert any hardcoded strings in these routes
3. Verify TypeScript compilation

### Phase 3: Convert Hardcoded Strings (Priority 3)

**Goal**: Convert 196 hardcoded strings to translation keys

**Strategy**:

1. Prioritize user-facing text (buttons, labels, messages)
2. Keep technical values (IDs, codes) as-is
3. Add new translation keys to appropriate namespaces
4. Update components to use t()

### Phase 4: Fix Additional Issues (Priority 4)

**Goal**: Fix remaining minor issues

**Tasks**:

1. Translate 4 additional keys (notifications, feedFormulation, breeds)
2. Fix punctuation in Portuguese/Swahili (optional)
3. Verify placeholder consistency

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute in order. Each task is independently testable.

### Phase 1: Translate Credit Passport Module

### UPDATE `app/lib/i18n/locales/fr/creditPassport.ts`

- **IMPLEMENT**: Add French translations for 13 credit passport keys
- **PATTERN**: Mirror `app/lib/i18n/locales/en/creditPassport.ts`
- **VALIDATE**: `grep "title:" app/lib/i18n/locales/fr/creditPassport.ts`

```typescript
export const creditPassport = {
  title: 'Passeport de Crédit',
  fullTitle: 'Passeport de Crédit LivestockAI',
  messages: {
    csvDownloaded: 'Rapport CSV téléchargé avec succès',
    generationFailed: 'Échec de la génération du rapport',
  },
  verification: {
    failed: 'Vérification Échouée',
    freshnessLevel: 'Niveau de Fraîcheur',
    reportType: 'Type de Rapport:',
    verificationCount: 'Nombre de Vérifications:',
  },
  steps: {
    selectReportType: 'Sélectionner le Type de Rapport',
    selectDateRange: 'Sélectionner la Plage de Dates',
    selectBatches: 'Sélectionner les Lots',
  },
  filters: {
    filterByType: 'Filtrer par type',
    filterByStatus: 'Filtrer par statut',
    allTypes: 'Tous les Types',
    allStatus: 'Tous les Statuts',
  },
  placeholders: {
    reportNotes:
      'Ajoutez tout contexte supplémentaire ou exigences spécifiques pour ce rapport...',
  },
  dialogs: {
    deleteReport: 'Supprimer le Rapport',
    deleteReportDesc:
      'Êtes-vous sûr de vouloir supprimer ce rapport? Cette action ne peut pas être annulée. Le rapport ne sera plus accessible pour vérification.',
  },
  empty: {
    total: 'Aucun rapport trouvé',
    desc: 'Générez votre premier rapport de passeport de crédit pour commencer.',
  },
}
```

### UPDATE `app/lib/i18n/locales/pt/creditPassport.ts`

- **IMPLEMENT**: Add Portuguese translations
- **VALIDATE**: `grep "title:" app/lib/i18n/locales/pt/creditPassport.ts`

```typescript
export const creditPassport = {
  title: 'Passaporte de Crédito',
  fullTitle: 'Passaporte de Crédito LivestockAI',
  messages: {
    csvDownloaded: 'Relatório CSV baixado com sucesso',
    generationFailed: 'Falha ao gerar relatório',
  },
  verification: {
    failed: 'Verificação Falhou',
    freshnessLevel: 'Nível de Frescura',
    reportType: 'Tipo de Relatório:',
    verificationCount: 'Contagem de Verificações:',
  },
  steps: {
    selectReportType: 'Selecionar Tipo de Relatório',
    selectDateRange: 'Selecionar Intervalo de Datas',
    selectBatches: 'Selecionar Lotes',
  },
  filters: {
    filterByType: 'Filtrar por tipo',
    filterByStatus: 'Filtrar por status',
    allTypes: 'Todos os Tipos',
    allStatus: 'Todos os Status',
  },
  placeholders: {
    reportNotes:
      'Adicione qualquer contexto adicional ou requisitos específicos para este relatório...',
  },
  dialogs: {
    deleteReport: 'Excluir Relatório',
    deleteReportDesc:
      'Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita. O relatório não estará mais acessível para verificação.',
  },
  empty: {
    total: 'Nenhum relatório encontrado',
    desc: 'Gere seu primeiro relatório de passaporte de crédito para começar.',
  },
}
```

### UPDATE Remaining 12 Languages

- **IMPLEMENT**: Add translations for sw, es, tr, hi, ha, yo, ig, id, bn, th, vi, am
- **PATTERN**: Same structure as French/Portuguese above
- **NOTE**: Use appropriate translations for each language
- **VALIDATE**: `bun run scripts/audit-translations.ts | grep creditPassport`

**Languages to update**:

1. `app/lib/i18n/locales/sw/creditPassport.ts` (Swahili)
2. `app/lib/i18n/locales/es/creditPassport.ts` (Spanish)
3. `app/lib/i18n/locales/tr/creditPassport.ts` (Turkish)
4. `app/lib/i18n/locales/hi/creditPassport.ts` (Hindi)
5. `app/lib/i18n/locales/ha/creditPassport.ts` (Hausa)
6. `app/lib/i18n/locales/yo/creditPassport.ts` (Yoruba)
7. `app/lib/i18n/locales/ig/creditPassport.ts` (Igbo)
8. `app/lib/i18n/locales/id/creditPassport.ts` (Indonesian)
9. `app/lib/i18n/locales/bn/creditPassport.ts` (Bengali)
10. `app/lib/i18n/locales/th/creditPassport.ts` (Thai)
11. `app/lib/i18n/locales/vi/creditPassport.ts` (Vietnamese)
12. `app/lib/i18n/locales/am/creditPassport.ts` (Amharic)

### VALIDATE Phase 1 Completion

- **IMPLEMENT**: Run audit script to verify credit passport translations
- **VALIDATE**: `bun run scripts/audit-translations.ts | grep -A 5 "creditPassport"`

Expected: No untranslated creditPassport keys

---

### Phase 2: Add useTranslation to Routes

### UPDATE `app/routes/_auth/tasks/index.tsx`

- **IMPLEMENT**: Add useTranslation hook
- **PATTERN**: See `app/routes/_auth/batches/index.tsx` for reference
- **IMPORTS**: `import { useTranslation } from 'react-i18next'`
- **VALIDATE**: `grep "useTranslation" app/routes/_auth/tasks/index.tsx`

```typescript
// Add after other imports
import { useTranslation } from 'react-i18next'

function TasksPage() {
  const { t } = useTranslation(['tasks', 'common'])
  // ... rest of component
}
```

### UPDATE `app/routes/_auth/attendance.tsx`

- **IMPLEMENT**: Add useTranslation hook
- **VALIDATE**: `grep "useTranslation" app/routes/_auth/attendance.tsx`

```typescript
import { useTranslation } from 'react-i18next'

function AttendancePage() {
  const { t } = useTranslation(['workers', 'common'])
  // ... rest of component
}
```

### UPDATE `app/routes/_auth/payroll.tsx`

- **IMPLEMENT**: Add useTranslation hook
- **VALIDATE**: `grep "useTranslation" app/routes/_auth/payroll.tsx`

```typescript
import { useTranslation } from 'react-i18next'

function PayrollPage() {
  const { t } = useTranslation(['workers', 'common'])
  // ... rest of component
}
```

### UPDATE `app/routes/_auth/feed-formulation/prices.tsx`

- **IMPLEMENT**: Add useTranslation hook
- **VALIDATE**: `grep "useTranslation" app/routes/_auth/feed-formulation/prices.tsx`

```typescript
import { useTranslation } from 'react-i18next'

function FeedPricesPage() {
  const { t } = useTranslation(['feedFormulation', 'common'])
  // ... rest of component
}
```

### UPDATE `app/routes/_auth/farms/$farmId.tsx`

- **IMPLEMENT**: Add useTranslation hook
- **VALIDATE**: `grep "useTranslation" app/routes/_auth/farms/\\$farmId.tsx`

```typescript
import { useTranslation } from 'react-i18next'

function FarmDetailPage() {
  const { t } = useTranslation(['farms', 'common'])
  // ... rest of component
}
```

### UPDATE `app/routes/_auth/task-assignments.tsx`

- **IMPLEMENT**: Add useTranslation hook and fix hardcoded string
- **VALIDATE**: `grep "useTranslation" app/routes/_auth/task-assignments.tsx`

```typescript
import { useTranslation } from 'react-i18next'

function TaskAssignmentsPage() {
  const { t } = useTranslation(['tasks', 'common'])

  // Fix hardcoded string (line 12)
  if (!selectedFarmId) {
    return <div>{t('common:selectFarmFirst', { defaultValue: 'Please select a farm first' })}</div>
  }
  // ... rest of component
}
```

### UPDATE `app/routes/_auth/reports/index.tsx`

- **IMPLEMENT**: Add useTranslation hook and fix hardcoded strings
- **VALIDATE**: `grep "useTranslation" app/routes/_auth/reports/index.tsx`

```typescript
import { useTranslation } from 'react-i18next'

function ReportsPage() {
  const { t } = useTranslation(['reports', 'common'])

  // Fix hardcoded string (line 129)
  // Replace: 💡 <strong>Tip:</strong> Reports default to your selected farm
  // With: {t('reports:tip', { defaultValue: '💡 Tip: Reports default to your selected farm' })}

  // ... rest of component
}
```

### VALIDATE Phase 2 Completion

- **IMPLEMENT**: Verify all routes have useTranslation
- **VALIDATE**: `grep -L "useTranslation" app/routes/_auth/tasks/index.tsx app/routes/_auth/attendance.tsx app/routes/_auth/payroll.tsx app/routes/_auth/feed-formulation/prices.tsx app/routes/_auth/farms/\\$farmId.tsx app/routes/_auth/task-assignments.tsx app/routes/_auth/reports/index.tsx`

Expected: No output (all files have useTranslation)

---

### Phase 3: Convert High-Priority Hardcoded Strings

### UPDATE `app/routes/__root.tsx`

- **IMPLEMENT**: Convert hardcoded title (line 37)
- **PATTERN**: Use t() with defaultValue
- **VALIDATE**: `grep "t('errors:pageTitle" app/routes/__root.tsx`

```typescript
// Line 37
// Before: <title>Error - LivestockAI</title>
// After:
<title>{t('errors:pageTitle', { defaultValue: 'Error - LivestockAI' })}</title>
```

### UPDATE `app/routes/verify.$reportId.tsx`

- **IMPLEMENT**: Convert 4 hardcoded strings (lines 44, 223, 265-266)
- **VALIDATE**: `grep "t('reports:" app/routes/verify.\\$reportId.tsx | wc -l`

```typescript
// Line 44
// Before: return <div>Report not found</div>
// After:
return <div>{t('reports:notFound', { defaultValue: 'Report not found' })}</div>

// Line 223
// Before: <CardTitle>Report Information</CardTitle>
// After:
<CardTitle>{t('reports:information', { defaultValue: 'Report Information' })}</CardTitle>

// Lines 265-266
// Before:
// <p>This report is cryptographically signed and tamper-proof.</p>
// <p>Powered by LivestockAI - Advanced Livestock Management</p>
// After:
<p>{t('reports:cryptoSigned', { defaultValue: 'This report is cryptographically signed and tamper-proof.' })}</p>
<p>{t('common:poweredBy', { defaultValue: 'Powered by LivestockAI - Advanced Livestock Management' })}</p>
```

### UPDATE `app/routes/marketplace/index.tsx`

- **IMPLEMENT**: Convert SelectItem hardcoded strings (lines 315-327)
- **VALIDATE**: `grep "t('marketplace:sort" app/routes/marketplace/index.tsx | wc -l`

```typescript
// Lines 315-327
// Before:
<SelectItem value="newest">Newest</SelectItem>
<SelectItem value="price_asc">Price: Low-High</SelectItem>
<SelectItem value="price_desc">Price: High-Low</SelectItem>
// ... more items

// After:
<SelectItem value="newest">{t('marketplace:sortNewest', { defaultValue: 'Newest' })}</SelectItem>
<SelectItem value="price_asc">{t('marketplace:sortPriceAsc', { defaultValue: 'Price: Low-High' })}</SelectItem>
<SelectItem value="price_desc">{t('marketplace:sortPriceDesc', { defaultValue: 'Price: High-Low' })}</SelectItem>
// ... convert remaining items
```

### ADD Translation Keys to English Locales

- **IMPLEMENT**: Add new keys used above to English locale files
- **FILES**:
  - `app/lib/i18n/locales/en/errors.ts`
  - `app/lib/i18n/locales/en/reports.ts`
  - `app/lib/i18n/locales/en/common.ts`
  - `app/lib/i18n/locales/en/marketplace.ts`
- **VALIDATE**: `bun run scripts/audit-translations.ts`

```typescript
// errors.ts
export const errors = {
  // ... existing keys
  pageTitle: 'Error - LivestockAI',
}

// reports.ts
export const reports = {
  // ... existing keys
  notFound: 'Report not found',
  information: 'Report Information',
  cryptoSigned: 'This report is cryptographically signed and tamper-proof.',
}

// common.ts
export const common = {
  // ... existing keys
  selectFarmFirst: 'Please select a farm first',
  poweredBy: 'Powered by LivestockAI - Advanced Livestock Management',
}

// marketplace.ts
export const marketplace = {
  // ... existing keys
  sortNewest: 'Newest',
  sortPriceAsc: 'Price: Low-High',
  sortPriceDesc: 'Price: High-Low',
  // ... add remaining sort options
}
```

### VALIDATE Phase 3 Completion

- **IMPLEMENT**: Verify high-priority strings converted
- **VALIDATE**: `grep -rn "Report not found" app/routes/verify.\\$reportId.tsx`

Expected: No matches (all converted to t())

---

### Phase 4: Fix Additional Issues

### ADD Missing Translation Keys

- **IMPLEMENT**: Add 4 missing keys to all 14 non-English locales
- **KEYS**:
  - `notifications.delete: "Delete"`
  - `feedFormulation.totalBatchCost: "Total batch cost"`
  - `breeds.request.failed: "Failed to submit request"`
  - `breeds.placeholders.additionalInfo: "Any additional information..."`
- **VALIDATE**: `bun run scripts/audit-translations.ts | grep -E "(notifications.delete|feedFormulation.totalBatchCost|breeds.request.failed)"`

**Files to update** (14 languages × 3 namespace files):

- `app/lib/i18n/locales/{lang}/notifications.ts` - Add `delete` key
- `app/lib/i18n/locales/{lang}/feedFormulation.ts` - Add `totalBatchCost` key
- `app/lib/i18n/locales/{lang}/breeds.ts` - Add `request.failed` and `placeholders.additionalInfo` keys

### FIX Punctuation (Optional)

- **IMPLEMENT**: Add periods to Portuguese/Swahili translations
- **AFFECTED**: 10 keys in each language
- **VALIDATE**: `bun run scripts/audit-translations.ts | grep PUNCTUATION`

**Keys to fix**:

```
financial.customers.description
financial.customers.top.desc
financial.customers.dialog.deleteDesc
financial.suppliers.description
financial.suppliers.dialog.deleteDesc
customers.description
customers.top.desc
customers.dialog.deleteDesc
suppliers.description
suppliers.dialog.deleteDesc
```

### VERIFY Placeholder Consistency

- **IMPLEMENT**: Check if `{{count}}` in marketplace.listing.daysAgo is intentional
- **VALIDATE**: `grep "daysAgo" app/lib/i18n/locales/en/marketplace.ts`

If not needed, remove from all languages. If needed for pluralization, keep as-is.

---

## TESTING STRATEGY

### Validation Commands

```bash
# 1. Run translation audit
bun run scripts/audit-translations.ts

# 2. TypeScript compilation
npx tsc --noEmit

# 3. Linting
bun run lint

# 4. Build verification
bun run build
```

### Manual Testing

```bash
# Start dev server
bun dev

# Test each language:
# 1. Navigate to http://localhost:3001
# 2. Click language switcher
# 3. Select each language
# 4. Navigate to:
#    - Credit Passport page
#    - Tasks page
#    - Reports page
#    - Marketplace page
#    - Verify report page
# 5. Verify all text is translated
# 6. Check for English fallbacks
```

### Edge Cases

- Verify defaultValue fallbacks work if key missing
- Test with missing locale files (should fall back to English)
- Test language switching (should update immediately)
- Verify pluralization works correctly

---

## VALIDATION COMMANDS

### Level 1: Translation Audit

```bash
# Run audit script
bun run scripts/audit-translations.ts

# Expected: Significantly reduced issues
# - creditPassport: 0 untranslated
# - notifications/feedFormulation/breeds: 0 untranslated
# - Punctuation: 0 or 20 (if skipped optional fix)
```

### Level 2: TypeScript Compilation

```bash
npx tsc --noEmit || exit 1
```

### Level 3: Linting

```bash
bun run lint || exit 1
```

### Level 4: Build Verification

```bash
bun run build || exit 1
```

### Level 5: Manual Validation

**Test Credit Passport** (all languages):

1. Navigate to `/credit-passport`
2. Switch language
3. Verify all text translated

**Test Routes** (7 routes):

1. Navigate to each route
2. Verify useTranslation working
3. Check for hardcoded strings

**Test Marketplace**:

1. Navigate to `/marketplace`
2. Check sort dropdown
3. Verify all options translated

---

## ACCEPTANCE CRITERIA

- [ ] All 182 credit passport translations added (13 keys × 14 languages)
- [ ] All 7 routes have useTranslation hook
- [ ] High-priority hardcoded strings converted (20+ strings)
- [ ] 4 additional missing keys translated (56 total translations)
- [ ] Translation audit shows <10 issues (down from 200+)
- [ ] TypeScript compilation passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Manual testing confirms translations work
- [ ] No regressions in existing functionality
- [ ] All 15 languages display correctly
- [ ] Language switching works smoothly
- [ ] Fallbacks work when keys missing

---

## COMPLETION CHECKLIST

- [ ] Phase 1: Credit passport translations (14 languages)
- [ ] Phase 2: useTranslation added to 7 routes
- [ ] Phase 3: High-priority hardcoded strings converted
- [ ] Phase 4: Additional issues fixed
- [ ] Translation audit passes
- [ ] TypeScript compilation passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Manual testing completed
- [ ] All acceptance criteria met

---

## NOTES

### Translation Guidelines

**For translators**:

1. Maintain consistent terminology across namespaces
2. Keep technical terms in English if commonly used (e.g., "CSV", "API")
3. Preserve placeholder syntax: `{{variable}}`
4. Match punctuation style of target language
5. Consider cultural context for farming terminology

### Estimated Effort

| Phase     | Tasks                          | Estimated Time |
| --------- | ------------------------------ | -------------- |
| Phase 1   | Credit passport (14 languages) | 2-3 hours      |
| Phase 2   | Add useTranslation (7 routes)  | 1 hour         |
| Phase 3   | Convert hardcoded strings      | 2-3 hours      |
| Phase 4   | Additional fixes               | 1 hour         |
| Testing   | Manual validation              | 1 hour         |
| **Total** |                                | **7-9 hours**  |

### Priority Order

If time-constrained, implement in this order:

1. **Phase 1** (Credit Passport) - Most visible to users
2. **Phase 2** (useTranslation) - Enables future translations
3. **Phase 3** (Hardcoded strings) - Improves UX
4. **Phase 4** (Minor fixes) - Polish

### Future Improvements

After this fix:

1. Add linting rule to detect hardcoded strings
2. Create translation workflow documentation
3. Set up automated translation validation in CI
4. Consider using translation management platform (e.g., Crowdin)

---

## CONFIDENCE SCORE

**8/10** - High confidence for successful implementation

**Reasoning**:

- ✅ Clear patterns to follow
- ✅ Existing infrastructure in place
- ✅ Comprehensive audit provides roadmap
- ✅ Validation commands available
- ⚠️ Manual translation work required (time-consuming)
- ⚠️ Need to verify translations are accurate

**Risks**:

- Translation quality depends on translator knowledge
- Some strings may need context to translate correctly
- Potential for missing edge cases in hardcoded string detection

**Mitigation**:

- Use defaultValue for all t() calls (graceful fallback)
- Test thoroughly in each language
- Get native speaker review for critical languages
