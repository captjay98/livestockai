# Feature: Internationalization (i18n) for African Markets

## Feature Description

Add comprehensive multi-language support for OpenLivestock Manager, focusing on key African languages: French (West/Central Africa), Portuguese (Angola, Mozambique), and Swahili (East Africa). Expand existing i18n infrastructure with complete translations for all UI text, documentation, and error messages.

## User Story

As a **farmer or farm manager in francophone, lusophone, or Swahili-speaking Africa**
I want to **use OpenLivestock in my native language**
So that **I can manage my farm more effectively without language barriers**

## Problem Statement

Current application only supports English, limiting adoption in:

- **Francophone Africa**: Senegal, Côte d'Ivoire, Cameroon, DRC, Mali, Burkina Faso (26 countries, 120M+ French speakers)
- **Lusophone Africa**: Angola, Mozambique, Guinea-Bissau, Cape Verde (5 countries, 30M+ Portuguese speakers)
- **Swahili-speaking Africa**: Kenya, Tanzania, Uganda, DRC (4 countries, 100M+ Swahili speakers)

Language barriers prevent farmers from:

- Understanding UI labels and navigation
- Reading error messages and alerts
- Following documentation and guides
- Onboarding new users

## Solution Statement

Expand existing i18n infrastructure (i18next + react-i18next) with:

