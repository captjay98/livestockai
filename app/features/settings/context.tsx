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
import { toast } from 'sonner'
import { DEFAULT_SETTINGS } from './currency-presets'
import { getUserSettingsFn, updateUserSettingsFn } from './server'
import type { ReactNode } from 'react'
import type { UserSettings } from './currency-presets'

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
  const [settings, setSettings] = useState<UserSettings>(
    initialSettings ?? DEFAULT_SETTINGS,
  )
  const [isLoading, setIsLoading] = useState(!initialSettings)
  const [error, setError] = useState<string | null>(null)

  // Load settings on mount if not provided
  useEffect(() => {
    if (initialSettings) return

    async function loadSettings() {
      try {
        setIsLoading(true)
        setError(null)
        const loadedSettings = await getUserSettingsFn({ data: {} })
        setSettings(loadedSettings)
      } catch (err) {
        setError('Failed to load settings')
        toast.error('Failed to load settings')
        // Keep default settings on error
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [initialSettings])

  // Update settings with optimistic update
  const handleUpdateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      const previousSettings = settings
      const mergedSettings = { ...settings, ...newSettings }

      // Optimistic update
      setSettings(mergedSettings)
      setError(null)

      try {
        await updateUserSettingsFn({ data: newSettings })
      } catch (err) {
        // If unauthorized (e.g. login page), don't rollback - keep local state
        const errString = String(err).toLowerCase()
        const msg = err instanceof Error ? err.message.toLowerCase() : ''

        if (
          errString.includes('unauthorized') ||
          errString.includes('access denied') ||
          errString.includes('401') ||
          errString.includes('403') ||
          msg.includes('unauthorized') ||
          msg.includes('access denied') ||
          (err &&
            typeof err === 'object' &&
            'status' in err &&
            (err.status === 401 || err.status === 403)) ||
          (err &&
            typeof err === 'object' &&
            'statusCode' in err &&
            (err.statusCode === 401 || err.statusCode === 403))
        ) {
          // Keep local state for unauthorized errors
          return
        }

        // Rollback on other errors
        setSettings(previousSettings)
        setError('Failed to save settings')
        toast.error('Failed to save settings')
        throw err
      }
    },
    [settings],
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
