/**
 * Settings Page
 *
 * User settings for currency, date/time, and units of measurement.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Boxes,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  PlayCircle,
  Plug,
  RotateCcw,
  Ruler,
  Save,
  Send,
  Settings,
  XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { UserSettings } from '~/features/settings'
import type { IntegrationStatus } from '~/features/integrations'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  CURRENCY_PRESETS,
  DEFAULT_SETTINGS,
  getCurrencyPreset,
  useSettings,
} from '~/features/settings'
import { formatCurrency } from '~/features/settings/currency-formatter'
import { formatDate, formatTime } from '~/features/settings/date-formatter'
import { useFarm } from '~/features/farms/context'
import { ModuleSelector } from '~/components/modules/selector'
import { LanguageSwitcher } from '~/components/ui/language-switcher'

export const Route = createFileRoute('/_auth/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation(['settings', 'common', 'inventory'])
  const { settings, updateSettings, isLoading, error } = useSettings()
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync local settings when context settings change
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const saveSettings = async (partialSettings: Partial<UserSettings>) => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateSettings(partialSettings)
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

  const handleCurrencyPresetChange = (code: string) => {
    const preset = getCurrencyPreset(code)
    if (preset) {
      setLocalSettings((prev) => ({
        ...prev,
        currencyCode: preset.code,
        currencySymbol: preset.symbol,
        currencyDecimals: preset.decimals,
        currencySymbolPosition: preset.symbolPosition,
        thousandSeparator: preset.thousandSeparator,
        decimalSeparator: preset.decimalSeparator,
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Preview values
  const previewAmount = 1234567.89
  const previewDate = new Date()

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {(error || saveError) && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error || saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-md">
          {t('saved')}
        </div>
      )}

      <Tabs defaultValue="regional" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="regional" className="gap-2">
            <DollarSign className="h-4 w-4" />
            {t('tabs.regional')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            {t('tabs.preferences')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Boxes className="h-4 w-4" />
            {t('tabs.business')}
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Layers className="h-4 w-4" />
            {t('tabs.modules')}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            {t('tabs.integrations')}
          </TabsTrigger>
        </TabsList>

        {/* Regional Tab - Combines Currency, Date/Time, Units */}
        <TabsContent value="regional">
          <Card className="p-6 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('regional.title')}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleReset('currency')
                  handleReset('datetime')
                  handleReset('units')
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
                    value={localSettings.currencyCode}
                    onValueChange={(code) => {
                      if (code) {
                        handleCurrencyPresetChange(code)
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
                  {t('common.preview', { defaultValue: 'Preview' })}
                </Label>
                <p className="text-2xl font-semibold mt-2">
                  {formatCurrency(previewAmount, localSettings)}
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
                    value={localSettings.dateFormat}
                    onValueChange={(v) => {
                      if (v) {
                        setLocalSettings((prev) => ({ ...prev, dateFormat: v }))
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">
                        MM/DD/YYYY (US)
                      </SelectItem>
                      <SelectItem value="DD/MM/YYYY">
                        DD/MM/YYYY (UK/EU)
                      </SelectItem>
                      <SelectItem value="YYYY-MM-DD">
                        YYYY-MM-DD (ISO)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings:regional.dateTime.timeFormat')}</Label>
                  <Select
                    value={localSettings.timeFormat}
                    onValueChange={(v) => {
                      if (v) {
                        setLocalSettings((prev) => ({ ...prev, timeFormat: v }))
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
                    value={String(localSettings.firstDayOfWeek)}
                    onValueChange={(v) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        firstDayOfWeek: parseInt(v || '0'),
                      }))
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
                    {formatDate(previewDate, localSettings)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatTime(previewDate, localSettings)}
                  </p>
                </div>
              </div>
            </div>

            {/* Units Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">
                  {t('settings:regional.units.title')}
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('settings:regional.units.weight')}</Label>
                  <Select
                    value={localSettings.weightUnit}
                    onValueChange={(v) => {
                      if (v) {
                        setLocalSettings((prev) => ({ ...prev, weightUnit: v }))
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
                    value={localSettings.areaUnit}
                    onValueChange={(v) => {
                      if (v) {
                        setLocalSettings((prev) => ({ ...prev, areaUnit: v }))
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
                    value={localSettings.temperatureUnit}
                    onValueChange={(v) => {
                      if (v) {
                        setLocalSettings((prev) => ({
                          ...prev,
                          temperatureUnit: v,
                        }))
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
                  saveSettings({
                    currencyCode: localSettings.currencyCode,
                    currencySymbol: localSettings.currencySymbol,
                    currencyDecimals: localSettings.currencyDecimals,
                    currencySymbolPosition:
                      localSettings.currencySymbolPosition,
                    thousandSeparator: localSettings.thousandSeparator,
                    decimalSeparator: localSettings.decimalSeparator,
                    dateFormat: localSettings.dateFormat,
                    timeFormat: localSettings.timeFormat,
                    firstDayOfWeek: localSettings.firstDayOfWeek,
                    weightUnit: localSettings.weightUnit,
                    areaUnit: localSettings.areaUnit,
                    temperatureUnit: localSettings.temperatureUnit,
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
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{t('title')}</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t('language')}</Label>
                <LanguageSwitcher />
                <p className="text-xs text-muted-foreground">
                  {t('languageDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">
                  {t('theme.label', { defaultValue: 'Theme' })}
                </Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value) =>
                    value &&
                    setLocalSettings((prev) => ({
                      ...prev,
                      theme: value as any,
                    }))
                  }
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      {t('theme.light', { defaultValue: 'Light' })}
                    </SelectItem>
                    <SelectItem value="dark">
                      {t('theme.dark', { defaultValue: 'Dark' })}
                    </SelectItem>
                    <SelectItem value="system">
                      {t('theme.system', { defaultValue: 'System' })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() =>
                  saveSettings({
                    language: localSettings.language, // Should be managed by LanguageSwitcher context but kept here for safety
                    theme: localSettings.theme,
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
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">
              {t('notifications.title')}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lowStock">{t('notifications.lowStock')}</Label>
                <Input
                  id="lowStock"
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.lowStockThresholdPercent}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      lowStockThresholdPercent: parseInt(e.target.value) || 10,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('notifications.lowStockDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mortalityPercent">
                  {t('notifications.mortalityPercent')}
                </Label>
                <Input
                  id="mortalityPercent"
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.mortalityAlertPercent}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      mortalityAlertPercent: parseInt(e.target.value) || 5,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('notifications.mortalityPercentDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mortalityQty">
                  {t('notifications.mortalityQty')}
                </Label>
                <Input
                  id="mortalityQty"
                  type="number"
                  min="1"
                  value={localSettings.mortalityAlertQuantity}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      mortalityAlertQuantity: parseInt(e.target.value) || 10,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('notifications.mortalityQtyDesc')}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-base font-semibold mb-2">
                {t('notifications.emailTitle')}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t('notifications.emailDesc')}
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">
                    {t('notifications.criticalAlerts', {
                      defaultValue: 'Critical Alerts',
                    })}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-highMortality"
                          className="font-normal"
                        >
                          {t('notifications.highMortality')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.highMortalityDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-highMortality"
                        checked={localSettings.notifications.highMortality}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              highMortality: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-lowStock"
                          className="font-normal"
                        >
                          {t('inventory:feed.lowStock')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.lowStockDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-lowStock"
                        checked={localSettings.notifications.lowStock}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              lowStock: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-waterQuality"
                          className="font-normal"
                        >
                          {t('notifications.waterQuality')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.waterQualityDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-waterQuality"
                        checked={localSettings.notifications.waterQualityAlert}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              waterQualityAlert: !!checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">
                    {t('notifications.reminders', {
                      defaultValue: 'Reminders',
                    })}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-vaccinationDue"
                          className="font-normal"
                        >
                          {t('notifications.vaccinationDue')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.vaccinationDueDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-vaccinationDue"
                        checked={localSettings.notifications.vaccinationDue}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              vaccinationDue: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-medicationExpiry"
                          className="font-normal"
                        >
                          {t('notifications.medicationExpiry')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.medicationExpiryDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-medicationExpiry"
                        checked={localSettings.notifications.medicationExpiry}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              medicationExpiry: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-invoiceDue"
                          className="font-normal"
                        >
                          {t('notifications.invoiceDue')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.invoiceDueDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-invoiceDue"
                        checked={localSettings.notifications.invoiceDue}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              invoiceDue: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-batchHarvest"
                          className="font-normal"
                        >
                          {t('notifications.batchHarvest')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.batchHarvestDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-batchHarvest"
                        checked={localSettings.notifications.batchHarvest}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              batchHarvest: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-paymentReceived"
                          className="font-normal"
                        >
                          {t('notifications.paymentReceived')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.paymentReceivedDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-paymentReceived"
                        checked={localSettings.notifications.paymentReceived}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              paymentReceived: !!checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">
                    {t('settings.notifications.reports', {
                      defaultValue: 'Reports',
                    })}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-weeklySummary"
                          className="font-normal"
                        >
                          {t('notifications.weeklySummary')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('notifications.weeklySummaryDesc')}
                        </p>
                      </div>
                      <Switch
                        id="notify-weeklySummary"
                        checked={localSettings.notifications.weeklySummary}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              weeklySummary: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-dailySales"
                          className="font-normal"
                        >
                          Daily Sales
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          End-of-day sales summary
                        </p>
                      </div>
                      <Switch
                        id="notify-dailySales"
                        checked={localSettings.notifications.dailySales}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              dailySales: !!checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label
                          htmlFor="notify-batchPerformance"
                          className="font-normal"
                        >
                          Batch Performance
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Weekly growth and FCR reports per batch
                        </p>
                      </div>
                      <Switch
                        id="notify-batchPerformance"
                        checked={localSettings.notifications.batchPerformance}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              batchPerformance: !!checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() =>
                  saveSettings({
                    lowStockThresholdPercent:
                      localSettings.lowStockThresholdPercent,
                    mortalityAlertPercent: localSettings.mortalityAlertPercent,
                    mortalityAlertQuantity:
                      localSettings.mortalityAlertQuantity,
                    notifications: localSettings.notifications,
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
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{t('business.title')}</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">
                  {t('business.paymentTerms')}
                </Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="0"
                  value={localSettings.defaultPaymentTermsDays}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      defaultPaymentTermsDays: parseInt(e.target.value) || 30,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('business.paymentTermsDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalYear">{t('business.fiscalYear')}</Label>
                <Select
                  value={localSettings.fiscalYearStartMonth.toString()}
                  onValueChange={(value) =>
                    value &&
                    setLocalSettings((prev) => ({
                      ...prev,
                      fiscalYearStartMonth: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger id="fiscalYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('business.fiscalYearDesc')}
                </p>
              </div>
            </div>
            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() =>
                  saveSettings({
                    defaultPaymentTermsDays:
                      localSettings.defaultPaymentTermsDays,
                    fiscalYearStartMonth: localSettings.fiscalYearStartMonth,
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
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <ModulesTabContent />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <IntegrationsTabContent />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{t('help.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('help.description')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const { resetOnboardingFn } =
                  await import('~/features/onboarding/server')
                await resetOnboardingFn()
                // Clear localStorage onboarding state
                localStorage.removeItem('openlivestock_onboarding')
                // Force full page reload to clear all cached state
                window.location.href = '/onboarding'
              } catch (err) {
                console.error('Failed to reset onboarding:', err)
              }
            }}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {t('help.restart')}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ModulesTabContent() {
  const { t } = useTranslation(['settings', 'common'])
  const { selectedFarmId } = useFarm()

  if (!selectedFarmId) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">{t('modules.noFarm')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('modules.noFarmDesc')}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('modules.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('modules.description')}
        </p>
      </div>
      <ModuleSelector />
    </Card>
  )
}

function IntegrationsTabContent() {
  const { t } = useTranslation(['settings', 'common'])
  const [integrations, setIntegrations] = useState<Array<IntegrationStatus>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSendingSMS, setIsSendingSMS] = useState(false)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const { getIntegrationStatusFn } = await import('~/features/integrations')
      const status = await getIntegrationStatusFn()
      setIntegrations(status)
    } catch (error) {
      console.error('Failed to load integrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }
    setIsSendingEmail(true)
    try {
      const { testEmailFn } = await import('~/features/integrations')
      const result = await testEmailFn({ data: { to: testEmail } })
      if (result.success) {
        toast.success('Test email sent!')
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch {
      toast.error('Failed to send test email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number')
      return
    }
    setIsSendingSMS(true)
    try {
      const { testSMSFn } = await import('~/features/integrations')
      const result = await testSMSFn({ data: { to: testPhone } })
      if (result.success) {
        toast.success('Test SMS sent!')
      } else {
        toast.error(result.error || 'Failed to send SMS')
      }
    } catch {
      toast.error('Failed to send test SMS')
    } finally {
      setIsSendingSMS(false)
    }
  }

  const emailIntegration = integrations.find((i) => i.type === 'email')
  const smsIntegration = integrations.find((i) => i.type === 'sms')

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-semibold">
              {t('integrations.email')}
              {emailIntegration?.provider
                ? ` (${emailIntegration.provider})`
                : ''}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('integrations.emailDesc')}
            </p>
          </div>
          {emailIntegration?.configured ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {emailIntegration?.configured ? (
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTestEmail} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              Add to your .env file:
            </p>
            <code className="text-xs">EMAIL_PROVIDER=smtp</code>
            <p className="text-xs text-muted-foreground mt-2">
              Options: <code>smtp</code> (Mailpit, Gmail), <code>resend</code>
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-semibold">
              {t('integrations.sms')}
              {smsIntegration?.provider ? ` (${smsIntegration.provider})` : ''}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('integrations.smsDesc')}
            </p>
          </div>
          {smsIntegration?.configured ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {smsIntegration?.configured ? (
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder="+234..."
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTestSMS} disabled={isSendingSMS}>
              {isSendingSMS ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              Add to your .env file:
            </p>
            <code className="text-xs">SMS_PROVIDER=termii</code>
            <p className="text-xs text-muted-foreground mt-2">
              Options: <code>termii</code> (Africa), <code>twilio</code>{' '}
              (Global)
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h4 className="font-medium mb-2">{t('integrations.howItWorks')}</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• {t('integrations.howItWorksDesc1')}</li>
          <li>• {t('integrations.howItWorksDesc2')}</li>
          <li>• {t('integrations.howItWorksDesc3')}</li>
        </ul>
      </Card>
    </div>
  )
}
