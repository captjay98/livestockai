import { useTranslation } from 'react-i18next'
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  FileText,
  Loader2,
  Mail,
  Save,
} from 'lucide-react'
import type { UserSettings } from '~/features/settings'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'

interface NotificationsTabProps {
  settings: UserSettings
  onSettingsChange: (updates: Partial<UserSettings>) => void
  onSave: (updates: Partial<UserSettings>) => Promise<void>
  isSaving: boolean
}

export function NotificationsTab({
  settings,
  onSettingsChange,
  onSave,
  isSaving,
}: NotificationsTabProps) {
  const { t } = useTranslation(['settings', 'common', 'inventory'])

  return (
    <div className="space-y-6">
      {/* General Thresholds Card */}
      <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <AlertOctagon className="h-5 w-5 text-amber-500" />
            {t('notifications.title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            Define the thresholds that trigger alerts across the system.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2.5">
            <Label htmlFor="lowStock" className="text-sm font-semibold">
              {t('notifications.lowStock')}
            </Label>
            <div className="relative">
              <Input
                id="lowStock"
                type="number"
                min="1"
                max="100"
                className="pr-8 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                value={settings.lowStockThresholdPercent || ''}
                onChange={(e) => {
                  const val = e.target.value
                  onSettingsChange({
                    lowStockThresholdPercent: val === '' ? 0 : parseInt(val),
                  })
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (isNaN(val) || val < 1) {
                    onSettingsChange({
                      lowStockThresholdPercent: 10,
                    })
                  }
                }}
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">
                %
              </span>
            </div>
            <p className="text-[11px] leading-tight text-muted-foreground">
              {t('notifications.lowStockDesc')}
            </p>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="mortalityPercent" className="text-sm font-semibold">
              {t('notifications.mortalityPercent')}
            </Label>
            <div className="relative">
              <Input
                id="mortalityPercent"
                type="number"
                min="1"
                max="100"
                className="pr-8 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                value={settings.mortalityAlertPercent || ''}
                onChange={(e) => {
                  const val = e.target.value
                  onSettingsChange({
                    mortalityAlertPercent: val === '' ? 0 : parseInt(val),
                  })
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (isNaN(val) || val < 1) {
                    onSettingsChange({
                      mortalityAlertPercent: 5,
                    })
                  }
                }}
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">
                %
              </span>
            </div>
            <p className="text-[11px] leading-tight text-muted-foreground">
              {t('notifications.mortalityPercentDesc')}
            </p>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="mortalityQty" className="text-sm font-semibold">
              {t('notifications.mortalityQty')}
            </Label>
            <Input
              id="mortalityQty"
              type="number"
              min="1"
              className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
              value={settings.mortalityAlertQuantity || ''}
              onChange={(e) => {
                const val = e.target.value
                onSettingsChange({
                  mortalityAlertQuantity: val === '' ? 0 : parseInt(val),
                })
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value)
                if (isNaN(val) || val < 1) {
                  onSettingsChange({
                    mortalityAlertQuantity: 10,
                  })
                }
              }}
            />
            <p className="text-[11px] leading-tight text-muted-foreground">
              {t('notifications.mortalityQtyDesc')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications Section */}
      <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-white/10">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            {t('notifications.emailTitle')}
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            {t('notifications.emailDesc')}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-px bg-white/10 dark:bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Critical Alerts Group */}
            <div className="bg-white/40 dark:bg-black/40 p-6 space-y-6">
              <h4 className="flex items-center gap-2 font-bold text-sm text-destructive uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" />
                {t('notifications.criticalAlerts', {
                  defaultValue: 'Critical Alerts',
                })}
              </h4>
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-highMortality"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.highMortality')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.highMortalityDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-highMortality"
                    checked={settings.notifications.highMortality}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          highMortality: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-lowStock"
                      className="font-medium block mb-1"
                    >
                      {t('inventory:feed.lowStock')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.lowStockDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-lowStock"
                    checked={settings.notifications.lowStock}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          lowStock: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-waterQuality"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.waterQuality')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.waterQualityDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-waterQuality"
                    checked={settings.notifications.waterQualityAlert}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          waterQualityAlert: !!checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Reminders Group */}
            <div className="bg-white/40 dark:bg-black/40 p-6 space-y-6">
              <h4 className="flex items-center gap-2 font-bold text-sm text-amber-500 uppercase tracking-wider">
                <Bell className="h-4 w-4" />
                {t('notifications.reminders', { defaultValue: 'Reminders' })}
              </h4>
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-vaccinationDue"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.vaccinationDue')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.vaccinationDueDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-vaccinationDue"
                    checked={settings.notifications.vaccinationDue}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          vaccinationDue: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-medicationExpiry"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.medicationExpiry')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.medicationExpiryDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-medicationExpiry"
                    checked={settings.notifications.medicationExpiry}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          medicationExpiry: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-invoiceDue"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.invoiceDue')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.invoiceDueDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-invoiceDue"
                    checked={settings.notifications.invoiceDue}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          invoiceDue: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-batchHarvest"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.batchHarvest')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.batchHarvestDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-batchHarvest"
                    checked={settings.notifications.batchHarvest}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          batchHarvest: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-paymentReceived"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.paymentReceived')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.paymentReceivedDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-paymentReceived"
                    checked={settings.notifications.paymentReceived}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          paymentReceived: !!checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Reports Group */}
            <div className="bg-white/40 dark:bg-black/40 p-6 space-y-6">
              <h4 className="flex items-center gap-2 font-bold text-sm text-blue-500 uppercase tracking-wider">
                <FileText className="h-4 w-4" />
                {t('settings.notifications.reports', {
                  defaultValue: 'Reports',
                })}
              </h4>
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-weeklySummary"
                      className="font-medium block mb-1"
                    >
                      {t('notifications.weeklySummary')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('notifications.weeklySummaryDesc')}
                    </p>
                  </div>
                  <Switch
                    id="notify-weeklySummary"
                    checked={settings.notifications.weeklySummary}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          weeklySummary: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-dailySales"
                      className="font-medium block mb-1"
                    >
                      Daily Sales
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      End-of-day sales summary
                    </p>
                  </div>
                  <Switch
                    id="notify-dailySales"
                    checked={settings.notifications.dailySales}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          dailySales: !!checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="notify-batchPerformance"
                      className="font-medium block mb-1"
                    >
                      Batch Performance
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Weekly growth and FCR reports per batch
                    </p>
                  </div>
                  <Switch
                    id="notify-batchPerformance"
                    checked={settings.notifications.batchPerformance}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        notifications: {
                          ...settings.notifications,
                          batchPerformance: !!checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() =>
            onSave({
              lowStockThresholdPercent: settings.lowStockThresholdPercent,
              mortalityAlertPercent: settings.mortalityAlertPercent,
              mortalityAlertQuantity: settings.mortalityAlertQuantity,
              notifications: settings.notifications,
            })
          }
          disabled={isSaving}
          className="rounded-xl px-6 font-bold"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('common:save')}
        </Button>
      </div>
    </div>
  )
}
