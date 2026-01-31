import {
  DollarSign,
  HeartPulse,
  Package,
  TrendingUp as Performance,
  Scale,
  Timer,
  TrendingDown,
  TrendingUp,
  Utensils,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { SummaryCard } from '~/components/ui/summary-card'
import { useFormatCurrency, useFormatWeight } from '~/features/settings'
import { getEnhancedProjectionFn } from '~/features/batches/forecasting'
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
  batchId: string
  acquisitionDate: Date
  targetHarvestDate?: Date | null
}

export function BatchKPIs({
  metrics,
  batchId,
  acquisitionDate,
  targetHarvestDate,
}: BatchKPIsProps) {
  const { t } = useTranslation(['batches', 'common', 'dashboard'])
  const { format: formatCurrency } = useFormatCurrency()
  const { label: weightLabel, format: formatWeight } = useFormatWeight()

  // Calculate generic metrics
  const today = new Date()
  const acquisition = new Date(acquisitionDate)
  const ageInDays = Math.max(
    1,
    Math.floor(
      (today.getTime() - acquisition.getTime()) / (1000 * 60 * 60 * 24),
    ),
  )

  // Calculate Time metrics
  let daysRemaining = null
  let progress = 0

  if (targetHarvestDate) {
    const target = new Date(targetHarvestDate)
    const totalDuration = Math.max(
      1,
      Math.floor(
        (target.getTime() - acquisition.getTime()) / (1000 * 60 * 60 * 24),
      ),
    )
    daysRemaining = Math.max(
      0,
      Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    )
    progress = Math.min(100, Math.max(0, (ageInDays / totalDuration) * 100))
  }

  // Calculate Feed metrics
  const avgDailyFeed =
    metrics.feedTotalKg > 0 ? metrics.feedTotalKg / ageInDays : 0

  // Fetch enhanced projection data
  const { data: projection, isLoading: isLoadingProjection } = useQuery({
    queryKey: ['enhanced-projection', batchId],
    queryFn: () => getEnhancedProjectionFn({ data: { batchId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const getPerformanceColor = (index: number | null) => {
    if (!index) return 'text-muted-foreground'
    if (index >= 95 && index <= 105) return 'text-green-600'
    if (index >= 90 && index < 95) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
      <SummaryCard
        title={t('detail.currentStock', { defaultValue: 'Current Stock' })}
        value={metrics.currentQuantity.toLocaleString()}
        icon={Package}
        description={`${metrics.initialQuantity.toLocaleString()} ${t('detail.initial', { defaultValue: 'initial' })}`}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      />

      <SummaryCard
        title={t('common:mortality', { defaultValue: 'Mortality' })}
        value={metrics.mortalityCount}
        icon={HeartPulse}
        iconClassName="bg-red-500/10 text-red-600"
        description={
          <span className="flex items-center gap-1 font-bold">
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full bg-opacity-10',
                metrics.mortalityRate > 5
                  ? 'text-red-500 bg-red-500'
                  : 'text-green-500 bg-green-500',
              )}
            >
              {metrics.mortalityRate.toFixed(1)}%
            </span>
            <span className="text-muted-foreground uppercase opacity-70">
              {t('dashboard:rate', { defaultValue: 'rate' })}
            </span>
          </span>
        }
      />

      <SummaryCard
        title={t('common:feed', { defaultValue: 'Feed' })}
        value={
          <>
            {metrics.feedTotalKg.toLocaleString()}
            <span className="text-[10px] ml-0.5 font-bold uppercase">
              {weightLabel}
            </span>
          </>
        }
        icon={Utensils}
        iconClassName="bg-orange-500/10 text-orange-600"
        description={
          <div className="flex flex-col gap-0.5 mt-0.5">
            <span className="font-bold uppercase tracking-tighter text-[10px]">
              {t('batches:fcr', { defaultValue: 'FCR' })}:{' '}
              <span className="text-foreground">
                {metrics.feedFcr ? metrics.feedFcr.toFixed(2) : '--'}
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">
              {formatWeight(avgDailyFeed)} / day
            </span>
          </div>
        }
      />

      <SummaryCard
        title={t('batches:schedule', { defaultValue: 'Schedule' })}
        value={
          daysRemaining !== null ? (
            <>
              {daysRemaining}
              <span className="text-[10px] ml-1 font-bold uppercase text-muted-foreground">
                days left
              </span>
            </>
          ) : (
            <span className="text-sm">
              {t('batches:noTarget', { defaultValue: 'No Target' })}
            </span>
          )
        }
        icon={Timer}
        iconClassName="bg-violet-500/10 text-violet-600"
        description={
          targetHarvestDate ? (
            <div className="w-full mt-2 space-y-1">
              <div className="flex justify-between text-[10px] font-medium uppercase text-muted-foreground">
                <span>{progress.toFixed(0)}% Done</span>
                <span>{ageInDays}d Old</span>
              </div>
              <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Set target date
            </span>
          )
        }
      />

      <SummaryCard
        title={t('batches:currentWeight', { defaultValue: 'Weight' })}
        value={
          isLoadingProjection ? (
            <span className="animate-pulse">--</span>
          ) : (
            <>
              {projection?.currentWeightG
                ? (projection.currentWeightG / 1000).toFixed(2)
                : '--'}
              <span className="text-[10px] ml-0.5 font-bold uppercase">kg</span>
            </>
          )
        }
        icon={Scale}
        iconClassName="bg-blue-500/10 text-blue-600"
        description={
          <span className="uppercase truncate">
            {t('batches:avgWeight', { defaultValue: 'Avg Weight' })}
          </span>
        }
      />

      <SummaryCard
        title={t('batches:performanceIndex', { defaultValue: 'PI' })}
        value={
          isLoadingProjection ? (
            <span className="animate-pulse">--</span>
          ) : projection?.performanceIndex ? (
            projection.performanceIndex.toFixed(0)
          ) : (
            '--'
          )
        }
        valueClassName={getPerformanceColor(
          projection?.performanceIndex ?? null,
        )}
        icon={Performance}
        iconClassName="bg-indigo-500/10 text-indigo-600"
        description={
          <span className="uppercase">
            {t('batches:index', { defaultValue: 'Index' })}
          </span>
        }
      />

      <SummaryCard
        title={t('common:expenses', { defaultValue: 'Expenses' })}
        value={formatCurrency(metrics.totalInvestment)}
        icon={TrendingDown}
        iconClassName="bg-red-500/10 text-red-600"
        description={
          <span className="uppercase font-medium">
            {formatCurrency(metrics.costPerUnit)}{' '}
            {t('common:perUnit', { defaultValue: '/ unit' })}
          </span>
        }
      />

      <SummaryCard
        title={t('common:revenue', { defaultValue: 'Revenue' })}
        value={formatCurrency(metrics.totalRevenue)}
        icon={TrendingUp}
        iconClassName="bg-green-500/10 text-green-600"
        description={
          <span className="uppercase truncate font-medium">
            {metrics.totalSold} sold @ {formatCurrency(metrics.avgSalesPrice)}
          </span>
        }
      />

      <SummaryCard
        title={t('detail.profit', { defaultValue: 'Profit / Loss' })}
        value={formatCurrency(metrics.netProfit)}
        valueClassName={
          metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-500'
        }
        icon={DollarSign}
        iconClassName="bg-blue-500/10 text-blue-600"
        className="col-span-2 md:col-span-1 lg:col-span-1 min-w-[140px]"
        description={
          <span className="font-bold uppercase">
            <span
              className={metrics.roi >= 0 ? 'text-green-600' : 'text-red-500'}
            >
              {metrics.roi.toFixed(1)}%
            </span>{' '}
            <span className="text-muted-foreground">
              {t('detail.roi', { defaultValue: 'ROI' })}
            </span>
          </span>
        }
      />
    </div>
  )
}
