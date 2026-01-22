import {
  DollarSign,
  HeartPulse,
  Package,
  TrendingDown,
  TrendingUp,
  Utensils,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency, useFormatWeight } from '~/features/settings'
import { cn } from '~/lib/utils'

export interface BatchMetrics {
  currentQuantity: number
  initialQuantity: number
  mortalityCount: number
  mortalityRate: number
  feedTotalKg: number
  feedFcr: number | null
  totalInvestment: number
  costPerUnit: number
  totalRevenue: number
  totalSold: number
  avgSalesPrice: number
  netProfit: number
  roi: number
}

interface BatchKPIsProps {
  metrics: BatchMetrics
}

export function BatchKPIs({ metrics }: BatchKPIsProps) {
  const { t } = useTranslation(['batches', 'common', 'dashboard'])
  const { format: formatCurrency } = useFormatCurrency()
  const { label: weightLabel } = useFormatWeight()

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
            {t('detail.currentStock', {
              defaultValue: 'Current Stock',
            })}
          </CardTitle>
          <Package className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-2xl font-bold">
            {metrics.currentQuantity.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.initialQuantity.toLocaleString()}{' '}
            {t('detail.initial', { defaultValue: 'initial' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
            {t('common:mortality', { defaultValue: 'Mortality' })}
          </CardTitle>
          <HeartPulse className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-2xl font-bold">{metrics.mortalityCount}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span
              className={
                metrics.mortalityRate > 5
                  ? 'text-red-500 font-medium'
                  : 'text-green-500'
              }
            >
              {metrics.mortalityRate.toFixed(1)}%
            </span>
            <span className="ml-1">
              {t('dashboard:rate', { defaultValue: 'rate' })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
            {t('common:feed', { defaultValue: 'Feed' })} ({weightLabel})
          </CardTitle>
          <Utensils className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-2xl font-bold">
            {metrics.feedTotalKg.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('batches:fcr', { defaultValue: 'FCR' })}:{' '}
            {metrics.feedFcr ? metrics.feedFcr.toFixed(2) : '--'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
            {t('common:expenses', { defaultValue: 'Expenses' })}
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg font-bold truncate">
            {formatCurrency(metrics.totalInvestment)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(metrics.costPerUnit)}{' '}
            {t('common:perUnit', { defaultValue: '/ unit' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
            {t('common:revenue', { defaultValue: 'Revenue' })}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg font-bold truncate">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalSold} {t('statuses.sold', { defaultValue: 'sold' })} @{' '}
            {formatCurrency(metrics.avgSalesPrice)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
            {t('detail.profit', { defaultValue: 'Profit / Loss' })}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div
            className={cn(
              'text-lg font-bold truncate',
              metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-500',
            )}
          >
            {formatCurrency(metrics.netProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.roi.toFixed(1)}% {t('detail.roi', { defaultValue: 'ROI' })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
