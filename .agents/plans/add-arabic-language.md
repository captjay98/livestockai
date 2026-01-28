# Feature: Add Arabic Language Support

## Feature Description

Add Arabic (ar) language support to OpenLivestock Manager, including RTL (right-to-left) text direction handling. Arabic is spoken by 400M+ people across North Africa and the Middle East, with significant livestock markets in Egypt, Sudan, Morocco, and Algeria.

## User Story

As an Arabic-speaking farmer in Egypt, Sudan, or Morocco
I want to use OpenLivestock in my native language with proper RTL layout
So that I can manage my farm without language barriers

## Problem Statement

OpenLivestock currently supports 15 languages but lacks Arabic, which is the primary language for North African livestock markets. Arabic also requires RTL text direction, which needs special handling in the UI.

## Solution Statement

1. Create Arabic translation file (`ar.ts`) with ~1,150 keys
2. Register Arabic in i18n config and language switcher
3. Add RTL support via `dir="rtl"` attribute when Arabic is selected
4. Test RTL layout doesn't break existing components

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium (translations + RTL handling)
**Primary Systems Affected**: i18n, UI layout
**Dependencies**: None (i18next already supports RTL)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/features/i18n/locales/en.ts` - Base translation file (1,116 keys) - copy structure
- `app/features/i18n/locales/index.ts` - Export all locales
- `app/features/i18n/config.ts` - i18n configuration, register new language
- `app/components/ui/language-switcher.tsx` - LANGUAGES array to update
- `app/features/i18n/provider.tsx` - May need RTL direction handling
- `app/routes/__root.tsx` - Root layout where `dir` attribute should be set

### New Files to Create

- `app/features/i18n/locales/ar.ts` - Arabic translations (~1,150 keys)

### Files to Update

- `app/features/i18n/locales/index.ts` - Add `export * from './ar'`
- `app/features/i18n/config.ts` - Import `ar` and add to resources
- `app/components/ui/language-switcher.tsx` - Add Arabic to LANGUAGES array
- `app/features/i18n/provider.tsx` - Add RTL direction handling
- `scripts/validate-translations.ts` - Add `ar` to validation

### Relevant Documentation

- [i18next RTL Support](https://www.i18next.com/overview/configuration-options)
- [Tailwind RTL Plugin](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)
    - Tailwind has built-in `rtl:` and `ltr:` variants

### Patterns to Follow

**Locale File Structure** (from en.ts):

```typescript
export const ar = {
  common: {
    dashboard: 'لوحة التحكم',
    batches: 'الدفعات',
    // ... all keys
  },
  eggs: { ... },
  batches: { ... },
  // ... all namespaces
}
```

**Language Switcher Entry**:

```typescript
{ code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true }
```

**RTL Direction Handling** (in provider or root):

```typescript
useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
}, [i18n.language])
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Arabic Translations

Create `ar.ts` with all translation keys matching `en.ts` structure.

### Phase 2: Register Language

Update config, index, and language switcher to include Arabic.

### Phase 3: RTL Support

Add direction switching when Arabic is selected.

### Phase 4: Validation

