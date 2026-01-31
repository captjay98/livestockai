import { useTranslation } from 'react-i18next'
import { Beef, Bird, Cloud, Disc, Fish, Trees, TrendingUp } from 'lucide-react'
import { SummaryCard } from '~/components/ui/summary-card'

interface SalesSummaryData {
  poultry: { count: number; quantity: number; revenue: number }
  fish: { count: number; quantity: number; revenue: number }
  cattle: { count: number; quantity: number; revenue: number }
  goats: { count: number; quantity: number; revenue: number }
  sheep: { count: number; quantity: number; revenue: number }
  bees: { count: number; quantity: number; revenue: number }
  total: { count: number; quantity: number; revenue: number }
}

export type { SalesSummaryData }

interface SalesSummaryProps {
  summary: SalesSummaryData
  formatCurrency: (value: string | number) => string
}

export function SalesSummary({ summary, formatCurrency }: SalesSummaryProps) {
  const { t } = useTranslation(['sales'])

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
      <SummaryCard
        title={t('summaries.totalRevenue')}
        value={formatCurrency(summary.total.revenue)}
        icon={TrendingUp}
        description={`${summary.total.count} ${t('summaries.sales')}`}
        className="col-span-2 lg:col-span-1 border-primary/20 bg-primary/5"
      />

      <SummaryCard
        title={t('livestockTypes.poultry')}
        value={formatCurrency(summary.poultry.revenue)}
        icon={Bird}
        description={`${summary.poultry.quantity} ${t('summaries.units')}`}
      />

      <SummaryCard
        title={t('livestockTypes.fish')}
        value={formatCurrency(summary.fish.revenue)}
        icon={Fish}
        description={`${summary.fish.quantity} ${t('summaries.units')}`}
      />

      <SummaryCard
        title={t('livestockTypes.cattle')}
        value={formatCurrency(summary.cattle.revenue)}
        icon={Beef}
        description={`${summary.cattle.quantity} ${t('summaries.units')}`}
      />

      <SummaryCard
        title={t('livestockTypes.goats')}
        value={formatCurrency(summary.goats.revenue)}
        icon={Trees}
        description={`${summary.goats.quantity} ${t('summaries.units')}`}
      />

      <SummaryCard
        title={t('livestockTypes.sheep')}
        value={formatCurrency(summary.sheep.revenue)}
        icon={Disc}
        description={`${summary.sheep.quantity} ${t('summaries.units')}`}
      />

      <SummaryCard
        title={t('livestockTypes.bees')}
        value={formatCurrency(summary.bees.revenue)}
        icon={Cloud}
        description={`${summary.bees.quantity} ${t('summaries.units')}`}
      />
    </div>
  )
}