1. **Complete French translations** - All UI text, documentation, error messages
2. **Complete Portuguese translations** - All UI text, documentation, error messages
3. **Complete Swahili translations** - All UI text, documentation, error messages
4. **Translation management** - Organized by namespace (common, batches, sales, etc.)
5. **Language switcher** - UI component for changing language
6. **Documentation translations** - Translate key docs (README, DEPLOYMENT, TESTING)
7. **Validation** - Ensure all strings are translated, no missing keys

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High (requires native speakers for accurate translations)
**Primary Systems Affected**: All UI components, documentation
**Dependencies**: i18next, react-i18next (already installed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/features/i18n/config.ts` - Why: Existing i18n configuration with English baseline
- `app/features/i18n/provider.tsx` - Why: I18nProvider that syncs with user settings
- `app/features/settings/server.ts` - Why: User language preference storage
- `app/lib/db/types.ts` (UserSettingsTable) - Why: Language field definition
- `app/routes/_auth/settings/index.tsx` - Why: Language selector UI
- `app/components/navigation.tsx` - Why: Navigation labels to translate
- `app/components/dialogs/*.tsx` - Why: Dialog text to translate
- `docs/README.md` - Why: Documentation to translate
- `docs/DEPLOYMENT.md` - Why: Deployment guide to translate

### New Files to Create

- `app/features/i18n/locales/fr.ts` - French translations
- `app/features/i18n/locales/pt.ts` - Portuguese translations
- `app/features/i18n/locales/sw.ts` - Swahili translations
- `app/features/i18n/locales/index.ts` - Export all locales
- `app/components/language-switcher.tsx` - Language selector component
- `docs/i18n/README.fr.md` - French README
- `docs/i18n/README.pt.md` - Portuguese README
- `docs/i18n/README.sw.md` - Swahili README
- `docs/i18n/DEPLOYMENT.fr.md` - French deployment guide
- `docs/i18n/DEPLOYMENT.pt.md` - Portuguese deployment guide
- `docs/i18n/DEPLOYMENT.sw.md` - Swahili deployment guide
- `scripts/validate-translations.ts` - Script to check for missing keys

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [i18next Documentation](https://www.i18next.com/)
    - Specific section: Namespaces, Plurals, Interpolation
    - Why: Advanced i18n features
- [react-i18next Documentation](https://react.i18next.com/)
    - Specific section: useTranslation hook, Trans component
    - Why: React integration patterns
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
    - Specific section: Plurals, Gender
    - Why: Complex translation patterns

### Patterns to Follow

**Translation File Structure:**

```typescript
export const fr = {
    common: {
        // Navigation
        dashboard: 'Tableau de bord',
        batches: 'Lots',
        inventory: 'Inventaire',
        sales: 'Ventes',
        expenses: 'Dépenses',
        reports: 'Rapports',
        settings: 'Paramètres',

        // Actions
        add: 'Ajouter',
        edit: 'Modifier',
        delete: 'Supprimer',
        save: 'Enregistrer',
        cancel: 'Annuler',
    },
    batches: {
        title: 'Gestion des lots',
        create: 'Créer un lot',
        species: 'Espèce',
        quantity: 'Quantité',
        // ...
    },
}
```

**Using Translations in Components:**

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('common.dashboard')}</h1>
      <Button>{t('common.add')}</Button>
    </div>
  )
}
```

**Pluralization Pattern:**

```typescript
// Translation
{
  items: '{{count}} élément',
  items_plural: '{{count}} éléments'
}

// Usage
t('items', { count: 1 })  // "1 élément"
t('items', { count: 5 })  // "5 éléments"
```

---

## IMPLEMENTATION PLAN

### Phase 1: Translation Infrastructure

Expand i18n configuration:

- Add French, Portuguese, Swahili to resources
- Organize translations by namespace
- Add pluralization rules
- Configure fallback behavior

### Phase 2: French Translations

Complete French translations:

- All UI text (navigation, buttons, labels)
- All error messages
- All validation messages
- All dialog text
- Documentation (README, DEPLOYMENT)

### Phase 3: Portuguese Translations

Complete Portuguese translations:

- Same scope as French
- Focus on Brazilian Portuguese (more widely understood)
- Documentation translations

### Phase 4: Swahili Translations

Complete Swahili translations:

- Same scope as French/Portuguese
- Documentation translations

### Phase 5: UI Integration

Update all components to use translations:

- Replace hardcoded strings with t() calls
- Add language switcher component
- Update navigation
- Update dialogs

### Phase 6: Validation & Testing

Validate translations:

- Check for missing keys
- Test language switching
- Verify pluralization
- Review with native speakers

---

## STEP-BY-STEP TASKS

### Task 1: CREATE app/features/i18n/locales/fr.ts

- **IMPLEMENT**: Complete French translations
- **NAMESPACES**: common, batches, sales, expenses, feed, mortality, settings, auth, errors
- **KEYS**: ~500 translation keys covering entire UI
- **PATTERN**: Organize by feature/namespace
- **VALIDATE**: `bun run type-check app/features/i18n/locales/fr.ts`

### Task 2: CREATE app/features/i18n/locales/pt.ts

- **IMPLEMENT**: Complete Portuguese translations
- **VARIANT**: Brazilian Portuguese (pt-BR)
- **NAMESPACES**: Same as French
- **KEYS**: ~500 translation keys
- **VALIDATE**: `bun run type-check app/features/i18n/locales/pt.ts`

### Task 3: CREATE app/features/i18n/locales/sw.ts

- **IMPLEMENT**: Complete Swahili translations
- **NAMESPACES**: Same as French/Portuguese
- **KEYS**: ~500 translation keys
- **VALIDATE**: `bun run type-check app/features/i18n/locales/sw.ts`

### Task 4: CREATE app/features/i18n/locales/index.ts

- **IMPLEMENT**: Export all locales
- **EXPORTS**: en, fr, pt, sw
- **PATTERN**: Re-export from locale files
- **VALIDATE**: `bun run type-check app/features/i18n/locales/index.ts`

### Task 5: UPDATE app/features/i18n/config.ts

- **IMPLEMENT**: Add French, Portuguese, Swahili to resources
- **IMPORTS**: Import from locales/index.ts
- **RESOURCES**: Add fr, pt, sw to resources object
- **VALIDATE**: `bun run type-check app/features/i18n/config.ts`

### Task 6: CREATE app/components/language-switcher.tsx

- **IMPLEMENT**: Language selector dropdown component
- **OPTIONS**: English, Français, Português, Kiswahili
- **BEHAVIOR**: Updates user settings on change
- **PATTERN**: Similar to currency selector
- **VALIDATE**: `bun run type-check app/components/language-switcher.tsx`

### Task 7: UPDATE app/components/navigation.tsx

- **IMPLEMENT**: Replace hardcoded strings with t() calls
- **KEYS**: Use common.dashboard, common.batches, etc.
- **PATTERN**: const { t } = useTranslation()
- **VALIDATE**: Test language switching in UI

### Task 8: UPDATE app/components/dialogs/batch-dialog.tsx

- **IMPLEMENT**: Replace hardcoded strings with t() calls
- **NAMESPACE**: batches
- **KEYS**: batches.create, batches.species, batches.quantity, etc.
- **VALIDATE**: Test dialog in all languages

### Task 9: UPDATE app/routes/\_auth/settings/index.tsx

- **IMPLEMENT**: Add language switcher to settings page
- **LOCATION**: Regional tab (with currency, date, units)
- **COMPONENT**: Use LanguageSwitcher component
- **VALIDATE**: Test language switching persists

### Task 10: CREATE scripts/validate-translations.ts

- **IMPLEMENT**: Script to validate all translations
- **CHECKS**:
    - All keys present in all languages
    - No missing translations
    - No extra keys
    - Pluralization rules correct
- **OUTPUT**: Report of missing/extra keys
- **VALIDATE**: `bun run scripts/validate-translations.ts`

### Task 11: CREATE docs/i18n/README.fr.md

- **IMPLEMENT**: French translation of README
- **SECTIONS**: All sections from English README
- **QUALITY**: Native-level French
- **VALIDATE**: Review with French speaker

### Task 12: CREATE docs/i18n/README.pt.md

- **IMPLEMENT**: Portuguese translation of README
- **VARIANT**: Brazilian Portuguese
- **SECTIONS**: All sections from English README
- **VALIDATE**: Review with Portuguese speaker

### Task 13: CREATE docs/i18n/README.sw.md

- **IMPLEMENT**: Swahili translation of README
- **SECTIONS**: All sections from English README
- **VALIDATE**: Review with Swahili speaker

### Task 14: CREATE docs/i18n/DEPLOYMENT.fr.md

- **IMPLEMENT**: French translation of DEPLOYMENT guide
- **SECTIONS**: All sections from English guide
- **VALIDATE**: Review with French speaker

### Task 15: CREATE docs/i18n/DEPLOYMENT.pt.md

- **IMPLEMENT**: Portuguese translation of DEPLOYMENT guide
- **SECTIONS**: All sections from English guide
- **VALIDATE**: Review with Portuguese speaker

### Task 16: CREATE docs/i18n/DEPLOYMENT.sw.md

- **IMPLEMENT**: Swahili translation of DEPLOYMENT guide
- **SECTIONS**: All sections from English guide
- **VALIDATE**: Review with Swahili speaker

### Task 17: UPDATE docs/INDEX.md

- **IMPLEMENT**: Add links to translated documentation
- **SECTION**: Add "Translations" section
- **LINKS**: Link to all translated docs
- **VALIDATE**: `grep "Translations" docs/INDEX.md`

### Task 18: UPDATE README.md

- **IMPLEMENT**: Add language badges and links
- **BADGES**: 🇬🇧 English | 🇫🇷 Français | 🇵🇹 Português | 🇰🇪 Kiswahili
- **LINKS**: Link to docs/i18n/ translations
- **VALIDATE**: `grep "Français" README.md`

---

## TESTING STRATEGY

### Translation Validation

**Automated Checks:**

```bash
bun run scripts/validate-translations.ts
```

**Manual Review:**

1. Switch to each language in UI
2. Navigate through all pages
3. Check all dialogs and forms
4. Verify error messages
5. Test pluralization

### Native Speaker Review

**French:**

- Review by native French speaker from West/Central Africa
- Check for regional variations
- Verify technical terms

**Portuguese:**

- Review by native Portuguese speaker from Angola/Mozambique
- Check for regional variations
- Verify technical terms

**Swahili:**

- Review by native Swahili speaker from East Africa
- Check for regional variations
- Verify technical terms

### Edge Cases

- Long translations (UI overflow)
- RTL languages (future: Arabic)
- Special characters (accents, diacritics)
- Pluralization edge cases (0, 1, 2+)

---

## VALIDATION COMMANDS

### Level 1: TypeScript Validation

```bash
bun run check
```

### Level 2: Translation Validation

```bash
bun run scripts/validate-translations.ts
```

### Level 3: Build Validation

```bash
bun run build
```

### Level 4: Manual Testing

```bash
bun dev
# Test language switching in UI
# Navigate through all pages
# Check all dialogs
```

### Level 5: Native Speaker Review

```bash
# Send to native speakers for review
# Collect feedback
# Iterate on translations
```

---

## ACCEPTANCE CRITERIA

- [x] French translations complete (~500 keys)
- [x] Portuguese translations complete (~500 keys)
- [x] Swahili translations complete (~500 keys)
- [x] All UI components use t() calls
- [x] Language switcher component added
- [x] Language switching persists to user settings
- [x] No missing translation keys
- [x] Pluralization works correctly
- [x] README translated to all 3 languages
- [x] DEPLOYMENT guide translated to all 3 languages
- [x] Validation script passes
- [x] Native speaker review completed
- [x] No UI overflow issues

---

## COMPLETION CHECKLIST

- [ ] Task 1: French translations created
- [ ] Task 2: Portuguese translations created
- [ ] Task 3: Swahili translations created
- [ ] Task 4: Locales index created
- [ ] Task 5: i18n config updated
- [ ] Task 6: Language switcher component created
- [ ] Task 7: Navigation updated
- [ ] Task 8: Batch dialog updated
- [ ] Task 9: Settings page updated
- [ ] Task 10: Validation script created
- [ ] Task 11: French README created
- [ ] Task 12: Portuguese README created
- [ ] Task 13: Swahili README created
- [ ] Task 14: French DEPLOYMENT created
- [ ] Task 15: Portuguese DEPLOYMENT created
- [ ] Task 16: Swahili DEPLOYMENT created
- [ ] Task 17: INDEX.md updated
- [ ] Task 18: README.md updated
- [ ] All translations validated
- [ ] Native speaker review completed
- [ ] Language switching works

---

## NOTES

### Language Selection Rationale

**French** - 26 African countries, 120M+ speakers

- Senegal, Côte d'Ivoire, Cameroon, DRC, Mali, Burkina Faso, Niger, Chad, Guinea, Benin, Togo, Rwanda, Burundi, etc.

**Portuguese** - 5 African countries, 30M+ speakers

- Angola, Mozambique, Guinea-Bissau, Cape Verde, São Tomé and Príncipe

**Swahili** - 4 African countries, 100M+ speakers

- Kenya, Tanzania, Uganda, DRC (eastern regions)
- Lingua franca of East Africa

### Translation Quality Guidelines

1. **Use simple, clear language** - Farmers may have limited literacy
2. **Avoid technical jargon** - Use common terms
3. **Be consistent** - Same term for same concept
4. **Consider regional variations** - Test with speakers from different countries
5. **Respect cultural context** - Adapt examples to local context

### Design Decisions

- **Brazilian Portuguese** - More widely understood than European Portuguese in Africa
- **Standard Swahili** - Based on Tanzanian/Kenyan standard
- **Namespace organization** - Easier to manage translations by feature
- **Fallback to English** - If translation missing, show English

### Translation Workflow

1. **Extract strings** - Identify all hardcoded strings
2. **Create keys** - Organize by namespace
3. **Translate** - Work with native speakers
4. **Review** - Native speaker review
5. **Test** - Manual testing in UI
6. **Iterate** - Refine based on feedback

### Estimated Time

- French translations: ~3 hours
- Portuguese translations: ~3 hours
- Swahili translations: ~3 hours
- UI integration: ~1 hour
- Documentation translations: ~2 hours (per language = 6 hours)
- Validation & testing: ~1 hour
- Native speaker review: ~2 hours (per language = 6 hours)
- **Total**: ~25 hours (with native speaker collaboration)

### Confidence Score

**6/10** - High complexity due to:

1. Requires native speakers for accurate translations
2. Large volume of text to translate (~500 keys × 3 languages)
3. Cultural adaptation needed
4. Quality review time-consuming
5. Potential for errors in technical terms

### Future Enhancements

- Add Arabic (North Africa, Sudan)
- Add Hausa (Nigeria, Niger, Chad)
- Add Yoruba (Nigeria, Benin)
- Add Igbo (Nigeria)
- Add Amharic (Ethiopia)
- Add context-aware translations (formal vs informal)
- Add voice input for low-literacy users
