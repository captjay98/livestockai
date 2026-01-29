import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { updateUserSettingsFn } from './server'
import { DEFAULT_SETTINGS } from './index'
import type { UserSettings } from '~/features/settings/currency-presets'

export function useSettingsTabs(
  initialSettings: UserSettings = DEFAULT_SETTINGS,
) {
  const { t } = useTranslation(['settings'])
  const [localSettings, setLocalSettings] =
    useState<UserSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const saveSettings = async (partialSettings: Partial<UserSettings>) => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateUserSettingsFn({ data: partialSettings })
      setSaveSuccess(true)
      toast.success(t('saved'))
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError(t('saveError'))
      toast.error(t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = (section: 'currency' | 'datetime' | 'units') => {
    setLocalSettings((prev) => {
      switch (section) {
        case 'currency':
          return {
            ...prev,
            currencyCode: DEFAULT_SETTINGS.currencyCode,
            currencySymbol: DEFAULT_SETTINGS.currencySymbol,
            currencyDecimals: DEFAULT_SETTINGS.currencyDecimals,
            currencySymbolPosition: DEFAULT_SETTINGS.currencySymbolPosition,
            thousandSeparator: DEFAULT_SETTINGS.thousandSeparator,
            decimalSeparator: DEFAULT_SETTINGS.decimalSeparator,
          }
        case 'datetime':
          return {
            ...prev,
            dateFormat: DEFAULT_SETTINGS.dateFormat,
            timeFormat: DEFAULT_SETTINGS.timeFormat,
            firstDayOfWeek: DEFAULT_SETTINGS.firstDayOfWeek,
          }
        case 'units':
          return {
            ...prev,
            weightUnit: DEFAULT_SETTINGS.weightUnit,
            areaUnit: DEFAULT_SETTINGS.areaUnit,
            temperatureUnit: DEFAULT_SETTINGS.temperatureUnit,
          }
      }
    })
  }

  const updateLocalSettings = (updates: Partial<UserSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }))
  }

  return {
    localSettings,
    saveError,
    saveSuccess,
    isSaving,
    saveSettings,
    handleReset,
    updateLocalSettings,
  }
}
