import { useTranslation } from 'react-i18next'
import { Loader2, Save } from 'lucide-react'
import type { UserSettings } from '~/features/settings'
import { Card } from '~/components/ui/card'
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
        <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">
                {t('notifications.title')}
            </h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="lowStock">
                        {t('notifications.lowStock')}
                    </Label>
                    <Input
                        id="lowStock"
                        type="number"
                        min="1"
                        max="100"
                        value={settings.lowStockThresholdPercent || ''}
                        onChange={(e) => {
                            const val = e.target.value
                            onSettingsChange({
                                lowStockThresholdPercent:
                                    val === '' ? 0 : parseInt(val),
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
                        value={settings.mortalityAlertPercent || ''}
                        onChange={(e) => {
                            const val = e.target.value
                            onSettingsChange({
                                mortalityAlertPercent:
                                    val === '' ? 0 : parseInt(val),
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
                        value={settings.mortalityAlertQuantity || ''}
                        onChange={(e) => {
                            const val = e.target.value
                            onSettingsChange({
                                mortalityAlertQuantity:
                                    val === '' ? 0 : parseInt(val),
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
                                    checked={
                                        settings.notifications.highMortality
                                    }
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
                                    checked={
                                        settings.notifications.waterQualityAlert
                                    }
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
                                    checked={
                                        settings.notifications.vaccinationDue
                                    }
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

                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <Label
                                        htmlFor="notify-medicationExpiry"
                                        className="font-normal"
                                    >
                                        {t('notifications.medicationExpiry')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'notifications.medicationExpiryDesc',
                                        )}
                                    </p>
                                </div>
                                <Switch
                                    id="notify-medicationExpiry"
                                    checked={
                                        settings.notifications.medicationExpiry
                                    }
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
                                    checked={
                                        settings.notifications.batchHarvest
                                    }
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
                                    checked={
                                        settings.notifications.paymentReceived
                                    }
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
                                    checked={
                                        settings.notifications.weeklySummary
                                    }
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
                                    checked={
                                        settings.notifications.batchPerformance
                                    }
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
            </div>
            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
                <Button
                    onClick={() =>
                        onSave({
                            lowStockThresholdPercent:
                                settings.lowStockThresholdPercent,
                            mortalityAlertPercent:
                                settings.mortalityAlertPercent,
                            mortalityAlertQuantity:
                                settings.mortalityAlertQuantity,
                            notifications: settings.notifications,
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
