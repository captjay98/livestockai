# Feature: Complete i18n Coverage - Fix Hardcoded Strings

## Feature Description

Complete the internationalization implementation by replacing all hardcoded user-facing strings with `t()` translation calls. This enables full multi-language support for the 15 configured locales.

## User Story

As a non-English speaking farmer
I want all UI text to be in my language
So that I can use the application effectively

## Problem Statement

The application has partial i18n implementation:

- **435 strings** properly use `t()` with `defaultValue`
- **~50-100 strings** are hardcoded in components
- **15 locale files** exist but may have missing keys

Hardcoded strings make translations incomplete and create inconsistent UX for non-English users.

## Solution Statement

1. Audit all routes and components for hardcoded strings
2. Add missing translation keys to `en.ts`
3. Replace hardcoded strings with `t()` calls
4. Sync all 15 locale files with new keys
5. Add ESLint rule to prevent future regressions

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: All route files, locale files
**Dependencies**: None

---

## CONTEXT REFERENCES

### Current i18n Infrastructure

**Locale Files** (`app/lib/i18n/locales/`):

- `en.ts` - English (1,420 lines, primary)
- `ha.ts` - Hausa
- `yo.ts` - Yoruba
- `ig.ts` - Igbo
- `fr.ts` - French
- `pt.ts` - Portuguese
- `sw.ts` - Swahili
- `es.ts` - Spanish
- `hi.ts` - Hindi
- `tr.ts` - Turkish
- `id.ts` - Indonesian
- `bn.ts` - Bengali
- `th.ts` - Thai
- `vi.ts` - Vietnamese
- `am.ts` - Amharic

**Namespace Structure** (from `en.ts`):

```typescript
export const en = {
  common: {
    /* shared strings */
  },
  eggs: {
    /* egg production */
  },
  batches: {
    /* batch management */
  },
  dashboard: {
    /* dashboard */
  },
  settings: {
    /* settings */
  },
  // ... other namespaces
}
```

### Files with Hardcoded Strings - MUST FIX

| File                         | Issue Type                             | Count |
| ---------------------------- | -------------------------------------- | ----- |
| `water-quality/index.tsx`    | Labels (pH, Dissolved Oxygen, Ammonia) | 6     |
| `feed/index.tsx`             | Labels, Dialog titles                  | 8     |
| `weight/index.tsx`           | Labels, toast messages                 | 6     |
| `customers/index.tsx`        | Labels, toast messages                 | 5     |
| `customers/$customerId.tsx`  | Labels, toast messages                 | 8     |
| `suppliers/index.tsx`        | Toast messages                         | 2     |
| `suppliers/$supplierId.tsx`  | Toast messages                         | 2     |
| `invoices/$invoiceId.tsx`    | Toast messages                         | 2     |
| `tasks/index.tsx`            | Description text                       | 1     |
| `batches/$batchId/index.tsx` | Loading text                           | 1     |

### Pattern to Follow

**Correct i18n Pattern:**

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation(['feature', 'common'])

  return (
    <>
      {/* Labels */}
      <Label>{t('labels.quantity', { defaultValue: 'Quantity' })}</Label>

      {/* Descriptions */}
      <p className="text-muted-foreground">
        {t('description', { defaultValue: 'Track your records' })}
      </p>

      {/* Toast messages */}
      toast.success(t('messages.saved', { defaultValue: 'Record saved' }))

      {/* Dialog titles */}
      <DialogTitle>
        {t('dialog.deleteTitle', { defaultValue: 'Delete Record' })}
      </DialogTitle>
    </>
  )
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Audit & Document

Identify all hardcoded strings and document required translation keys.

### Phase 2: Update English Locale

Add all missing keys to `en.ts` with proper namespace organization.

### Phase 3: Fix Route Files

Replace hardcoded strings with `t()` calls in each route file.

### Phase 4: Sync Locale Files

Copy new keys to all 14 non-English locale files (with English as placeholder).

### Phase 5: Add Lint Rule

Configure ESLint to catch future hardcoded strings.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/lib/i18n/locales/en.ts` - Add Missing Keys

**ADD** to `waterQuality` namespace:

```typescript
waterQuality: {
  // ... existing keys ...
  labels: {
    ph: 'pH',
    temperature: 'Temperature',
    dissolvedOxygen: 'Dissolved Oxygen (mg/L)',
    ammonia: 'Ammonia (mg/L)',
  },
}
```

**ADD** to `feed` namespace:

```typescript
feed: {
  // ... existing keys ...
  labels: {
    batch: 'Batch',
    feedType: 'Feed Type',
    quantityKg: 'Quantity (kg)',
    date: 'Date',
  },
  dialog: {
    deleteTitle: 'Delete Record',
    deleteDescription: 'Are you sure?',
  },
}
```

**ADD** to `common` namespace:

```typescript
common: {
  // ... existing keys ...
  messages: {
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    updated: 'Updated successfully',
    error: 'An error occurred',
  },
  loading: {
    details: 'Loading details...',
  },
}
```

**VALIDATE**: `npx tsc --noEmit`

### Task 2: UPDATE `app/routes/_auth/water-quality/index.tsx`

**REPLACE** hardcoded labels:

```typescript
// Before
<Label>pH</Label>
<Label>Dissolved Oxygen (mg/L)</Label>
<Label>Ammonia (mg/L)</Label>

