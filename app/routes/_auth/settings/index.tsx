/**
 * Settings Page
 *
 * User settings for currency, date/time, and units of measurement.
 */

import {
  Link,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
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
  Users,
  XCircle,
} from 'lucide-react'
import type { UserSettings } from '~/features/settings'
import type { IntegrationStatus } from '~/features/integrations'
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
  useSettings,
} from '~/features/settings'
import { formatCurrency } from '~/features/settings/currency-formatter'
import { formatDate, formatTime } from '~/features/settings/date-formatter'
import { useFarm } from '~/features/farms/context'
import { ModuleSelector } from '~/components/modules/selector'
import {
  formatArea,
  formatTemperature,
  formatWeight,
} from '~/features/settings/unit-converter'
import { useSession } from '~/features/auth/client'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/_auth/settings/')({
  component: SettingsPage,
})

// Settings sub-navigation items
const settingsNav = [
  { name: 'Regional', href: '/settings', icon: Settings, adminOnly: false },
  { name: 'Users', href: '/settings/users', icon: Users, adminOnly: true },
  {
    name: 'Audit Log',
    href: '/settings/audit',
    icon: ClipboardList,
    adminOnly: true,
  },
]

function SettingsPage() {
  const { settings, updateSettings, isLoading, error } = useSettings()
  const { data: session } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isAdmin = session?.user.role === 'admin'

  // Filter nav items based on admin status
  const visibleNav = settingsNav.filter((item) => !item.adminOnly || isAdmin)

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
      toast.success('Settings saved')
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('Failed to save settings. Please try again.')
      toast.error('Failed to save settings')
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

      {/* Settings Sub-Navigation */}
      <div className="flex gap-1 border-b pb-2 overflow-x-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
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
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Boxes className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Layers className="h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrations
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
                      currencyDecimals: parseInt(v || '2'),
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
                  onValueChange={(v) => {
                    if (v) {
                      setLocalSettings((prev) => ({
                        ...prev,
                        currencySymbolPosition: v,
                      }))
                    }
                  }}
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
                      thousandSeparator: v || ',',
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
                      decimalSeparator: v || '.',
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
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">
                      DD/MM/YYYY (UK/EU)
                    </SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Format</Label>
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
                      firstDayOfWeek: parseInt(v || '0'),
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
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Area</Label>
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
                    <SelectItem value="sqm">Square Meters (m²)</SelectItem>
                    <SelectItem value="sqft">Square Feet (ft²)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature</Label>
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

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Preferences</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={localSettings.language}
                  onValueChange={(value) =>
                    value &&
                    setLocalSettings((prev) => ({
                      ...prev,
                      language: value as any,
                    }))
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                    <SelectItem value="yo">Yoruba</SelectItem>
                    <SelectItem value="ig">Igbo</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Interface language (translations coming soon)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
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
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Alert Thresholds</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lowStock">Low Stock Threshold (%)</Label>
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
                  Alert when inventory falls below this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mortalityPercent">Mortality Alert (%)</Label>
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
                  Alert when mortality rate exceeds this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mortalityQty">Mortality Alert (Quantity)</Label>
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
                  Alert when deaths exceed this number in a single day
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Business Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">
                  Default Payment Terms (Days)
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
                  Default due date for invoices (e.g., 30 days)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalYear">Fiscal Year Start Month</Label>
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
                  Start month for financial year reporting
                </p>
              </div>
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

      {/* Help Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Need a refresher?</h3>
            <p className="text-sm text-muted-foreground">
              Restart the feature tour to learn about all the features
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
            Restart Tour
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ModulesTabContent() {
  const { selectedFarmId } = useFarm()

  if (!selectedFarmId) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Farm Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a farm to manage its modules.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Feature Modules</h2>
        <p className="text-sm text-muted-foreground">
          Enable or disable livestock types for your farm.
        </p>
      </div>
      <ModuleSelector />
    </Card>
  )
}

function IntegrationsTabContent() {
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
            <h3 className="font-semibold">Email (Resend)</h3>
            <p className="text-sm text-muted-foreground">
              Send critical alerts via email
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
            <code className="text-xs">RESEND_API_KEY=re_your_key</code>
            <p className="text-xs text-muted-foreground mt-2">
              Get key from{' '}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                resend.com
              </a>
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-semibold">SMS (Termii)</h3>
            <p className="text-sm text-muted-foreground">
              Send critical alerts via SMS
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
            <code className="text-xs">TERMII_API_KEY=your_key</code>
            <p className="text-xs text-muted-foreground mt-2">
              Get key from{' '}
              <a
                href="https://accounts.termii.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                termii.com
              </a>
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h4 className="font-medium mb-2">How it works</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Integrations are optional - app works without them</li>
          <li>• When configured, critical alerts sent via email/SMS</li>
          <li>• Alert types: High mortality, Low stock, Invoice due</li>
        </ul>
      </Card>
    </div>
  )
}
