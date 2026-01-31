import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Activity, Calendar, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import { getEnhancedProjectionFn } from '~/features/batches/forecasting'
import { Skeleton } from '~/components/ui/skeleton'
import { useFormatCurrency } from '~/features/settings'

interface ProjectionsCardProps {
  batchId: string
}

export function ProjectionsCard({ batchId }: ProjectionsCardProps) {
  const { t } = useTranslation(['batches', 'common'])
  const { symbol: currency } = useFormatCurrency()
  const { data: projection, isLoading } = useQuery({
    queryKey: ['batch', batchId, 'enhanced-projection'],
    queryFn: () => getEnhancedProjectionFn({ data: { batchId } }),
  })
  const { data: batchData } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      const { getBatchDetailsFn } = await import('~/features/batches/server')
      return getBatchDetailsFn({ data: { batchId } })
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth & Financial Projections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!projection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth & Financial Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Not enough data for projections. Ensure target weight is set and
            growth standards exist for this species.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-bold tracking-tight">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Growth & Financial Projections
          </div>
          {batchData?.batch.breedName ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20">
              ✓ {batchData.batch.breedName} data
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-lg border border-white/10">
              Generic {batchData?.batch.species} data
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b">
          <div>
            <p className="text-xs text-muted-foreground">
              {t('batches:projections.currentWeight', {
                defaultValue: 'Current Weight',
              })}
            </p>
            <p className="text-lg font-bold">
              {(projection.currentWeightG / 1000).toFixed(2)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {t('batches:projections.expectedWeight', {
                defaultValue: 'Expected Weight',
              })}
            </p>
            <p className="text-lg font-bold text-muted-foreground">
              {(projection.expectedWeightG / 1000).toFixed(2)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {t('batches:projections.performanceIndex', {
                defaultValue: 'Performance Index',
              })}
            </p>
            <p
              className={`text-lg font-bold ${
                projection.performanceIndex >= 95 &&
                projection.performanceIndex <= 105
                  ? 'text-success'
                  : projection.performanceIndex < 95
                    ? 'text-destructive'
                    : 'text-info'
              }`}
            >
              {projection.performanceIndex.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* ADG Comparison */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" /> Current ADG
            </p>
            <p className="text-sm font-medium">
              {projection.adgGramsPerDay.toFixed(1)} g/day
            </p>
            <p className="text-[10px] text-muted-foreground">
              {projection.adgMethod === 'two_samples'
                ? 'From weight samples'
                : projection.adgMethod === 'single_sample'
                  ? 'From single sample'
                  : 'Estimated from curve'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {t('batches:projections.expectedAdg', {
                defaultValue: 'Expected ADG',
              })}
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              {projection.expectedAdgGramsPerDay.toFixed(1)} g/day
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Harvest Date
            </span>
            <span className="font-medium">
              {format(new Date(projection.projectedHarvestDate), 'PPP')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('batches:projections.daysRemaining', {
                defaultValue: 'Days Remaining',
              })}
            </span>
            <span
              className={`font-medium ${projection.daysRemaining < 0 ? 'text-destructive' : ''}`}
            >
              {projection.daysRemaining} days
            </span>
          </div>
          <Progress
            value={Math.max(
              0,
              Math.min(100, 100 - (projection.daysRemaining / 60) * 100),
            )} // Rough progress visualization
            className={`h-2 ${
              projection.currentStatus === 'ahead'
                ? 'bg-success'
                : projection.currentStatus === 'behind'
                  ? 'bg-destructive'
                  : 'bg-secondary'
            }`}
          />
          <div className="flex justify-end">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                projection.currentStatus === 'ahead'
                  ? 'bg-success/10 text-success'
                  : projection.currentStatus === 'behind'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-info/10 text-info'
              }`}
            >
              {projection.currentStatus === 'ahead'
                ? 'Ahead of Schedule'
                : projection.currentStatus === 'behind'
                  ? 'Behind Schedule'
                  : 'On Track'}
            </span>
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Est. Revenue</p>
            <p className="text-lg font-bold text-success">
              {currency}
              {projection.projectedRevenue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Est. Profit</p>
            <p
              className={`text-lg font-bold ${projection.estimatedProfit >= 0 ? 'text-primary' : 'text-destructive'}`}
            >
              {currency}
              {projection.estimatedProfit.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rem. Feed Cost</p>
            <p className="text-sm font-medium">
              {currency}
              {projection.projectedFeedCost.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
