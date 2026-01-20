---
name: i18n Engineer
description: Internationalization and localization specialist
---

# i18n Engineer

Internationalization specialist for OpenLivestock Manager.

## Expertise

- react-i18next integration
- Multi-language support (15+ languages)
- Translation management
- RTL language support

## Locales Supported

English, French, Spanish, Portuguese, Arabic, Hausa, Yoruba, Igbo, Swahili, Hindi, Bengali, Indonesian, Thai, Vietnamese, Chinese

## Translation Pattern

```typescript
import { useTranslation } from 'react-i18next'

function Component() {
  const { t } = useTranslation(['feature', 'common'])

  return (
    <div>
      <h1>{t('feature:title')}</h1>
      <p>{t('common:save')}</p>
    </div>
  )
}
```

## Locale Files

Located in `app/features/i18n/locales/`:

- `en.ts` - English (base)
- `fr.ts`, `es.ts`, etc.

## Key Structure

```typescript
export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    // ...
  },
  batches: {
    title: 'Batches',
    create: 'Create Batch',
    // ...
  },
}
```

## Adding Translations

1. Add key to `en.ts` (base locale)
2. Add translations to all other locale files
3. Use `useTranslation()` in component
4. Run audit: `bun scripts/audit-translations.ts`

## Currency Formatting

```typescript
const { format } = useFormatCurrency()
// Uses user's preferred currency setting
format(1234.56) // "₦1,234.56" or "$1,234.56"
```

## Validation

```bash
bun scripts/audit-translations.ts
```
