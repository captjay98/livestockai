import { Bird, Fish, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency } from '~/features/settings'

interface InventorySummary {
  poultry: { batches: number; quantity: number; investment: number }
  fish: { batches: number; quantity: number; investment: number }
  overall: {
    totalBatches?: number
    activeBatches: number
    depletedBatches: number
    totalQuantity: number
    totalInvestment: number
  }
}

interface BatchSummaryCardsProps {
  summary: InventorySummary | null
}

export function BatchSummaryCards({ summary }: BatchSummaryCardsProps) {
  const { t } = useTranslation(['batches', 'common'])
  const { format: formatCurrency } = useFormatCurrency()

  if (!summary) return null

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('totalLivestock', {
              defaultValue: 'Total Livestock',
            })}
          </CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {summary.overall.totalQuantity.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {summary.overall.activeBatches}{' '}
            {t('activeBatches', { defaultValue: 'active batches' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('poultry', { defaultValue: 'Poultry' })}
          </CardTitle>
          <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {summary.poultry.quantity.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {summary.poultry.batches}{' '}
            {t('common:batches', { defaultValue: 'batches' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('fish', { defaultValue: 'Fish' })}
          </CardTitle>
          <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {summary.fish.quantity.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {summary.fish.batches}{' '}
            {t('common:batches', { defaultValue: 'batches' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('totalInvestment', {
              defaultValue: 'Total Investment',
            })}
          </CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {formatCurrency(summary.overall.totalInvestment)}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {summary.overall.depletedBatches}{' '}
            {t('depletedBatches', {
              defaultValue: 'depleted batches',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
