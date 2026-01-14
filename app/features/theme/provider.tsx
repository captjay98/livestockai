import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePreferences } from '~/features/settings'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = usePreferences()

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return <>{children}</>
}
