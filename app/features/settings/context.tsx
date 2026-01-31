/**
 * Settings Context
 *
 * Provides user settings throughout the application via React Context.
 * Settings are loaded on mount and can be updated optimistically.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DEFAULT_SETTINGS } from './currency-presets'
import { getUserSettingsFn, updateUserSettingsFn } from './server'
import type { ReactNode } from 'react'
import type { UserSettings } from './currency-presets'
import { AppError } from '~/lib/errors/app-error'
import { LANGUAGE_STORAGE_KEY } from '~/lib/i18n/config'

interface SettingsContextValue {
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>
  isLoading: boolean
  error: string | null
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

interface SettingsProviderProps {
  children: ReactNode
  initialSettings?: UserSettings
}

// Public paths that don't require settings to be loaded
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/extension-workers',
  '/changelog',
  '/community',
  '/docs',
  '/features',
  '/pricing',
  '/roadmap',
  '/support',
  '/marketplace',
]

/**
 * Settings Provider Component
 *
 * Wraps the application to provide settings context.
 * Loads settings on mount and provides update functionality.
 */
export function SettingsProvider({
  children,
  initialSettings,
}: SettingsProviderProps) {
  const { t } = useTranslation(['errors'])
  const [settings, setSettings] = useState<UserSettings>(() => {
    const base = initialSettings ?? DEFAULT_SETTINGS
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (savedLang) {
        return { ...base, language: savedLang as UserSettings['language'] }
      }
    }
    return base
  })
  const [isLoading, setIsLoading] = useState(!initialSettings)
  const [error, setError] = useState<string | null>(null)

  // Use TanStack Router's location hook for SSR-safe path detection
  const location = useLocation()
  const pathname = location.pathname

  // Load settings on mount if not provided
  useEffect(() => {
    if (initialSettings) return

    // Skip loading settings on public pages (landing, login, signup, etc.)
    // This prevents unnecessary server calls and potential timeouts
    const isPublicPage =
      PUBLIC_PATHS.includes(pathname) ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/verify/')

    if (isPublicPage) {
      setIsLoading(false)
      return
    }

    async function loadSettings() {
      try {
        setIsLoading(true)
        setError(null)

        // Check if online before fetching
        if (!navigator.onLine) {
          console.log('[SettingsProvider] Offline - using default settings')
          setSettings(DEFAULT_SETTINGS)
          setIsLoading(false)
          return
        }

        const loadedSettings = await getUserSettingsFn({ data: {} })
        setSettings(loadedSettings)
      } catch (err) {
        // Log the actual error for debugging
        // Check for auth error before logging
        const errString = String(err).toLowerCase()
        const errMessage = err instanceof Error ? err.message.toLowerCase() : ''
        const isAuthError =
          (AppError.isAppError(err) &&
            (err.reason === 'UNAUTHORIZED' ||
              err.httpStatus === 401 ||
              err.httpStatus === 403)) ||
          errString.includes('unauthorized') ||
          errString.includes('unauthenticated') ||
          errString.includes('access denied') ||
          errString.includes('401') ||
          errString.includes('403') ||
          errString.includes('not authenticated') ||
          errString.includes('no session') ||
          errString.includes('session') ||
          errMessage.includes('unauthorized') ||
          errMessage.includes('unauthenticated')

        // Check for network error
        const isNetworkError =
          errString.includes('network') ||
          errString.includes('fetch') ||
          errMessage.includes('network') ||
          errMessage.includes('fetch')

        if (!isAuthError && !isNetworkError) {
          console.error('[SettingsProvider] Error loading settings:', err)
          setError('Failed to load settings')
          toast.error(
            t('errors:saveFailed', { defaultValue: 'Failed to load settings' }),
          )
        } else if (isNetworkError) {
          console.log(
            '[SettingsProvider] Network error - using default settings',
          )
        }
        // Keep default settings on error
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [initialSettings, pathname])

  // Update settings with optimistic update
  const handleUpdateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      const previousSettings = settings
      const mergedSettings = { ...settings, ...newSettings }

      // Optimistic update
      setSettings(mergedSettings)
      setError(null)

      // Skip server sync on public pages - just keep local state
      const isPublicPage =
        PUBLIC_PATHS.includes(pathname) ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/verify/')

      if (isPublicPage) {
        return
      }

      try {
        await updateUserSettingsFn({ data: newSettings })
      } catch (err) {
        // If unauthorized (e.g. login page), don't rollback - keep local state
        const errString = String(err).toLowerCase()
        const msg = err instanceof Error ? err.message.toLowerCase() : ''

        // Check for any auth-related error patterns
        const isAuthError =
          (AppError.isAppError(err) &&
            (err.reason === 'UNAUTHORIZED' ||
              err.httpStatus === 401 ||
              err.httpStatus === 403)) ||
          errString.includes('unauthorized') ||
          errString.includes('unauthenticated') ||
          errString.includes('access denied') ||
          errString.includes('401') ||
          errString.includes('403') ||
          errString.includes('not authenticated') ||
          errString.includes('no session') ||
          errString.includes('session') ||
          msg.includes('unauthorized') ||
          msg.includes('unauthenticated') ||
          msg.includes('access denied') ||
          msg.includes('not authenticated') ||
          msg.includes('no session')

        if (isAuthError) {
          // Keep local state for unauthorized errors - don't show toast
          return
        }

        // Rollback on other errors
        setSettings(previousSettings)
        setError('Failed to save settings')
        toast.error(
          t('errors:saveFailed', { defaultValue: 'Failed to save settings' }),
        )
        throw err
      }
    },
    [settings, pathname],
  )

  const value: SettingsContextValue = {
    settings,
    updateSettings: handleUpdateSettings,
    isLoading,
    error,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook to access settings context
 *
 * @throws Error if used outside of SettingsProvider
 */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

/**
 * Hook to access just the settings object
 * Useful when you only need to read settings
 */
export function useSettingsValue(): UserSettings {
  const { settings } = useSettings()
  return settings
}
