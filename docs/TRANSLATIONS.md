# Translations

OpenLivestock Manager supports multiple languages to serve a global user base. The internationalization (i18n) system is built using `i18next` and `react-i18next`.

## Supported Languages

| Code | Language  | Flag | Status        |
| ---- | --------- | ---- | ------------- |
| en   | English   | 🇺🇸   | Base language |
| fr   | Français  | 🇫🇷   | Complete      |
| pt   | Português | 🇧🇷   | Complete      |
| sw   | Kiswahili | 🇰🇪   | Complete      |
| es   | Español   | 🇪🇸   | Complete      |
| tr   | Türkçe    | 🇹🇷   | Complete      |
| hi   | हिन्दी    | 🇮🇳   | Complete      |

## Implementation Details

- **Framework**: [i18next](https://www.i18next.com/)
- **React Integration**: [react-i18next](https://react.i18next.com/)
- **Configuration**: `app/features/i18n/config.ts`
- **Locale Files**: `app/features/i18n/locales/`
- **Provider**: `app/features/i18n/provider.tsx`

## File Structure

```
app/features/i18n/
├── config.ts          # i18next configuration
├── provider.tsx       # React provider (syncs with user settings)
├── index.ts           # Public exports
└── locales/
    ├── index.ts       # Exports all locales
    ├── en.ts          # English (623 keys)
    ├── fr.ts          # French
    ├── pt.ts          # Portuguese
    ├── sw.ts          # Swahili
    ├── es.ts          # Spanish
    ├── tr.ts          # Turkish
    └── hi.ts          # Hindi
```

## Language Switcher

Users can change their preferred language via:

1. The globe icon in the navigation header
2. Settings → Regional → Language

Language changes are persisted to the user's settings and applied immediately.

## Adding New Translations

1. Create a new locale file in `app/features/i18n/locales/` (e.g., `de.ts`)
2. Copy the structure from `en.ts` and translate all keys
3. Export from `app/features/i18n/locales/index.ts`
4. Add to resources in `app/features/i18n/config.ts`
5. Add to `LANGUAGES` array in `app/components/ui/language-switcher.tsx`
6. Run validation: `bun run scripts/validate-translations.ts`

## Validation

Run the translation validation script to check for missing keys:

```bash
bun run scripts/validate-translations.ts
```

## Translated Documentation

Documentation is available in multiple languages:

- [README (Français)](i18n/README.fr.md)
- [README (Português)](i18n/README.pt.md)
- [README (Kiswahili)](i18n/README.sw.md)
- [README (Español)](i18n/README.es.md)
- [README (Türkçe)](i18n/README.tr.md)
- [README (हिन्दी)](i18n/README.hi.md)
- [Deployment Guide (all languages)](i18n/)
