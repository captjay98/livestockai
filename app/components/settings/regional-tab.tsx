import { useTranslation } from 'react-i18next'
import {
  Calendar,
  DollarSign,
  Loader2,
  RotateCcw,
  Ruler,
  Save,
} from 'lucide-react'
import type { UserSettings } from '~/features/settings'
import { Card } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { CURRENCY_PRESETS } from '~/features/settings'
import { formatCurrency } from '~/features/settings/currency-formatter'
import { formatDate, formatTime } from '~/features/settings/date-formatter'

interface RegionalTabProps {
  settings: UserSettings
  onSettingsChange: (updates: Partial<UserSettings>) => void
  onSave: (updates: Partial<UserSettings>) => Promise<void>
  onReset: (section: 'currency' | 'datetime' | 'units') => void
  isSaving: boolean
}

export function RegionalTab({
  settings,
  onSettingsChange,
  onSave,
  onReset,
  isSaving,
}: RegionalTabProps) {
  const { t } = useTranslation(['settings', 'common'])
  const previewAmount = 1234567.89
  const previewDate = new Date()

  return (
    <Card className="p-4 sm:p-6 space-y-8 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('regional.title')}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onReset('currency')
            onReset('datetime')
            onReset('units')
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('regional.reset')}
        </Button>
      </div>

      {/* Currency Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">{t('regional.currency.title')}</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('regional.currency.label')}</Label>
            <Select
              value={settings.currencyCode}
              onValueChange={(code) => {
                const preset = CURRENCY_PRESETS.find((p) => p.code === code)
                if (preset) {
                  onSettingsChange({
                    currencyCode: preset.code,
                    currencySymbol: preset.symbol,
                    currencyDecimals: preset.decimals,
                    currencySymbolPosition: preset.symbolPosition,
                    thousandSeparator: preset.thousandSeparator,
                    decimalSeparator: preset.decimalSeparator,
                  })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_PRESETS.map((preset) => (
                  <SelectItem key={preset.code} value={preset.code}>
                    {preset.symbol} {preset.code} - {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pt-2 border-t">
          <Label className="text-muted-foreground">
            {t('common:preview', { defaultValue: 'Preview' })}
          </Label>
          <p className="text-2xl font-semibold mt-2">
            {formatCurrency(previewAmount, settings)}
          </p>
        </div>
      </div>

      {/* Date & Time Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">
            {t('settings:regional.dateTime.title')}
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('settings:regional.dateTime.dateFormat')}</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(v) => {
                if (v) {
                  onSettingsChange({ dateFormat: v })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('settings:regional.dateTime.timeFormat')}</Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(v) => {
                if (v) {
                  onSettingsChange({ timeFormat: v })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">
                  {t('settings:regional.dateTime.h12', {
                    defaultValue: '12-hour (2:30 PM)',
                  })}
                </SelectItem>
                <SelectItem value="24h">
                  {t('settings:regional.dateTime.h24', {
                    defaultValue: '24-hour (14:30)',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('settings:regional.dateTime.firstDay')}</Label>
            <Select
              value={String(settings.firstDayOfWeek)}
              onValueChange={(v) =>
                onSettingsChange({
                  firstDayOfWeek: parseInt(v || '0'),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">
                  {t('settings:regional.dateTime.days.sunday')}
                </SelectItem>
                <SelectItem value="1">
                  {t('settings:regional.dateTime.days.monday')}
                </SelectItem>
                <SelectItem value="6">
                  {t('settings:regional.dateTime.days.saturday')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pt-2 border-t">
          <Label className="text-muted-foreground">
            {t('common:preview', { defaultValue: 'Preview' })}
          </Label>
          <div className="mt-2 space-y-1">
            <p className="text-lg font-semibold">
              {formatDate(previewDate, settings)}
            </p>
            <p className="text-muted-foreground">
              {formatTime(previewDate, settings)}
            </p>
          </div>
        </div>
      </div>

      {/* Units Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">{t('settings:regional.units.title')}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('settings:regional.units.weight')}</Label>
            <Select
              value={settings.weightUnit}
              onValueChange={(v) => {
                if (v) {
                  onSettingsChange({ weightUnit: v })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">
                  {t('common:units.kgLong', {
                    defaultValue: 'Kilograms (kg)',
                  })}
                </SelectItem>
                <SelectItem value="lbs">
                  {t('common:units.lbsLong', {
                    defaultValue: 'Pounds (lbs)',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('regional.units.area')}</Label>
            <Select
              value={settings.areaUnit}
              onValueChange={(v) => {
                if (v) {
                  onSettingsChange({ areaUnit: v })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sqm">
                  {t('common:units.sqmLong', {
                    defaultValue: 'Square Meters (m²)',
                  })}
                </SelectItem>
                <SelectItem value="sqft">
                  {t('common:units.sqftLong', {
                    defaultValue: 'Square Feet (ft²)',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('regional.units.temperature')}</Label>
            <Select
              value={settings.temperatureUnit}
              onValueChange={(v) => {
                if (v) {
                  onSettingsChange({ temperatureUnit: v })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celsius">
                  {t('common:units.celsius', {
                    defaultValue: 'Celsius (°C)',
                  })}
                </SelectItem>
                <SelectItem value="fahrenheit">
                  {t('common:units.fahrenheit', {
                    defaultValue: 'Fahrenheit (°F)',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={() =>
            onSave({
              currencyCode: settings.currencyCode,
              currencySymbol: settings.currencySymbol,
              currencyDecimals: settings.currencyDecimals,
              currencySymbolPosition: settings.currencySymbolPosition,
              thousandSeparator: settings.thousandSeparator,
              decimalSeparator: settings.decimalSeparator,
              dateFormat: settings.dateFormat,
              timeFormat: settings.timeFormat,
              firstDayOfWeek: settings.firstDayOfWeek,
              weightUnit: settings.weightUnit,
              areaUnit: settings.areaUnit,
              temperatureUnit: settings.temperatureUnit,
            })
          }
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('common:save')}
        </Button>
      </div>
    </Card>
  )
}
