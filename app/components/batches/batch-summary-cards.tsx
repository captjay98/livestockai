import { Bird, Fish, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SummaryCard } from '~/components/ui/summary-card'
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
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6">
      <SummaryCard
        title={t('totalLivestock', { defaultValue: 'Total Livestock' })}
        value={summary.overall.totalQuantity.toLocaleString()}
        icon={Users}
        iconClassName="bg-primary/10 text-primary"
        description={`${summary.overall.activeBatches} ${t('activeBatches', { defaultValue: 'active batches' })}`}
      />

      <SummaryCard
        title={t('poultry', { defaultValue: 'Poultry' })}
        value={summary.poultry.quantity.toLocaleString()}
        icon={Bird}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        description={`${summary.poultry.batches} ${t('common:batches', { defaultValue: 'batches' })}`}
      />

      <SummaryCard
        title={t('fish', { defaultValue: 'Fish' })}
        value={summary.fish.quantity.toLocaleString()}
        icon={Fish}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        description={`${summary.fish.batches} ${t('common:batches', { defaultValue: 'batches' })}`}
      />

      <SummaryCard
        title={t('totalInvestment', { defaultValue: 'Total Investment' })}
        value={formatCurrency(summary.overall.totalInvestment)}
        icon={TrendingUp}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        description={`${summary.overall.depletedBatches} ${t('depletedBatches', { defaultValue: 'depleted batches' })}`}
      />
    </div>
  )
}