Run translation validation and test RTL layout.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/features/i18n/locales/ar.ts`

- **IMPLEMENT**: Create Arabic translation file with all keys from `en.ts`
- **PATTERN**: Mirror exact structure of `app/features/i18n/locales/en.ts`
- **KEY COUNT**: ~1,150 keys (match other locale files)
- **DIRECTION**: Arabic reads right-to-left
- **VALIDATE**: `wc -l app/features/i18n/locales/ar.ts` (should be ~1,100+ lines)

### Task 2: UPDATE `app/features/i18n/locales/index.ts`

- **IMPLEMENT**: Add export for Arabic locale
- **ADD**: `export * from './ar'`
- **VALIDATE**: `grep "ar" app/features/i18n/locales/index.ts`

### Task 3: UPDATE `app/features/i18n/config.ts`

- **IMPLEMENT**: Import and register Arabic in resources
- **ADD TO IMPORTS**: `ar,` in the import statement
- **ADD TO RESOURCES**: `ar,` in the resources object
- **VALIDATE**: `grep "ar" app/features/i18n/config.ts`

### Task 4: UPDATE `app/components/ui/language-switcher.tsx`

- **IMPLEMENT**: Add Arabic to LANGUAGES array
- **ADD**: `{ code: 'ar', label: 'العربية', flag: '🇸🇦' },`
- **POSITION**: Add after existing languages (alphabetically or at end)
- **VALIDATE**: `grep "العربية" app/components/ui/language-switcher.tsx`

### Task 5: UPDATE `app/features/i18n/provider.tsx`

- **IMPLEMENT**: Add RTL direction handling
- **ADD**: useEffect to set `document.documentElement.dir` based on language
- **RTL LANGUAGES**: `['ar']` (can extend later for Hebrew, Urdu, etc.)
- **VALIDATE**: Manual test - switch to Arabic, inspect `<html dir="rtl">`

### Task 6: UPDATE `scripts/validate-translations.ts`

- **IMPLEMENT**: Add Arabic to validation
- **ADD**: Import `ar` from locales
- **ADD**: `ar` to the locales object being validated
- **VALIDATE**: `bun run scripts/validate-translations.ts`

### Task 7: VALIDATE RTL Layout

- **IMPLEMENT**: Manual testing of RTL layout
- **CHECK**: Navigation sidebar flips to right
- **CHECK**: Text alignment correct
- **CHECK**: Forms and inputs work correctly
- **CHECK**: Tables render properly
- **VALIDATE**: Visual inspection in browser

---

## TESTING STRATEGY

### Unit Tests

- Translation validation script passes with Arabic included
- All keys present (no missing translations)

### Manual Testing

1. Switch language to Arabic
2. Verify `<html dir="rtl">` is set
3. Navigate through main pages (dashboard, batches, sales)
4. Check forms work correctly
5. Verify tables display properly
6. Switch back to English, confirm `dir="ltr"`

### Edge Cases

- RTL numbers (should remain LTR for numerals)
- Mixed content (English terms in Arabic text)
- Long Arabic text in buttons/labels

---

## VALIDATION COMMANDS

### Level 1: File Creation

```bash
# Verify Arabic locale exists
test -f app/features/i18n/locales/ar.ts && echo "✅ ar.ts exists"

# Check line count (should be ~1,100+)
wc -l app/features/i18n/locales/ar.ts
```

### Level 2: Registration

```bash
# Verify exports
grep "ar" app/features/i18n/locales/index.ts
grep "ar" app/features/i18n/config.ts
grep "العربية" app/components/ui/language-switcher.tsx
```

### Level 3: Translation Validation

```bash
bun run scripts/validate-translations.ts
```

### Level 4: Build Check

```bash
bun run check
```

### Level 5: Manual Validation

1. Run `bun dev`
2. Open app in browser
3. Switch to Arabic from language selector
4. Verify RTL layout
5. Navigate through pages
6. Switch back to English

---

## ACCEPTANCE CRITERIA

- [ ] Arabic locale file created with ~1,150 keys
- [ ] Arabic registered in i18n config
- [ ] Arabic appears in language switcher with 🇸🇦 flag
- [ ] Selecting Arabic sets `dir="rtl"` on document
- [ ] Selecting non-RTL language sets `dir="ltr"`
- [ ] Translation validation passes
- [ ] `bun run check` passes
- [ ] RTL layout doesn't break existing components
- [ ] Navigation, forms, and tables work in RTL mode

---

## COMPLETION CHECKLIST

- [ ] Task 1: Arabic translations created
- [ ] Task 2: Index exports updated
- [ ] Task 3: Config updated
- [ ] Task 4: Language switcher updated
- [ ] Task 5: RTL direction handling added
- [ ] Task 6: Validation script updated
- [ ] Task 7: RTL layout tested
- [ ] All validation commands pass
- [ ] Manual testing complete

---

## NOTES

### RTL Considerations

- Tailwind CSS has built-in RTL support with `rtl:` variant
- Most flexbox layouts automatically flip in RTL
- Icons generally don't need to flip (except directional arrows)
- Numbers remain LTR even in RTL context

### Arabic Translation Quality

- Use Modern Standard Arabic (MSA) for broad comprehension
- Avoid regional dialects (Egyptian, Moroccan, etc.)
- Keep technical terms consistent with industry standards

### Future RTL Languages

The RTL handling can be extended for:

- Hebrew (he) - Israel
- Urdu (ur) - Pakistan
- Persian/Farsi (fa) - Iran

### Confidence Score

**8/10** - Straightforward implementation following existing patterns. Main risk is RTL layout edge cases in complex components.