// After
<Label>{t('waterQuality:labels.ph', { defaultValue: 'pH' })}</Label>
<Label>{t('waterQuality:labels.dissolvedOxygen', { defaultValue: 'Dissolved Oxygen (mg/L)' })}</Label>
<Label>{t('waterQuality:labels.ammonia', { defaultValue: 'Ammonia (mg/L)' })}</Label>
```

**VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE `app/routes/_auth/feed/index.tsx`

**REPLACE** hardcoded labels and dialog text with `t()` calls.

**VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE `app/routes/_auth/weight/index.tsx`

**REPLACE** hardcoded labels and toast messages with `t()` calls.

**VALIDATE**: `npx tsc --noEmit`

### Task 5: UPDATE `app/routes/_auth/customers/index.tsx`

**REPLACE** hardcoded labels and toast messages with `t()` calls.

**VALIDATE**: `npx tsc --noEmit`

### Task 6: UPDATE `app/routes/_auth/customers/$customerId.tsx`

**REPLACE** hardcoded labels and toast messages with `t()` calls.

**VALIDATE**: `npx tsc --noEmit`

### Task 7: UPDATE `app/routes/_auth/suppliers/index.tsx`

**REPLACE** hardcoded toast messages with `t()` calls.

**VALIDATE**: `npx tsc --noEmit`

### Task 8: UPDATE `app/routes/_auth/suppliers/$supplierId.tsx`

**REPLACE** hardcoded toast messages with `t()` calls.

**VALIDATE**: `npx tsc --noEmit`

### Task 9: UPDATE `app/routes/_auth/invoices/$invoiceId.tsx`

**REPLACE** hardcoded toast messages with `t()` calls.

**VALIDATE**: `npx tsc --noEmit`

### Task 10: UPDATE `app/routes/_auth/tasks/index.tsx`

**REPLACE** hardcoded description text with `t()` call.

**VALIDATE**: `npx tsc --noEmit`

### Task 11: UPDATE `app/routes/_auth/batches/$batchId/index.tsx`

**REPLACE** hardcoded loading text with `t()` call.

**VALIDATE**: `npx tsc --noEmit`

### Task 12: SYNC all 14 non-English locale files

**FOR EACH** locale file (`ha.ts`, `yo.ts`, `ig.ts`, `fr.ts`, `pt.ts`, `sw.ts`, `es.ts`, `hi.ts`, `tr.ts`, `id.ts`, `bn.ts`, `th.ts`, `vi.ts`, `am.ts`):

1. Copy new keys from `en.ts`
2. Keep English values as placeholders (native speakers can translate later)

**VALIDATE**: `npx tsc --noEmit`

### Task 13: ADD ESLint rule for i18n

**INSTALL**: `bun add -D eslint-plugin-i18next`

**UPDATE** `.eslintrc.js` or `eslint.config.js`:

```javascript
{
  plugins: ['i18next'],
  rules: {
    'i18next/no-literal-string': ['warn', {
      markupOnly: true,
      ignoreAttribute: ['className', 'style', 'type', 'name', 'id', 'href', 'src'],
    }],
  },
}
```

**VALIDATE**: `bun run lint`

### Task 14: Final Validation

**VALIDATE**: `bun run check && bun run lint && bun run test --run`

---

## TESTING STRATEGY

### Manual Testing

1. Switch language in settings to each supported language
2. Navigate through all routes
3. Verify no English text appears (except proper nouns)

### Automated Validation

```bash
# Check for remaining hardcoded strings
grep -rn ">[A-Z][a-z]" app/routes/_auth/ --include="*.tsx" | grep -v "t(" | grep -v "{"

# Should return minimal results (only dynamic content)
```

### Validation Commands

```bash
# Type checking
npx tsc --noEmit

# Linting (will warn on hardcoded strings after Task 13)
bun run lint

# Full validation
bun run check && bun run lint && bun run test --run
```

---

## ACCEPTANCE CRITERIA

- [ ] All user-facing strings use `t()` with `defaultValue`
- [ ] No hardcoded strings in route files (except technical values)
- [ ] All 15 locale files have matching keys
- [ ] ESLint rule catches new hardcoded strings
- [ ] All validation commands pass
- [ ] All existing tests pass

---

## COMPLETION CHECKLIST

- [ ] Task 1: English locale updated with missing keys
- [ ] Task 2: water-quality/index.tsx fixed
- [ ] Task 3: feed/index.tsx fixed
- [ ] Task 4: weight/index.tsx fixed
- [ ] Task 5: customers/index.tsx fixed
- [ ] Task 6: customers/$customerId.tsx fixed
- [ ] Task 7: suppliers/index.tsx fixed
- [ ] Task 8: suppliers/$supplierId.tsx fixed
- [ ] Task 9: invoices/$invoiceId.tsx fixed
- [ ] Task 10: tasks/index.tsx fixed
- [ ] Task 11: batches/$batchId/index.tsx fixed
- [ ] Task 12: All 14 locale files synced
- [ ] Task 13: ESLint rule added
- [ ] Task 14: Final validation passes

---

## NOTES

### Translation Workflow

After this task, the workflow for adding translations is:

1. Native speaker opens locale file (e.g., `ha.ts` for Hausa)
2. Replaces English placeholder values with translations
3. Submits PR for review

### Keys Already Translated

The existing 435 `t()` calls with `defaultValue` are already in the locale files. This task only adds the ~50 missing keys.

### Future Prevention

The ESLint rule `i18next/no-literal-string` will warn developers when they add hardcoded strings, preventing future i18n debt.

### Estimated Time

| Phase                    | Time         |
| ------------------------ | ------------ |
| Task 1 (locale keys)     | 30 min       |
| Tasks 2-11 (route fixes) | 2 hours      |
| Task 12 (sync locales)   | 1 hour       |
| Task 13 (ESLint)         | 15 min       |
| Task 14 (validation)     | 15 min       |
| **Total**                | **~4 hours** |
