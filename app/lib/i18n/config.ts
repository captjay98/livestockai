import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales'

// Storage key for language preference
export const LANGUAGE_STORAGE_KEY = 'app-language'

// Read saved language from localStorage (client-side only)
const getSavedLanguage = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LANGUAGE_STORAGE_KEY)
}

// Only load English initially (fallback language)
// Other languages will be loaded on demand via lazy-loader.ts
const resources = {
  en,
}

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
    'sensors',
    'extension',
    'workers',
    'credit-passport',
  ],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  // React-specific options for proper re-rendering on language change
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
  },
})

export default i18n
