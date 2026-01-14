# Feature: Add Hausa Translations

## Feature Description

Add Hausa language translations to enable Nigerian farmers who speak Hausa to use the app in their native language.

## User Story

As a Hausa-speaking farmer in Northern Nigeria
I want to use OpenLivestock in Hausa
So that I can manage my farm without language barriers

## Problem Statement

i18n infrastructure exists but only English is available. Hausa is the second most spoken language in Nigeria (70+ million speakers), making it critical for adoption in Northern Nigeria.

## Solution Statement

Add Hausa translations for key UI elements:
1. Navigation menu
2. Dashboard labels
3. Common actions (add, edit, delete, save, cancel)
4. Form labels and buttons

Start with high-traffic pages, expand incrementally.

## Feature Metadata

**Feature Type**: Enhancement (i18n)
**Estimated Complexity**: Low (technical) / Medium (requires native speaker)
**Primary Systems Affected**: i18n, UI
**Dependencies**: Native Hausa speaker for accurate translations

---

## CONTEXT REFERENCES

### Relevant Files - MUST READ!

- `app/features/i18n/config.ts` (lines 1-50) - Current English translations
  - Why: Shows structure to mirror for Hausa
- `app/components/navigation.tsx` - Navigation items to translate
- `app/routes/_auth/dashboard/index.tsx` - Dashboard labels to translate

---

## STEP-BY-STEP TASKS

### Task 1: GET Hausa translations from native speaker

- **ACTION**: Provide English strings to Hausa translator
- **STRINGS**: All keys from `resources.en.common` in config.ts
- **VALIDATE**: Review translations for accuracy

### Task 2: ADD Hausa translations to i18n config

- **FILE**: `app/features/i18n/config.ts`
- **IMPLEMENT**: Add `ha` to resources object
```typescript
const resources = {
  en: { common: { ... } },
  ha: {
    common: {
      dashboard: 'Allon Aiki',
      batches: 'Ƙungiyoyi',
      inventory: 'Kayayyaki',
      // ... rest of translations
    }
  }
}
```
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: TEST language switching

- **MANUAL**: Change language to Hausa in settings
- **VERIFY**: UI updates to Hausa
- **VALIDATE**: Visual inspection

### Task 4: UPDATE language setting description

- **FILE**: `app/routes/_auth/settings/index.tsx`
- **UPDATE**: Change "translations coming soon" to "English and Hausa available"
- **VALIDATE**: Visual inspection

---

## ACCEPTANCE CRITERIA

- [ ] Hausa translations added to i18n config
- [ ] Language switcher shows Hausa option
- [ ] Changing to Hausa updates UI
- [ ] Translations are accurate (verified by native speaker)
- [ ] No TypeScript errors

---

## NOTES

**Translation Resources:**
- Get translations from native Hausa speaker
- Use formal/respectful language (farming context)
- Test with actual Hausa users for feedback

**Incremental Approach:**
- Start with navigation and dashboard (most used)
- Add batch/inventory pages next
- Expand to settings and reports later
