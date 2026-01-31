import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { UserSettings } from '~/features/settings'
import { useOnboarding } from '~/features/onboarding/context'
import {
  CURRENCY_PRESETS,
  getCurrencyPreset,
  useSettings,
} from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export function PreferencesStep() {
  const { t } = useTranslation(['onboarding', 'common', 'settings'])
  const { completeStep, skipStep } = useOnboarding()
  const { settings, updateSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>({
    currencyCode: settings.currencyCode,
    weightUnit: settings.weightUnit,
    dateFormat: settings.dateFormat,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update settings first
      await updateSettings({
        ...settings,
        ...localSettings,
      } as UserSettings)

      // Wait a bit for settings to persist
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Then complete the step
      completeStep('preferences')
      setIsSaving(false)
    } catch (error) {
      setIsSaving(false)
      toast.error(
        t('common:saveFailed', {
          defaultValue: 'Failed to save preferences. Please try again.',
        }),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
          <Settings className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t('preferences.title', {
            defaultValue: 'Your Preferences',
          })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('preferences.desc', {
            defaultValue: 'Set your currency and units.',
          })}
        </p>
      </div>

      <div className="max-w-md mx-auto border-white/10 bg-white/20 dark:bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden glass-card rounded-[2rem]">
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {t('settings:regional.currency.title', {
                defaultValue: 'Currency',
              })}
            </Label>
            <Select
              value={localSettings.currencyCode}
              onValueChange={(v) => {
                if (v) {
                  const p = getCurrencyPreset(v)
                  if (p)
                    setLocalSettings((s) => ({
                      ...s,
                      currencyCode: p.code,
                    }))
                }
              }}
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_PRESETS.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.symbol} {p.code} - {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {t('settings:regional.units.weight', {
                defaultValue: 'Weight Unit',
              })}
            </Label>
            <Select
              value={localSettings.weightUnit}
              onValueChange={(v) =>
                v &&
                setLocalSettings((s) => ({
                  ...s,
                  weightUnit: v,
                }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">
                  {t('settings:regional.units.kg', {
                    defaultValue: 'Kilograms (kg)',
                  })}
                </SelectItem>
                <SelectItem value="lbs">
                  {t('settings:regional.units.lbs', {
                    defaultValue: 'Pounds (lbs)',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {t('settings:regional.dateTime.dateFormat', {
                defaultValue: 'Date Format',
              })}
            </Label>
            <Select
              value={localSettings.dateFormat}
              onValueChange={(v) =>
                v &&
                setLocalSettings((s) => ({
                  ...s,
                  dateFormat: v,
                }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button
          variant="ghost"
          onClick={skipStep}
          className="h-11 rounded-xl hover:bg-white/5"
          style={{ color: 'var(--text-landing-secondary)' }}
        >
          {t('common:skip', { defaultValue: 'Skip' })}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-bold tracking-wide px-8"
        >
          {isSaving
            ? t('common:saving', { defaultValue: 'Saving...' })
            : t('preferences.submit', {
                defaultValue: 'Save & Continue',
              })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
