import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { LANGUAGE_STORAGE_KEY } from './config'
import { loadLanguage } from './lazy-loader'
import type { ReactNode } from 'react'
import { usePreferences } from '~/features/settings'

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language: settingsLanguage } = usePreferences()
  // Track language in state to trigger re-renders
  const [, setLang] = useState(i18n.language)

  useEffect(() => {
    // Listen for language changes and update state to trigger re-render
    const handleLanguageChanged = (lng: string) => {
      setLang(lng)
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  useEffect(() => {
    const syncLanguage = async () => {
      // Priority: localStorage > server settings > default ('en')
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      const targetLang = savedLang || settingsLanguage

      // Sync i18n if different from current
      if (i18n.language !== targetLang) {
        // Lazy load language if needed
        await loadLanguage(targetLang)
        await i18n.changeLanguage(targetLang)
      }

      // Only sync back to localStorage if settingsLanguage is DIFFERENT from default
      if (settingsLanguage !== 'en' && settingsLanguage !== savedLang) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, settingsLanguage)
      }
    }

    syncLanguage().catch((error) => {
      console.error('Failed to sync language:', error)
    })
  }, [settingsLanguage])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
