import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface InventoryAlertsProps {
  lowStockFeedCount: number
  lowStockMedCount: number
  expiringMedCount: number
  expiredMedCount: number
}

export function InventoryAlerts({
  lowStockFeedCount,
  lowStockMedCount,
  expiringMedCount,
  expiredMedCount,
}: InventoryAlertsProps) {
  const { t } = useTranslation('inventory')

  const hasAlerts =
    lowStockFeedCount > 0 ||
    lowStockMedCount > 0 ||
    expiringMedCount > 0 ||
    expiredMedCount > 0

  if (!hasAlerts) return null

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-warning">
          <AlertTriangle className="h-5 w-5" />
          {t('alerts.title', { defaultValue: 'Inventory Alerts' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {lowStockFeedCount > 0 && (
            <Badge variant="outline" className="text-warning border-warning">
              {lowStockFeedCount}{' '}
              {t('alerts.feedLow', { defaultValue: 'feed type(s) low stock' })}
            </Badge>
          )}
          {lowStockMedCount > 0 && (
            <Badge variant="outline" className="text-warning border-warning">
              {lowStockMedCount}{' '}
              {t('alerts.medLow', { defaultValue: 'medication(s) low stock' })}
            </Badge>
          )}
          {expiringMedCount > 0 && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-500"
            >
              {expiringMedCount}{' '}
              {t('alerts.medExpiring', {
                defaultValue: 'medication(s) expiring soon',
              })}
            </Badge>
          )}
          {expiredMedCount > 0 && (
            <Badge
              variant="outline"
              className="text-destructive border-destructive"
            >
              {expiredMedCount}{' '}
              {t('alerts.medExpired', {
                defaultValue: 'medication(s) expired',
              })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
