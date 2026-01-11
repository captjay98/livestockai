/**
 * Settings Page
 *
 * User settings for currency, date/time, and units of measurement.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Calendar, DollarSign, Loader2, RotateCcw, Ruler, Save, Settings } from 'lucide-react'
import type {UserSettings} from '~/lib/settings';
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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
  useSettings
} from '~/lib/settings'
import { formatCurrency } from '~/lib/settings/currency-formatter'
import { formatDate, formatTime } from '~/lib/settings/date-formatter'
import { formatArea, formatTemperature, formatWeight } from '~/lib/settings/unit-converter'

export const Route = createFileRoute('/_auth/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { settings, updateSettings, isLoading, error } = useSettings()
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync local settings when context settings change
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateSettings(localSettings)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('Failed to save settings. Please try again.')
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
  const previewWeight = 2.5 // kg
  const previewArea = 100 // sqm
  const previewTemp = 25 // celsius

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your regional preferences
          </p>
        </div>
      </div>

      {(error || saveError) && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error || saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-md">
          Settings saved successfully!
        </div>
      )}

      <Tabs defaultValue="currency" className="space-y-4">
        <TabsList>
          <TabsTrigger value="currency" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Currency
          </TabsTrigger>
          <TabsTrigger value="datetime" className="gap-2">
            <Calendar className="h-4 w-4" />
            Date & Time
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Ruler className="h-4 w-4" />
            Units
          </TabsTrigger>
        </TabsList>

        {/* Currency Tab */}
        <TabsContent value="currency">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Currency Settings</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReset('currency')}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Currency Preset</Label>
                <Select
                  value={localSettings.currencyCode}
                  onValueChange={handleCurrencyPresetChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
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

              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  value={localSettings.currencySymbol}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      currencySymbol: e.target.value,
                    }))
                  }
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Decimal Places</Label>
                <Select
                  value={String(localSettings.currencyDecimals)}
                  onValueChange={(v) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      currencyDecimals: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (e.g., ¥100)</SelectItem>
                    <SelectItem value="2">2 (e.g., $100.00)</SelectItem>
                    <SelectItem value="3">3 (e.g., KWD 100.000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Symbol Position</Label>
                <Select
                  value={localSettings.currencySymbolPosition}
                  onValueChange={(v: 'before' | 'after') =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      currencySymbolPosition: v,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before ($100)</SelectItem>
                    <SelectItem value="after">After (100€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thousand Separator</Label>
                <Select
                  value={localSettings.thousandSeparator}
                  onValueChange={(v) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      thousandSeparator: v,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Comma (1,000)</SelectItem>
                    <SelectItem value=".">Period (1.000)</SelectItem>
                    <SelectItem value=" ">Space (1 000)</SelectItem>
                    <SelectItem value="'">Apostrophe (1'000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Decimal Separator</Label>
                <Select
                  value={localSettings.decimalSeparator}
                  onValueChange={(v) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      decimalSeparator: v,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=".">Period (100.50)</SelectItem>
                    <SelectItem value=",">Comma (100,50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground">Preview</Label>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(previewAmount, localSettings)}
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Date & Time Tab */}
        <TabsContent value="datetime">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Date & Time Settings</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReset('datetime')}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={localSettings.dateFormat}
                  onValueChange={(v: UserSettings['dateFormat']) =>
                    setLocalSettings((prev) => ({ ...prev, dateFormat: v }))
                  }
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
                <Label>Time Format</Label>
                <Select
                  value={localSettings.timeFormat}
                  onValueChange={(v: '12h' | '24h') =>
                    setLocalSettings((prev) => ({ ...prev, timeFormat: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>First Day of Week</Label>
                <Select
                  value={String(localSettings.firstDayOfWeek)}
                  onValueChange={(v) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      firstDayOfWeek: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground">Preview</Label>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-semibold">
                  {formatDate(previewDate, localSettings)}
                </p>
                <p className="text-muted-foreground">
                  {formatTime(previewDate, localSettings)}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Units of Measurement</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReset('units')}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Weight</Label>
                <Select
                  value={localSettings.weightUnit}
                  onValueChange={(v: 'kg' | 'lbs') =>
                    setLocalSettings((prev) => ({ ...prev, weightUnit: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Area</Label>
                <Select
                  value={localSettings.areaUnit}
                  onValueChange={(v: 'sqm' | 'sqft') =>
                    setLocalSettings((prev) => ({ ...prev, areaUnit: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqm">Square Meters (m²)</SelectItem>
                    <SelectItem value="sqft">Square Feet (ft²)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature</Label>
                <Select
                  value={localSettings.temperatureUnit}
                  onValueChange={(v: 'celsius' | 'fahrenheit') =>
                    setLocalSettings((prev) => ({ ...prev, temperatureUnit: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground">Preview</Label>
              <div className="mt-2 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-semibold">
                    {formatWeight(previewWeight, localSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-semibold">
                    {formatArea(previewArea, localSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-semibold">
                    {formatTemperature(previewTemp, localSettings)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
