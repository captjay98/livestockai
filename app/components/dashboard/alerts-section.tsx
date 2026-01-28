import { useTranslation } from 'react-i18next'
import {
    AlertTriangle,
    Droplets,
    Package,
    Syringe,
    TrendingDown,
    Wheat,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

export interface BatchAlert {
    id: string
    source:
        | 'mortality'
        | 'water_quality'
        | 'vaccination'
        | 'inventory'
        | 'feed'
        | 'growth'
    type: 'critical' | 'warning' | 'info'
    species: string
    message: string
}

interface AlertsSectionProps {
    alerts: Array<BatchAlert>
}

export function AlertsSection({ alerts }: AlertsSectionProps) {
    const { t } = useTranslation(['dashboard', 'common'])

    if (alerts.length === 0) return null

    return (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    {t('alerts', { defaultValue: 'Alerts' })}
                    <Badge
                        variant="outline"
                        className="ml-auto bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                    >
                        {alerts.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 text-sm"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {alert.source === 'mortality' && (
                                <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                            )}
                            {alert.source === 'water_quality' && (
                                <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
                            )}
                            {alert.source === 'vaccination' && (
                                <Syringe className="h-4 w-4 text-amber-600 shrink-0" />
                            )}
                            {alert.source === 'inventory' && (
                                <Package className="h-4 w-4 text-orange-600 shrink-0" />
                            )}
                            {alert.source === 'feed' && (
                                <Wheat className="h-4 w-4 text-yellow-600 shrink-0" />
                            )}

                            <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">
                                    {alert.species}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {alert.message}
                                </span>
                            </div>
                        </div>

                        {alert.type === 'critical' && (
                            <Badge
                                variant="destructive"
                                className="text-[10px] shrink-0 ml-2"
                            >
                                {t('common.critical', {
                                    defaultValue: 'Critical',
                                })}
                            </Badge>
                        )}
                        {alert.type === 'warning' && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] bg-amber-100 text-amber-700 shrink-0 ml-2"
                            >
                                {t('common.warning', {
                                    defaultValue: 'Warning',
                                })}
                            </Badge>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
