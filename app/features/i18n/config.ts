import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
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

// Storage key for language preference
export const LANGUAGE_STORAGE_KEY = 'app-language'

// Read saved language from localStorage (client-side only)
const getSavedLanguage = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LANGUAGE_STORAGE_KEY)
}

// English translations (baseline)
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
  ],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
