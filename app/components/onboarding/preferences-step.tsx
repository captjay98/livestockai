import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Settings } from 'lucide-react'
import type { UserSettings } from '~/features/settings'
import { useOnboarding } from '~/features/onboarding/context'
import {
  CURRENCY_PRESETS,
  getCurrencyPreset,
  useSettings,
} from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
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
      await updateSettings({ ...settings, ...localSettings } as UserSettings)
    } catch {
      /* continue */
    }
    setIsSaving(false)
    completeStep('preferences')
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('preferences.title', { defaultValue: 'Your Preferences' })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('preferences.desc', {
            defaultValue: 'Set your currency and units.',
          })}
        </p>
      </div>
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>
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
                    setLocalSettings((s) => ({ ...s, currencyCode: p.code }))
                }
              }}
            >
              <SelectTrigger>
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
            <Label>
              {t('settings:regional.units.weight', {
                defaultValue: 'Weight Unit',
              })}
            </Label>
            <Select
              value={localSettings.weightUnit}
              onValueChange={(v) =>
                v && setLocalSettings((s) => ({ ...s, weightUnit: v }))
              }
            >
              <SelectTrigger>
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
            <Label>
              {t('settings:regional.dateTime.dateFormat', {
                defaultValue: 'Date Format',
              })}
            </Label>
            <Select
              value={localSettings.dateFormat}
              onValueChange={(v) =>
                v && setLocalSettings((s) => ({ ...s, dateFormat: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={skipStep}>
          {t('common:skip', { defaultValue: 'Skip' })}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving
            ? t('common:saving', { defaultValue: 'Saving...' })
            : t('preferences.submit', { defaultValue: 'Save & Continue' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
