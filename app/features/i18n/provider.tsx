import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { LANGUAGE_STORAGE_KEY } from './config'
import type { ReactNode } from 'react'
import { usePreferences } from '~/features/settings'

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language: settingsLanguage } = usePreferences()

  useEffect(() => {
    // Priority: localStorage > server settings > default ('en')
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    const targetLang = savedLang || settingsLanguage

    // Sync i18n if different from current
    if (i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang)
    }

    // If server has a language but localStorage doesn't, sync to localStorage
    // This ensures language persists even after logout
    if (!savedLang && settingsLanguage !== 'en') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, settingsLanguage)
    }
  }, [settingsLanguage])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
