import { TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SummaryCard } from '~/components/ui/summary-card'
import { useFormatCurrency } from '~/features/settings'

interface FarmStatsRowProps {
  stats: {
    batches: {
      totalLivestock: number
      active: number
    }
    sales: {
      revenue: number
      count: number
    }
    expenses: {
      amount: number
      count: number
    }
  }
}

export function FarmStatsRow({ stats }: FarmStatsRowProps) {
  const { t } = useTranslation(['farms'])
  const { format: formatCurrency } = useFormatCurrency()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-8">
      <SummaryCard
        title={t('farms:dashboard.livestock')}
        value={stats.batches.totalLivestock.toLocaleString()}
        icon={Users}
        description={t('farms:dashboard.activeBatches', {
          count: stats.batches.active,
        })}
      />
      <SummaryCard
        title={t('farms:dashboard.revenue')}
        value={formatCurrency(stats.sales.revenue)}
        icon={TrendingUp}
        description={t('farms:dashboard.salesTransactions', {
          count: stats.sales.count,
        })}
      />
      <SummaryCard
        title={t('farms:dashboard.expenses')}
        value={formatCurrency(stats.expenses.amount)}
        icon={TrendingDown}
        description={t('farms:dashboard.expenseRecords', {
          count: stats.expenses.count,
        })}
      />
    </div>
  )
}
