import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePreferences } from '~/features/settings'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = usePreferences()

  useEffect(() => {
    const root = document.documentElement
    const currentTheme = root.classList.contains('dark') ? 'dark' : 'light'
    const targetTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    // Skip if inline script already set the correct theme
    if (currentTheme === targetTheme) return

    root.classList.remove('light', 'dark')
    root.classList.add(targetTheme)
  }, [theme])

  return <>{children}</>
}
