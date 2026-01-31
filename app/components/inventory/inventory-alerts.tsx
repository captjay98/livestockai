import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface InventoryAlertsProps {
  lowStockFeedCount: number
  lowStockMedCount: number
  expiringMedCount: number
  expiredMedCount: number
  lowStockSuppliesCount?: number
  expiringSuppliesCount?: number
  expiredSuppliesCount?: number
}

export function InventoryAlerts({
  lowStockFeedCount,
  lowStockMedCount,
  expiringMedCount,
  expiredMedCount,
  lowStockSuppliesCount = 0,
  expiringSuppliesCount = 0,
  expiredSuppliesCount = 0,
}: InventoryAlertsProps) {
  const { t } = useTranslation('inventory')

  const hasAlerts =
    lowStockFeedCount > 0 ||
    lowStockMedCount > 0 ||
    expiringMedCount > 0 ||
    expiredMedCount > 0 ||
    lowStockSuppliesCount > 0 ||
    expiringSuppliesCount > 0 ||
    expiredSuppliesCount > 0

  if (!hasAlerts) return null

  return (
    <Card className="bg-white/30 dark:bg-black/80 backdrop-blur-md border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden relative group">
      {/* Decorative Orb */}
      <div className="absolute -top-8 -left-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform" />

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shadow-inner">
            <AlertTriangle className="h-4 w-4" />
          </div>
          {t('alerts.title', { defaultValue: 'Inventory Alerts' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {lowStockFeedCount > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {lowStockFeedCount}{' '}
              {t('alerts.feedLow', {
                defaultValue: 'feed type(s) low stock',
              })}
            </Badge>
          )}
          {lowStockMedCount > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {lowStockMedCount}{' '}
              {t('alerts.medLow', {
                defaultValue: 'medication(s) low stock',
              })}
            </Badge>
          )}
          {lowStockSuppliesCount > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {lowStockSuppliesCount}{' '}
              {t('alerts.suppliesLow', {
                defaultValue: 'supply item(s) low stock',
              })}
            </Badge>
          )}
          {expiringMedCount > 0 && (
            <Badge
              variant="outline"
              className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
              {expiringMedCount}{' '}
              {t('alerts.medExpiring', {
                defaultValue: 'medication(s) expiring soon',
              })}
            </Badge>
          )}
          {expiringSuppliesCount > 0 && (
            <Badge
              variant="outline"
              className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
              {expiringSuppliesCount}{' '}
              {t('alerts.suppliesExpiring', {
                defaultValue: 'supply item(s) expiring soon',
              })}
            </Badge>
          )}
          {expiredMedCount > 0 && (
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
              {expiredMedCount}{' '}
              {t('alerts.medExpired', {
                defaultValue: 'medication(s) expired',
              })}
            </Badge>
          )}
          {expiredSuppliesCount > 0 && (
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
              {expiredSuppliesCount}{' '}
              {t('alerts.suppliesExpired', {
                defaultValue: 'supply item(s) expired',
              })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
