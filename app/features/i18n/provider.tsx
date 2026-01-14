import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './config'
import type { ReactNode } from 'react'
import { usePreferences } from '~/features/settings'

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = usePreferences()

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
