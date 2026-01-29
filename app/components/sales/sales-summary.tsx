import { useTranslation } from 'react-i18next'
import { Bird, Egg, Fish, TrendingUp } from 'lucide-react'
import { SummaryCard } from '~/components/ui/summary-card'

interface SalesSummaryData {
  poultry: { count: number; quantity: number; revenue: number }
  fish: { count: number; quantity: number; revenue: number }
  eggs: { count: number; quantity: number; revenue: number }
  total: { count: number; quantity: number; revenue: number }
}

interface SalesSummaryProps {
  summary: SalesSummaryData
  formatCurrency: (value: string | number) => string
}

export function SalesSummary({ summary, formatCurrency }: SalesSummaryProps) {
  const { t } = useTranslation(['sales'])

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
      <SummaryCard
        title={t('summaries.totalRevenue')}
        value={formatCurrency(summary.total.revenue)}
        icon={TrendingUp}
        description={`${summary.total.count} ${t('summaries.sales')}`}
        className="text-success"
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
        title={t('livestockTypes.eggs')}
        value={formatCurrency(summary.eggs.revenue)}
        icon={Egg}
        description={`${summary.eggs.quantity} ${t('summaries.units')}`}
      />
    </div>
  )
}
